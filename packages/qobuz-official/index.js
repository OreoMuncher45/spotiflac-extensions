var settings = {};

function initialize(values) {
  settings = values || {};
  settings.apiBase = String(settings.apiBase || "").replace(/\/$/, "");
}

function call(path, options) {
  if (!settings.apiBase) throw new Error("Configure a private Qobuz API base URL first");
  var response = http.get(settings.apiBase + path, options || { headers: { Accept: "application/json" } });
  if (!response || !response.ok) throw new Error("Qobuz API request failed");
  return JSON.parse(response.body);
}

function format(item) {
  if (!item || item.id == null) return null;
  var artist = item.artist && typeof item.artist === "object" ? item.artist.name : item.artist;
  var album = item.album && typeof item.album === "object" ? item.album : {};
  return {
    id: String(item.id), name: String(item.title || item.name || "Unknown"),
    artists: String(artist || "Unknown Artist"), album_name: String(album.title || item.album_name || ""),
    duration_ms: Number(item.duration_ms || item.duration || 0), cover_url: album.cover || item.cover_url || null,
    provider_id: "qobuz-official"
  };
}

function searchTracks(query, limit) {
  var root = call("/search?q=" + encodeURIComponent(query) + "&limit=" + String(limit || 25));
  var items = (root && (root.tracks || (root.data && root.data.tracks) || root.items)) || [];
  return { tracks: items.map(format).filter(function (item) { return item !== null; }), total: items.length };
}

function customSearch(query, options) { return searchTracks(query, (options && options.limit) || 25).tracks; }

function download(id, quality, outputPath, onProgress) {
  var root = call("/stream?id=" + encodeURIComponent(id) + "&quality=" + encodeURIComponent(quality || "LOSSLESS"));
  var url = root && (root.streamUrl || root.url || (root.data && (root.data.streamUrl || root.data.url)));
  if (!url) return { success: false, error: "No Qobuz stream URL returned" };
  return file.download(url, outputPath, { onProgress: onProgress, resume: true });
}

registerExtension({ initialize: initialize, searchTracks: searchTracks, customSearch: customSearch, download: download });
