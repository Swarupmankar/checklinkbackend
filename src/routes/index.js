module.exports = {
  publicRoutes: {
    auth: require("./auth.routes"),
    proxy: require("./proxy.routes"),
  },
  protectedRoutes: {
    urls: require("./url.routes"),
    users: require("./user.routes"),
    notebook: require("./notebook.routes"),
    thumbnail: require("./thumbnail.routes"),
  },
};
