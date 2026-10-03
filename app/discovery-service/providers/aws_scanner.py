import json
import base64
import aioboto3
from typing import List, Dict, Any
from providers.base import BaseClusterScanner
from botocore.exceptions import ClientError
from botocore.session import get_session
from botocore.credentials import Credentials
from botocore.signers import RequestSigner


def generate_eks_token(cluster_name: str, access_key: str, secret_key: str, region: str, session_token: str = None) -> str:
    """Generate AWS EKS Bearer token via STS GetCallerIdentity presigned URL."""
    session = get_session()
    client = session.create_client(
        'sts',
        region_name=region,
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        aws_session_token=session_token
    )
    signer = client._request_signer
    request_params = {
        'method': 'GET',
        'url': f'https://sts.{region}.amazonaws.com/?Action=GetCallerIdentity&Version=2011-06-15',  # REST API of server AWS STS
        'body': {},
        'headers': {
            'x-k8s-aws-id': cluster_name
        },
        'context': {}
    }
    signed_url = signer.generate_presigned_url( # signed by aws_secret_access_key (HMAC-SHA256)
        request_dict=request_params,
        expires_in=900,
        operation_name='GetCallerIdentity'
    )

    # convert string to base64 for valid token in request header
    base64_url = base64.urlsafe_b64encode(signed_url.encode('utf-8')).decode('utf-8').rstrip('=')
    return f"k8s-aws-v1.{base64_url}" # token


