var DEFAULT_API_URLS = [
  "https://monochrome-api.samidy.com",
  "https://api.monochrome.tf",
  "https://wolf.qqdl.site",
  "https://maus.qqdl.site",
  "https://vogel.qqdl.site",
  "https://katze.qqdl.site",
  "https://hund.qqdl.site",
  "https://tidal.kinoplus.online"
];
var config = { preferredApiUrl: DEFAULT_API_URLS[0] };

function text(value, fallback) {
  return value == null ? (fallback || "") : String(value);
}

function apiUrls() {
  var urls = [];
  var preferred = String(config.preferredApiUrl || "").replace(/\/$/, "");
  if (preferred) urls.push(preferred);
  DEFAULT_API_URLS.forEach(function (url) {
    if (urls.indexOf(url) < 0) urls.push(url);
  });
  return urls;
}

function requestJSON(path, options) {
  var lastError = "no API candidates";
  var candidates = apiUrls();
  for (var i = 0; i < candidates.length; i++) {
    try {
      var response = http.get(candidates[i] + path, options || { headers: { Accept: "application/json" } });
      if (!response || !response.ok) {
        lastError = candidates[i] + " returned HTTP " + (response && response.status);
        continue;
      }
      var contentType = String(response.headers && (response.headers["content-type"] || response.headers["Content-Type"]) || "").toLowerCase();
      if (contentType && contentType.indexOf("json") < 0) {
        lastError = candidates[i] + " returned " + contentType;
        continue;
      }
      return JSON.parse(response.body);
    } catch (error) {
      lastError = candidates[i] + ": " + String(error);
    }
  }
  throw new Error("All Monochrome API instances failed: " + lastError);
}

function itemsAt(root, key) {
  var data = root && root.data;
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== "object") return [];
  var value = data[key];
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.items)) return value.items;
  if (Array.isArray(data.items)) return data.items;
  if (Array.isArray(data.results)) return data.results;
  return [];
}

function cover(value) {
  if (!value) return null;
  value = String(value);
  if (value.indexOf("http") === 0) return value;
  return "https://resources.tidal.com/images/" + value.replace(/-/g, "/") + "/640x640.jpg";
}

function track(item) {
  if (!item || item.id == null) return null;
  var artist = item.artist;
  if (artist && typeof artist === "object") artist = artist.name;
  var album = item.album;
  var albumName = album && typeof album === "object" ? (album.title || album.name) : album;
  return {
    id: text(item.id),
    name: text(item.title || item.name, "Unknown"),
    artists: text(artist || (item.artists && item.artists[0] && item.artists[0].name), "Unknown Artist"),
    album_name: text(albumName),
    duration_ms: (Number(item.duration) || 0) * (Number(item.duration) < 1000 ? 1000 : 1),
    cover_url: cover((album && album.cover) || item.cover || item.picture || item.image),
    provider_id: "monochrome-tidal"
  };
}

function initialize(settings) {
  settings = settings || {};
  config.preferredApiUrl = String(settings.preferredApiUrl || config.preferredApiUrl).replace(/\/$/, "");
}

function searchTracks(query, limit) {
  var root = requestJSON("/search/?s=" + encodeURIComponent(query) + "&limit=" + String(limit || 25));
  var tracks = itemsAt(root, "tracks").map(track).filter(function (item) { return item !== null; });
  return { tracks: tracks, total: tracks.length };
}

function customSearch(query, options) {
  return searchTracks(query, (options && options.limit) || 25).tracks;
}

function normalized(value) {
  return String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").replace(/^\s+|\s+$/g, "");
}

function resolveTrack(trackName, artistName, durationMs) {
  var query = String(artistName || "") + " " + String(trackName || "");
  var root = requestJSON("/search/?s=" + encodeURIComponent(query) + "&limit=25");
  var candidates = itemsAt(root, "tracks");
  var wantedTitle = normalized(trackName);
  var wantedArtist = normalized(artistName);
  var best = null;
  var bestScore = -1;

  candidates.forEach(function (item) {
    var parsed = track(item);
    if (!parsed) return;
    var titleScore = normalized(parsed.name) === wantedTitle ? 2 : 0;
    var artistScore = normalized(parsed.artists).indexOf(wantedArtist) >= 0 || wantedArtist.indexOf(normalized(parsed.artists)) >= 0 ? 2 : 0;
    var candidateDuration = Number(parsed.duration_ms || 0);
    var durationScore = !durationMs || !candidateDuration || Math.abs(candidateDuration - Number(durationMs)) <= 12000 ? 1 : 0;
    var score = titleScore + artistScore + durationScore;
    if (score > bestScore) {
      best = parsed;
      bestScore = score;
    }
  });

  if (!best || bestScore < 4) return null;
  return best;
}

function checkAvailability(isrc, trackName, artistName, options) {
  var track = options && options.track;
  if (track && track.provider_id === "monochrome-tidal" && track.id) {
    return { available: true, reason: "Monochrome track ID available", trackId: String(track.id), skipFallback: true };
  }

  var resolved = resolveTrack(trackName, artistName, options && options.duration_ms);
  if (!resolved) return { available: false, reason: "No matching Monochrome track" };
  return {
    available: true,
    reason: "Matched by title, artist, and duration",
    trackId: String(resolved.id),
    skipFallback: true,
    prepared_context: { monochromeTrackId: String(resolved.id) }
  };
}

function getTrack(id) {
  var root = requestJSON("/track/?id=" + encodeURIComponent(id));
  var data = root && root.data;
  return track(data && (data.track || data));
}

function download(id, quality, outputPath, onProgress) {
  var root = requestJSON("/track/?id=" + encodeURIComponent(id) + "&quality=" + encodeURIComponent(quality || "LOSSLESS"));
  var data = root && root.data;
  if (!data || !data.manifest) return { success: false, error: "No stream manifest returned" };
  var manifest = String(data.manifest);
  while (manifest.length % 4) manifest += "=";
  if (data.manifestMimeType === "application/dash+xml") {
    return { success: false, error: "DASH manifests require a provider-specific downloader" };
  }
  var parsed = JSON.parse(atob(manifest));
  var url = parsed.urls && parsed.urls[0];
  if (!url) return { success: false, error: "No downloadable stream URL returned" };
  return file.download(url, outputPath, { onProgress: onProgress, resume: true });
}

registerExtension({
  initialize: initialize,
  searchTracks: searchTracks,
  customSearch: customSearch,
  getTrack: getTrack,
  checkAvailability: checkAvailability,
  download: download
});
