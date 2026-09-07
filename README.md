# SpotiFLAC Mobile Community Extensions

Community extensions for [SpotiFLAC Mobile](https://github.com/spotiflacapp/SpotiFLAC-Mobile).

## Install

In SpotiFLAC Mobile, open **Store**, choose an extension repository, and use:

```text
https://raw.githubusercontent.com/OreoMuncher45/spotiflac-extensions/main/registry.json
```

The repository contains `.sflx` packages using SpotiFLAC Mobile's extension format. It is independent from the SpotiFLAC project and is not affiliated with Spotify, TIDAL, Qobuz, or Monochrome.

## Extensions

- `monochrome-tidal`: metadata and download adapter for Monochrome/TIDAL-compatible JSON APIs. It tries all eight API candidates listed by the Monochrome project, starting with `monochrome-api.samidy.com`, and skips UI-only hosts such as `monochrome.tf`. Configure **Preferred API URL** to change the first candidate. The adapter includes the required `checkAvailability` hook and resolves tracks selected from another search provider by title, artist, and duration.
- `qobuz-official`: credential-driven Qobuz adapter scaffold. It is disabled until a compatible private API gateway and valid account credentials are configured.
- `ytmusic-spotiflac`: the official upstream YouTube Music extension, linked directly from the SpotiFLAC extension project. It provides YouTube Music search, album/artist/playlist browsing, downloads, and a recommendation home feed.

Both packages explicitly advertise custom search providers. After installing an extension, enable it under **Settings > Extensions**, then select it under the app's search-provider control. If an extension is disabled or its API is unavailable, it will not return search results even though it remains installed.

The YouTube Music package is maintained by the upstream SpotiFLAC extension project and is referenced rather than repackaged here. Its source registry entry is [spotiflacapp/SpotiFLAC-Extension](https://github.com/spotiflacapp/SpotiFLAC-Extension).

These extensions do not bypass subscriptions, harvest credentials, or circumvent DRM. Use only with services and accounts you are authorized to access.

## Development

Each package contains `manifest.json` and `index.js` at its archive root. To rebuild packages after editing:

```bash
./build-packages.sh
```

The script updates package checksums in `registry.json`.
