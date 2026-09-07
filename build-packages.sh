#!/usr/bin/env bash
set -euo pipefail

root=$(CDPATH= cd -- "$(dirname -- "$0")" && pwd)
repo_url="https://raw.githubusercontent.com/OreoMuncher45/spotiflac-extensions/main/extensions"

rm -f "$root"/extensions/*.sflx
python3 - "$root" <<'PY'
import pathlib
import sys
import zipfile

root = pathlib.Path(sys.argv[1])
for package in sorted((root / "packages").iterdir()):
    archive = root / "extensions" / f"{package.name}.sflx"
    with zipfile.ZipFile(archive, "w", compression=zipfile.ZIP_DEFLATED) as output:
        for filename in ("manifest.json", "index.js"):
            output.write(package / filename, filename)
PY

python3 - "$root" "$repo_url" <<'PY'
import hashlib
import json
import pathlib
import sys

root = pathlib.Path(sys.argv[1])
repo_url = sys.argv[2]
entries = []
for package in sorted((root / "packages").iterdir()):
    manifest = json.loads((package / "manifest.json").read_text())
    archive = root / "extensions" / f"{package.name}.sflx"
    entries.append({
        "id": manifest["name"],
        "name": manifest["name"],
        "display_name": manifest["displayName"],
        "version": manifest["version"],
        "description": manifest["description"],
        "download_url": f"{repo_url}/{archive.name}",
        "sha256": hashlib.sha256(archive.read_bytes()).hexdigest(),
        "category": "download",
        "tags": ["metadata", "download", "lossless"],
        "min_app_version": manifest.get("minAppVersion", "4.2.3"),
    })
(root / "registry.json").write_text(json.dumps({
    "version": 1,
    "updated_at": "2026-09-07T00:00:00Z",
    "extensions": entries,
}, indent=2) + "\n")
PY

printf 'Built %s packages\n' "$(find "$root/extensions" -maxdepth 1 -name '*.sflx' | wc -l)"
