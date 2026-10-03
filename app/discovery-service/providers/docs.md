**AWS**
*request* JSON which need for discovery_EKS_cluster to get full info about clusters in some region:
        
    session = aioboto3.Session(
        aws_access_key_id=access_key,
        aws_secret_access_key=secret_key,
        region_name=target_region
    )

*response*

    cluster_info = {
        "cluster": {
            "name": "prod-eks-1",
            "version": "1.28",                                            # Kubernetes Version
            "status": "ACTIVE",                                           # (ACTIVE, CREATING, DELETING)
            "endpoint": "https://ABC123456.gr7.us-east-1.eks.amazonaws.com", # URL API-сервера K8s
            "arn": "arn:aws:eks:us-east-1:123456789012:cluster/prod-eks-1",
            "resourcesVpcConfig": {
                "vpcId": "vpc-0a1b2c3d4e5f",
                "subnetIds": ["subnet-01", "subnet-02"]
            }
        }
    }


