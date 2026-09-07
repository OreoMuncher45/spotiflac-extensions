import json
import pathlib
import re
import zipfile


ROOT = pathlib.Path(__file__).parent
source = (ROOT / "packages/monochrome-tidal/index.js").read_text()
manifest = json.loads((ROOT / "packages/monochrome-tidal/manifest.json").read_text())

required_functions = [
    "initialize",
    "searchTracks",
    "customSearch",
    "getTrack",
    "checkAvailability",
    "download",
]
for function in required_functions:
    assert re.search(r"function\s+" + function + r"\s*\(", source)
assert "prepared_context" in source
assert "monochromeTrackId" in source
assert manifest["searchBehavior"]["enabled"] is True
assert manifest["permissions"]["file"] is True
assert source.count("{") == source.count("}")
assert source.count("(") == source.count(")")

archive = ROOT / "extensions/monochrome-tidal.sflx"
with zipfile.ZipFile(archive) as package:
    assert sorted(package.namelist()) == ["index.js", "manifest.json"]
    assert package.read("index.js") == source.encode()

print("Monochrome cross-provider contract: valid")
