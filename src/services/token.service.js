// services/token.service.js
const jwt = require("jsonwebtoken");

const ACCESS_EXPIRES = "1d";
const REFRESH_EXPIRES = "30d";

/* ------------------------------------------------- *
 *   helpers                                         *
 * ------------------------------------------------- */
const signAccessToken = (userId) => {
  if (!process.env.JWT_SECRET) throw new Error("JWT_SECRET is not defined");
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: ACCESS_EXPIRES,
  });
};

const signRefreshToken = (userId) => {
  if (!process.env.JWT_SECRET_2) throw new Error("JWT_SECRET_2 is not defined");
  return jwt.sign({ id: userId }, process.env.JWT_SECRET_2, {
    expiresIn: REFRESH_EXPIRES,
  });
};

/* ------------------------------------------------- *
 *   public API                                      *
 * ------------------------------------------------- */
const issueTokens = (res, user) => {
  const accessToken = signAccessToken(user._id);
  const refreshToken = signRefreshToken(user._id);

  // send refresh token as Http‑Only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return accessToken;
};

const verifyAccessToken = (token) => jwt.verify(token, process.env.JWT_SECRET);
const verifyRefreshToken = (token) =>
  jwt.verify(token, process.env.JWT_SECRET_2);

module.exports = {
  /* generation */
  issueTokens,

  /* raw helpers (exported in case you need them elsewhere) */
  signAccessToken,
  signRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
};
