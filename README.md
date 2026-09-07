# SpotiFLAC Mobile Community Extensions

Community extensions for [SpotiFLAC Mobile](https://github.com/spotiflacapp/SpotiFLAC-Mobile).

## Install

In SpotiFLAC Mobile, open **Store**, choose an extension repository, and use:

```text
https://raw.githubusercontent.com/OreoMuncher45/spotiflac-extensions/main/registry.json
```

The repository contains `.sflx` packages using SpotiFLAC Mobile's extension format. It is independent from the SpotiFLAC project and is not affiliated with Spotify, TIDAL, Qobuz, or Monochrome.

## Extensions

- `monochrome-tidal`: metadata and download adapter for a Monochrome/TIDAL-compatible JSON service. Configure the service base URL in the extension settings. The default public web route may serve HTML rather than API JSON.
- `qobuz-official`: credential-driven Qobuz adapter scaffold. It is disabled until a compatible private API gateway and valid account credentials are configured.

These extensions do not bypass subscriptions, harvest credentials, or circumvent DRM. Use only with services and accounts you are authorized to access.

## Development

Each package contains `manifest.json` and `index.js` at its archive root. To rebuild packages after editing:

```bash
./build-packages.sh
```

The script updates package checksums in `registry.json`.
