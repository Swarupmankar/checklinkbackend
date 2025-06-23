exports.getBaseDomain = function (rawUrl) {
  try {
    let url = rawUrl;
    if (!url.startsWith("http")) url = "http://" + url;
    const parsed = new URL(url);
    return parsed.hostname.replace("www.", "");
  } catch {
    return "invalid-domain";
  }
};
