import httpx
import base64
import asyncio

# REST API. Create constant token for cluster using temp token  


class Saving_cluster_token: 

    @staticmethod
    async def create_token_and_save(
        temp_token: str,  
        api_server_url: str, 
    ):
        headers = {
            "Authorization": f"Bearer {temp_token}",
            "Content-Type": "application/json"
        }
        verify_ssl = False

        async with httpx.AsyncClient(verify=verify_ssl, timeout=15.0) as client:
            sa_name = "idp-sa-for-constant-token"
            secret_name = "idp-deployer-sa-token"
            namespace = "kube-system"
            base_url = api_server_url.rstrip("/")

            print(f"[SAVER_TOKEN] Connecting to {base_url} using temp_token (len={len(temp_token)})")

            # 1. Create ServiceAccount (ignore 409 if already exists)
            sa_url = f"{base_url}/api/v1/namespaces/{namespace}/serviceaccounts"
            sa_body = {
                "apiVersion": "v1",
                "kind": "ServiceAccount",
                "metadata": {"name": sa_name, "namespace": namespace}
            }
            resp_sa = await client.post(sa_url, json=sa_body, headers=headers)
            print(f"[SAVER_TOKEN] Create SA response: code={resp_sa.status_code}, text={resp_sa.text[:200]}")

            # 2. Create ClusterRoleBinding (ignore 409 if already exists)
            crb_url = f"{base_url}/apis/rbac.authorization.k8s.io/v1/clusterrolebindings"
            crb_body = {
                "apiVersion": "rbac.authorization.k8s.io/v1",
                "kind": "ClusterRoleBinding",
                "metadata": {"name": f"{sa_name}-binding"},
                "subjects": [{
                    "kind": "ServiceAccount",
                    "name": sa_name,
                    "namespace": namespace
                }],
                "roleRef": {
                    "kind": "ClusterRole",
                    "name": "cluster-admin",
                    "apiGroup": "rbac.authorization.k8s.io"
                }
            }
            resp_crb = await client.post(crb_url, json=crb_body, headers=headers)
            print(f"[SAVER_TOKEN] Create CRB response: code={resp_crb.status_code}, text={resp_crb.text[:200]}")

            
            # Endpoint to create tokenRequest  
            token_request_url = f"{base_url}/api/v1/namespaces/{namespace}/serviceaccounts/{sa_name}/token"
            token_request_body = {
                "apiVersion": "authentication.k8s.io/v1",
                "kind": "TokenRequest",
                "spec": {
                    "audiences": [
                        "https://kubernetes.default.svc",
                        base_url,
                        "https://kubernetes.default.svc.cluster.local",
                        "sts.amazonaws.com"
                    ],
                    "expirationSeconds": 315360000  # 10 years
                }
            }

            tr_resp = await client.post(token_request_url, json=token_request_body, headers=headers)
            
            print(f"[SAVER_TOKEN] TokenRequest response: code={tr_resp.status_code}, text={tr_resp.text[:200]}")
            
            if tr_resp.status_code == 201:
                tr_data = tr_resp.json()
                jwt_token = tr_data.get("status", {}).get("token")
                if jwt_token:
                    print(f"[SAVER_TOKEN] Successfully created TokenRequest JWT token (len={len(jwt_token)})")
                    return jwt_token

            # 4. If TokenRequest API Fallback: Create Secret (Token)
            secret_url = f"{base_url}/api/v1/namespaces/{namespace}/secrets"
            secret_body = {
                "apiVersion": "v1",
                "kind": "Secret",
                "metadata": {
                    "name": secret_name,
                    "namespace": namespace,
                    "annotations": {"kubernetes.io/service-account-token": sa_name} 
                },
                "type": "kubernetes.io/service-account-token"
            }
            resp_sec = await client.post(secret_url, json=secret_body, headers=headers)
            print(f"[SAVER_TOKEN] Create Secret response: code={resp_sec.status_code}, text={resp_sec.text[:200]}")

            # Poll for secret token generation
            get_secret_url = f"{base_url}/api/v1/namespaces/{namespace}/secrets/{secret_name}"
            for attempt in range(5):
                await asyncio.sleep(1)
                resp = await client.get(get_secret_url, headers=headers) # temp token to get access to new token from secrets
                print(f"[SAVER_TOKEN] Poll Secret attempt {attempt+1}: code={resp.status_code}")
                if resp.status_code == 200:
                    data = resp.json()
                    raw_b64_token = data.get("data", {}).get("token")
                    if raw_b64_token:
                        decoded = base64.b64decode(raw_b64_token).decode("utf-8")
                        print(f"[SAVER_TOKEN] Successfully fetched Secret JWT token (len={len(decoded)})")
                        return decoded
         
        print("[SAVER_TOKEN] Warning: Fallback to temp_token")
        return temp_token