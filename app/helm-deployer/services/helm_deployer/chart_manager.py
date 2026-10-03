from pathlib import Path
import asyncio


class ChartManager:
    def __init__(self, base_temp_dir: str = "/tmp/helm_charts"):
        self.base_temp_dir = Path(base_temp_dir)
        self.base_temp_dir.mkdir(parents=True, exist_ok=True)

    async def pull_and_unpack_chart(self, repo_url: str, chart_name: str, chart_version: str, release_name: str):
        # Local path for dir
        release_dir = self.base_temp_dir / release_name
        release_dir.mkdir(parents=True, exist_ok=True)

        cmd = ["helm", "pull", chart_name, "--repo", repo_url, "--untar", "--untardir", str(release_dir)]

        if chart_version and chart_version not in ["latest", "", None]:
            cmd.extend(["--version", chart_version])

        process = await asyncio.create_subprocess_exec(
            *cmd,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        stdout, stderr = await process.communicate()
        if process.returncode != 0:
            raise Exception(f"Failed to pull chart: {stderr.decode('utf-8')}")

        chart_extracted_path = release_dir / chart_name
        if chart_extracted_path.exists():
            return str(chart_extracted_path)

        return str(release_dir)

    

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

 