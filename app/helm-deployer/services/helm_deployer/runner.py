import asyncio
from pathlib import Path
from typing import Optional, List, Dict, Any


class HelmRunner:
    def __init__(self, helm_bin: str = "helm"):
        self.helm_bin = helm_bin

    # all commands generator in one method 
    async def _run_command(self, cmd: List[Any], timeout: int = 300) -> str:
        cmd_strs = [str(arg) for arg in cmd]
        try:
            process = await asyncio.create_subprocess_exec(
                *cmd_strs, # always get list commands from object
                stdout=asyncio.subprocess.PIPE,   # buffers to save stdout and stderr this proccess
                stderr=asyncio.subprocess.PIPE
            )

            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                process.communicate(), timeout=timeout
            )

            stdout = stdout_bytes.decode("utf-8").strip()
            stderr = stderr_bytes.decode("utf-8").strip()

            if process.returncode != 0:
                cmd_str = " ".join(cmd_strs)
                raise RuntimeError(
                    f"Helm CLI command failed with code {process.returncode}.\n"
                    f"Command: {cmd_str}\n"
                    f"Error: {stderr}"
                )

            return stdout

        except asyncio.TimeoutError:
            raise RuntimeError(f"Helm CLI command timed out after {timeout} seconds: {' '.join(cmd_strs)}")
        except FileNotFoundError:
            raise RuntimeError(
                f"Helm binary '{self.helm_bin}' was not found. Please ensure Helm is installed and in PATH."
            )

    async def template(
        self,
        chart_path: str,
        release_name: str = "template-check",
        values_file: Optional[str] = None
    ) -> str:
        cmd = [self.helm_bin, "template", release_name, chart_path]
        if values_file:
            cmd.extend(["-f", values_file])

        return await self._run_command(cmd)

    async def upgrade_install(
        self,
        release_name: str,
        chart_path: str,
        kubeconfig_path: str,
        namespace: str = "default",
        values_file: Optional[str] = None,
        wait: bool = False,
        timeout: int = 300
    ) -> str:


        cmd = [
            self.helm_bin,
            "upgrade",
            "--install",
            release_name,
            chart_path,
            "--namespace",
            namespace,
            "--kubeconfig",
            kubeconfig_path,
            "--create-namespace"
        ]

        if values_file:
            cmd.extend(["-f", values_file])

        if wait:
            cmd.append("--wait")

        cmd.extend(["--timeout", f"{timeout}s"])

        # Return list in method _run_command
        return await self._run_command(cmd, timeout=timeout + 30)
        

    async def uninstall(
        self,
        release_name: str,
        kubeconfig_path: str,
        namespace: str = "default"
    ) -> str:
 
        cmd = [
            self.helm_bin,
            "uninstall",
            release_name,
            "--namespace",
            namespace,
            "--kubeconfig",
            kubeconfig_path
        ]
        return await self._run_command(cmd)

    async def status(
        self,
        release_name: str,
        kubeconfig_path: str,
        namespace: str = "default"
    ) -> str:
 
        cmd = [
            self.helm_bin,
            "status",
            release_name,
            "--namespace",
            namespace,
            "--kubeconfig",
            kubeconfig_path
        ]
        return await self._run_command(cmd)
