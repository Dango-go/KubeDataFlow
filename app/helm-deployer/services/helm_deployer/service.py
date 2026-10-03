import shutil
from pathlib import Path
from typing import Optional, Dict, Any
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, update
from db.models.models import HelmChartDB

from services.helm_deployer.chart_manager import ChartManager
from services.helm_deployer.validator import HelmValidator
from services.helm_deployer.kubeconfig_builder import KubeconfigBuilder
from services.helm_deployer.runner import HelmRunner
import httpx
import os
from fastapi import HTTPException



class HelmService:
    def __init__(self, db_session: Optional[AsyncSession] = None):
        self.db_session = db_session
        self.chart_manager = ChartManager()
        self.kubeconfig_builder = KubeconfigBuilder()
        self.helm_runner = HelmRunner()
        self.validator = HelmValidator()

    # INSTALL AND UNPACK CHART
    async def get_and_unpack(
        self,
        chart_repo_url: str,
        chart_name: str,
        chart_version: str,
        release_name: str   
    ):
        self.validator.validate_release_name(release_name)


        chart_dir = await self.chart_manager.pull_and_unpack_chart(
            repo_url=chart_repo_url,
            chart_name=chart_name,
            chart_version=chart_version,
            release_name=release_name
        )
        self.validator.validate_chart_directory(chart_dir)

        return chart_dir

    """read file"""
    async def read_chart_file(self, release_name: str, file_path: str = "values.yaml"):
        self.validator.validate_release_name(release_name)
        return await self.chart_manager.read_chart_file(release_name=release_name, file_path=file_path)

    """list all chart files"""
    async def list_chart_files(self, release_name: str) -> list:
        self.validator.validate_release_name(release_name)
        return await self.chart_manager.list_chart_files(release_name=release_name)



    #SAVE FILE
    async def save_chart_file(self, release_name: str, file_path: str, content: str):
        self.validator.validate_release_name(release_name)

        if file_path.endswith(".yaml") or file_path.endswith(".yml"):
            self.validator.validate_yaml_content(content)

        # SAVE FILE
        return await self.chart_manager.save_chart_file(
            release_name=release_name,
            file_path=file_path,
            content=content
        )

    # CREATE CUSTOM FILE (e.g. custom-values.yaml)
    async def create_custom_file(self, release_name: str, file_name: str, content: str) -> str:
        self.validator.validate_release_name(release_name)
        if not file_name.endswith(".yaml") and not file_name.endswith(".yml"):
            file_name = f"{file_name}.yaml"

        self.validator.validate_yaml_content(content)

        return await self.chart_manager.save_chart_file(
            release_name=release_name,
            file_path=file_name,
            content=content
        )

    async def check_template(self, release_name: str, chart_name: str, values_file: Optional[str] = None):
        self.validator.validate_release_name(release_name)
        chart_dir = self.chart_manager.base_temp_dir / release_name / chart_name
        if not chart_dir.exists():
            chart_dir = self.chart_manager.base_temp_dir / release_name

        self.validator.validate_chart_directory(str(chart_dir))
        return await self.helm_runner.template(
            chart_path=str(chart_dir),
            release_name=release_name,
            values_file=values_file
        )

    """apply and install chart to cluster"""
    async def apply_release(
        self,
        cluster_name: str,
        namespace: str,
        release_name: str,
        chart_name: str,
        provider_name: Optional[str] = None,
        release_version: Optional[str] = "latest",
        target_values_file: Optional[str] = None,
        chart_content: Optional[str] = None
    ):
        self.validator.validate_release_name(release_name)
        self.validator.validate_namespace(namespace)

        DISCOVERY_SERVICE_URL = os.getenv("DISCOVERY_SERVICE_URL", "http://discovery-service:8001")
        async with httpx.AsyncClient(timeout=15.0) as client:
            try:
                response = await client.get(f"{DISCOVERY_SERVICE_URL}/api/v1/discovery/cluster/{cluster_name}")
                if response.status_code == 404:
                    raise HTTPException(status_code=404, detail=f"Cluster '{cluster_name}' not found in discovery-service")
                response.raise_for_status()
                cluster_data = response.json()
            except HTTPException:
                raise
            except Exception as e:
                raise HTTPException(status_code=500, detail=f"Failed to fetch cluster details from discovery-service: {str(e)}")

        cluster_name = cluster_data.get("cluster_name") or cluster_name
        api_server_url = cluster_data.get("endpoint") or ""
        ca_cert_data = cluster_data.get("ca_cert") or ""
        token = cluster_data.get("token") or ""
        provider_type = provider_name or cluster_data.get("provider_type") or "unknown"

        if not token:
            raise HTTPException(
                status_code=400,
                detail=f"No access token found for cluster '{cluster_name}'. Please click 'Create SA Token' first."
            )

        chart_path = self.chart_manager.base_temp_dir / release_name / chart_name
        if not chart_path.exists():
            chart_path = self.chart_manager.base_temp_dir / release_name

        self.validator.validate_chart_directory(str(chart_path))

        """Creating kubeconfig path and generating content in kubeconfig file. After uprgrade chart - delete kubeconfig file"""
        kubeconfig_path = await self.kubeconfig_builder.fast_creating(
            cluster_name=cluster_name,
            release_name=release_name,
            ca_cert_data=ca_cert_data,
            api_server_url=api_server_url,
            token=token,
            namespace=namespace
        )

        # install or upgrade chart
        try:
            values_file_path = None
            if target_values_file:
                cand = self.chart_manager.base_temp_dir / release_name / target_values_file
                if not cand.exists():
                    matches = list((self.chart_manager.base_temp_dir / release_name).glob(f"**/{target_values_file}"))
                    if matches:
                        cand = matches[0]
                values_file_path = str(cand) if cand.exists() else target_values_file

            result = await self.helm_runner.upgrade_install(
                release_name=release_name,
                chart_path=str(chart_path),
                kubeconfig_path=str(kubeconfig_path),
                namespace=namespace,
                values_file=values_file_path,
                wait=False
            )

            # saving to database
            if self.db_session:
                request = select(HelmChartDB).where(
                    HelmChartDB.release_name == release_name,
                    HelmChartDB.cluster_name == cluster_name
                )
                res = await self.db_session.execute(request)
                chart = res.scalar_one_or_none()

                if chart:
                    if target_values_file and chart_content:
                        updated_files = dict(chart.custom_yaml_files or {})
                        updated_files[target_values_file] = chart_content
                        chart.custom_yaml_files = updated_files
                else:
                    custom_files = {target_values_file: chart_content} if target_values_file and chart_content else {}
                    new_chart = HelmChartDB(
                        provider_name=provider_type,
                        cluster_name=cluster_name,
                        chart_name=chart_name,
                        release_name=release_name,
                        release_version=release_version or "latest",
                        namespace=namespace,
                        custom_yaml_files=custom_files
                    )
                    self.db_session.add(new_chart)

                await self.db_session.commit()

            return result
            
        finally:
            if kubeconfig_path.exists():
                try:
                    print(f"[DEBUG KUBECONFIG]:\n{open(kubeconfig_path).read()}")

                    #kubeconfig_path.unlink()
                except Exception as e:
                    print(f"Error occurred while unlinking kubeconfig: {e}")


    async def rm_release(
        self,
        cluster_name: str,
        release_name: str,
        ca_cert_data: Optional[str] = None, 
        api_server_url: Optional[str] = None, 
        token: Optional[str] = None,
        user_name: str = "cluster-admin",
        namespace: str = "default",
    ):
        self.validator.validate_release_name(release_name)
        self.validator.validate_namespace(namespace)

        if not token or not api_server_url:
            DISCOVERY_SERVICE_URL = os.getenv("DISCOVERY_SERVICE_URL", "http://discovery-service:8001")
            async with httpx.AsyncClient(timeout=15.0) as client:
                try:
                    response = await client.get(f"{DISCOVERY_SERVICE_URL}/api/v1/discovery/cluster/{cluster_name}")
                    if response.status_code == 200:
                        cluster_data = response.json()
                        cluster_name = cluster_name or cluster_data.get("cluster_name") or ""
                        api_server_url = api_server_url or cluster_data.get("endpoint") or ""
                        ca_cert_data = ca_cert_data or cluster_data.get("ca_cert") or ""
                        token = token or cluster_data.get("token") or ""
                except Exception as e:
                    print(f"Failed to fetch cluster details from discovery: {e}")

        kubeconfig_path = await self.kubeconfig_builder.fast_creating(
            cluster_name=cluster_name,
            release_name=release_name,
            ca_cert_data=ca_cert_data or "",
            api_server_url=api_server_url or "",
            token=token or "",
            user_name=user_name,
            namespace=namespace
        )

        try:
            uninstalled = await self.helm_runner.uninstall(
                release_name=release_name,
                kubeconfig_path=str(kubeconfig_path),
                namespace=namespace
            )

            release_dir = self.chart_manager.base_temp_dir / release_name
            if release_dir.exists():
                shutil.rmtree(release_dir, ignore_errors=True)

            if self.db_session:
                request = select(HelmChartDB).where(
                    HelmChartDB.release_name == release_name,
                    HelmChartDB.cluster_name == cluster_name
                )
                res = await self.db_session.execute(request)
                chart = res.scalar_one_or_none()
                if chart:
                    await self.db_session.delete(chart)
                    await self.db_session.commit()

            return uninstalled
        finally:
            if kubeconfig_path.exists():
                try:
                    kubeconfig_path.unlink()
                except Exception as e:
                    print(f"Error occurred while unlinking kubeconfig: {e}")