class AWSClusterScanner(BaseClusterScanner):
    async def scan_clusters(self, credentials: Dict[str, Any], region: str = None) -> List[Dict[str, Any]]:
        access_key = credentials.get("aws_access_key_id") or credentials.get("access_key_id") or credentials.get("access_key")
        secret_key = credentials.get("aws_secret_access_key") or credentials.get("secret_access_key") or credentials.get("secret_key")

        cred_region = credentials.get("aws_region") or credentials.get("region")
        target_region = (region if region and str(region).strip() else None) or (cred_region if cred_region and str(cred_region).strip() else None) or "us-east-1"

        session = aioboto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            region_name=target_region
        )

        clusters_data = []
        try:
            async with session.client("eks") as eks_client:
                response = await eks_client.list_clusters()  # in response we get json from aws with key "clusters" and value is list of cluster names
                cluster_names = response.get("clusters", []) # get only list of clusters from key "clusters"

                for name in cluster_names:
                    cluster_info = await eks_client.describe_cluster(name=name) # name - embedded arg
                    c_data = cluster_info.get("cluster", {}) # dict data
                    clean_raw = json.loads(json.dumps(c_data, default=str))
                    clusters_data.append({
                        "name": c_data.get("name"),
                        "region": target_region,
                        "version": c_data.get("version"),
                        "status": c_data.get("status", "ACTIVE").lower(),
                        "endpoint": c_data.get("endpoint"),
                        "ca_cert": c_data.get("certificateAuthority", {}).get("data"),
                        "raw": clean_raw
                    })
        except Exception as e:
            raise RuntimeError(f"AWS EKS discovery error in region '{target_region}': {str(e)}")

        return clusters_data


    async def creation_token(self, cloud_creds: dict, cluster_name: str) -> str:
        access_key = cloud_creds.get("aws_access_key_id") or cloud_creds.get("access_key_id") or cloud_creds.get("access_key")
        secret_key = cloud_creds.get("aws_secret_access_key") or cloud_creds.get("secret_access_key") or cloud_creds.get("secret_key")
        region = cloud_creds.get("aws_region") or cloud_creds.get("region") or "us-east-1"
        session_token = cloud_creds.get("aws_session_token")

        if not access_key or not secret_key:
            raise ValueError("AWS Access Key and Secret Key required for token creating.")


        token = generate_eks_token(
            cluster_name=cluster_name,
            access_key=access_key,
            secret_key=secret_key,
            region=region,
            session_token=session_token
        )
        return token

    async def authorize_access_entry(self, credentials: Dict[str, Any], cluster_name: str, region: str = None) -> Dict[str, Any]:
        access_key = credentials.get("aws_access_key_id") or credentials.get("access_key_id") or credentials.get("access_key")
        secret_key = credentials.get("aws_secret_access_key") or credentials.get("secret_access_key") or credentials.get("secret_key")
        session_token = credentials.get("aws_session_token")

        cred_region = credentials.get("aws_region") or credentials.get("region")
        target_region = (region if region and str(region).strip() else None) or (cred_region if cred_region and str(cred_region).strip() else None) or "us-east-1"

        if not access_key or not secret_key:
            raise ValueError("AWS Access Key and Secret Key required for authorizing access entry.")

        session = aioboto3.Session(
            aws_access_key_id=access_key,
            aws_secret_access_key=secret_key,
            aws_session_token=session_token,
            region_name=target_region
        )

        async with session.client("sts") as sts_client:
            caller = await sts_client.get_caller_identity()
            principal_arn = caller.get("Arn")

        if not principal_arn:
            raise ValueError("Failed to retrieve IAM Principal ARN from AWS STS.")

        if ":sts::" in principal_arn and ":assumed-role/" in principal_arn:
            parts = principal_arn.split(":assumed-role/")
            if len(parts) == 2:
                account = parts[0].split(":")[-1] # account id
                role_name = parts[1].split("/")[0] # role_name
                principal_arn = f"arn:aws:iam::{account}:role/{role_name}"

        async with session.client("eks") as eks_client:
            # 1. Verify and ensure EKS Authentication Mode is set to API or API_AND_CONFIG_MAP
            try:
                cluster_desc = await eks_client.describe_cluster(name=cluster_name)
                access_cfg = cluster_desc.get("cluster", {}).get("accessConfig") or {}
                auth_mode = access_cfg.get("authenticationMode")

                if auth_mode not in ["API", "API_AND_CONFIG_MAP"]:
                    try:
                        await eks_client.update_cluster_config(
                            name=cluster_name,
                            accessConfig={"authenticationMode": "API_AND_CONFIG_MAP"}
                        )
                        # Poll for authentication mode transition (up to 30 seconds)
                        import asyncio
                        for _ in range(15):
                            await asyncio.sleep(2)
                            poll_desc = await eks_client.describe_cluster(name=cluster_name)
                            current_mode = (poll_desc.get("cluster", {}).get("accessConfig") or {}).get("authenticationMode")
                            if current_mode in ["API", "API_AND_CONFIG_MAP"]:
                                break
                    except Exception as upd_err:
                        upd_err_msg = str(upd_err)
                        if "AccessDenied" in upd_err_msg or "not authorized" in upd_err_msg.lower():
                            raise RuntimeError(
                                f"EKS cluster '{cluster_name}' authentication mode is currently '{auth_mode or 'CONFIG_MAP'}'. "
                                f"Automatic update to 'API_AND_CONFIG_MAP' failed: IAM user lacks 'eks:UpdateClusterConfig' permission. "
                                f"Please update the authentication mode in AWS EKS Console or via: "
                                f"'aws eks update-cluster-config --name {cluster_name} --access-config authenticationMode=API_AND_CONFIG_MAP'"
                            )
            except Exception as desc_err:
                if "EKS cluster" in str(desc_err):
                    raise desc_err

            # 2. Create access entry for IAM user in target cluster
            try:
                await eks_client.create_access_entry(
                    clusterName=cluster_name,
                    principalArn=principal_arn,
                    type="STANDARD"
                )
            except Exception as e:
                err_msg = str(e)
                if "ResourceInUseException" not in err_msg and "already exists" not in err_msg.lower() and "already in use" not in err_msg.lower():
                    if "authentication mode must be set to" in err_msg:
                        raise RuntimeError(
                            f"Failed to create EKS Access Entry: EKS cluster '{cluster_name}' is not in API_AND_CONFIG_MAP mode. "
                            f"Please run in AWS CLI: 'aws eks update-cluster-config --name {cluster_name} --region {target_region} --access-config authenticationMode=API_AND_CONFIG_MAP' "
                            f"and retry in a few seconds."
                        )
                    raise RuntimeError(f"Failed to create EKS Access Entry: {err_msg}")

            # associate access policy for iam user
            try:
                await eks_client.associate_access_policy(
                    clusterName=cluster_name,
                    principalArn=principal_arn, # iam user arn 
                    policyArn="arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy",
                    accessScope={"type": "cluster"}
                )
            except Exception as e:
                err_msg = str(e)
                if "ResourceInUseException" not in err_msg and "already associated" not in err_msg.lower():
                    raise RuntimeError(f"Failed to associate cluster admin policy: {err_msg}")

        return {
            "status": "success",
            "principal_arn": principal_arn,
            "cluster_name": cluster_name,
            "policy_arn": "arn:aws:eks::aws:cluster-access-policy/AmazonEKSClusterAdminPolicy",
            "message": f"Successfully authorized access entry for {principal_arn} in cluster {cluster_name} with ClusterAdmin permissions."
        }
