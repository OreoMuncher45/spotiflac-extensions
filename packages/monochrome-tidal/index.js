var config = { baseUrl: "https://monochrome.tf" };

function text(value, fallback) {
  return value == null ? (fallback || "") : String(value);
}

function requestJSON(url, options) {
  var response = http.get(url, options || { headers: { Accept: "application/json" } });
  if (!response || !response.ok) throw new Error("Monochrome HTTP request failed");
  return JSON.parse(response.body);
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
  config.baseUrl = String(settings.baseUrl || config.baseUrl).replace(/\/$/, "");
}

function searchTracks(query, limit) {
  var root = requestJSON(config.baseUrl + "/search/?s=" + encodeURIComponent(query) + "&limit=" + String(limit || 25));
  var data = root && root.data;
  var items = Array.isArray(data) ? data : (data && (data.tracks || data.items || data.results)) || [];
  var tracks = items.map(track).filter(function (item) { return item !== null; });
  return { tracks: tracks, total: tracks.length };
}

function customSearch(query, options) {
  return searchTracks(query, (options && options.limit) || 25).tracks;
}

function download(id, quality, outputPath, onProgress) {
  var root = requestJSON(config.baseUrl + "/track/?id=" + encodeURIComponent(id) + "&quality=" + encodeURIComponent(quality || "LOSSLESS"));
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

registerExtension({ initialize: initialize, searchTracks: searchTracks, customSearch: customSearch, download: download });
