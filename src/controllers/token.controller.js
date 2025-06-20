const TokenService = require("../services/token.service");

const refreshToken = (req, res) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const payload = TokenService.verifyRefreshToken(refreshToken);

    const newAccessToken  = TokenService.signAccessToken(payload.id);
    const newRefreshToken = TokenService.signRefreshToken(payload.id);

    res.cookie("refreshToken", newRefreshToken, {
      httpOnly : true,
      sameSite : "strict",
      secure   : process.env.NODE_ENV === "production",
      maxAge   : 30 * 24 * 60 * 60 * 1000,
    });

    return res.json({ token: newAccessToken });
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired refresh token" });
  }
};

const logout = (req, res) => {
  res.clearCookie("refreshToken", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ message: "Logged out" });
};

module.exports = {
  refreshToken,
  logout,
};
