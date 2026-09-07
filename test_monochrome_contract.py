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
assert manifest["version"] == "0.2.0"
assert len(manifest["permissions"]["network"]) >= 8
assert "monochrome.tf" not in manifest["permissions"]["network"]
for host in [
    "monochrome-api.samidy.com",
    "api.monochrome.tf",
    "wolf.qqdl.site",
    "maus.qqdl.site",
    "vogel.qqdl.site",
    "katze.qqdl.site",
    "hund.qqdl.site",
    "tidal.kinoplus.online",
]:
    assert host in source
assert source.count("{") == source.count("}")
assert source.count("(") == source.count(")")

archive = ROOT / "extensions/monochrome-tidal.sflx"
with zipfile.ZipFile(archive) as package:
    assert sorted(package.namelist()) == ["index.js", "manifest.json"]
    assert package.read("index.js") == source.encode()

print("Monochrome cross-provider contract: valid")
