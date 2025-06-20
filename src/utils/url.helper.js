exports.getBaseDomain = function (url) {
  try {
    const hostname = new URL(url).hostname;
    const parts = hostname.split(".");
    const len = parts.length;
    if (len >= 2) return parts[len - 2] + "." + parts[len - 1]; // e.g., eporner.com
    return hostname;
  } catch {
    return "invalid-domain";
  }
};
