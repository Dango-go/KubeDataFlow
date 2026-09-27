import os, shutil, tempfile
from pathlib import Path
import httpx
import tarfile, gzip
import yaml


class ChartManager:
    def __init__(self, base_temp_dir: str = "/tmp/helm_charts"):
        self.base_temp_dir = Path(base_temp_dir)
        self.base_temp_dir.mkdir(parents=True, exist_ok=True)

    async def pull_and_unpack_chart(self, repo_url: str, chart_name: str, chart_version: str, release_name: str):
        # Local path for dir
        release_dir = self.base_temp_dir / release_name
        release_dir.mkdir(parents=True, exist_ok=True)

        #repo url
        url = repo_url.rstrip("/")
        chart_url_index_yaml =  f"{url}.index.yaml"
        chart_download_url = None

        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            try:
                index_resp = await client.get(chart_url_index_yaml)
                if index_resp.status_code == 200:
                    index_data = yaml.safe_load(index_resp.text)
                    entries = index_data.get("entries", {}).get(chart_name, [])
                else:
                    return f"Error {index_resp.status_code} while installing {chart_url_index_yaml}"
        
                for entry in entries:
                    if chart_version in ["latest", "", None] or entry.get("version") == chart_version:
                        target_entry = entry
                        break

                if target_entry and target_entry['urls']:
                    chart_url = target_entry['urls'][0]
                    if chart_url.startswith("http://") or chart_url.startswith("https://"):
                        chart_download_url = chart_url
                    
            except Exception as e:
                print(f"Failed to parse index.yaml from {chart_url_index_yaml}: {e}")
                    



        # netrequest + install
        async with httpx.AsyncClient() as client: 
            # response.content had bytes of the .tgz file 
            response = await client.get(chart_download_url, follow_redirects=True)
            if response.status_code != 200:
                raise Exception(f"Failed to download chart from {chart_url}, status: {response.status_code}")

            archive_path = release_dir / f"{chart_name}.tgz"
            # save response.content in dir of archive_path
            archive_path.write_bytes(response.content)


        with tarfile.open(archive_path, "r:gz") as tar:
            # unpack .tgz
            tar.extractall(path=release_dir)

            # rm .tgz file after unpacking
            archive_path.unlink(missing_ok=True)
 
        chart_extracted_path = release_dir / chart_name
        if chart_extracted_path.exists():
            return str(chart_extracted_path)    
        
        return str(release_dir)  # return str(path_to_file)
    

    # READ AND RETURN content of file  
    async def read_chart_file(self, release_name: str, file_path: str) -> str:
        target_file = self.base_temp_dir / release_name / file_path
        if not target_file.exists():
            # Check inside any subdirectories (e.g. /tmp/helm_charts/release/postgresql/values.yaml)
            matches = list((self.base_temp_dir / release_name).glob(f"**/{file_path}"))
            if matches:
                target_file = matches[0]
            else:
                raise FileNotFoundError(f"File {file_path} from release {release_name} not found.")
        
        return target_file.read_text(encoding="utf-8")

    # SAVE   
    async def save_chart_file(self, release_name: str, file_path: str, content: str) -> str:
        target_file = self.base_temp_dir / release_name / file_path
        if not target_file.parent.exists():
            target_file.parent.mkdir(parents=True, exist_ok=True)

        target_file.write_text(content, encoding="utf-8")
        return str(target_file)

    # LIST ALL FILES IN RELEASE
    async def list_chart_files(self, release_name: str) -> list:
        release_dir = self.base_temp_dir / release_name
        if not release_dir.exists():
            return []

        files = []
        for path in release_dir.rglob("*"):
            if path.is_file() and not path.name.startswith("."):
                rel_path = str(path.relative_to(release_dir))
                files.append(rel_path)
        return sorted(files)

 