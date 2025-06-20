const AuthService = require("../services/auth.service");
const TokenService = require("../services/token.service");

register = async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password)
    return res.status(400).send("All fields are required");

  try {
    await AuthService.register({ username, email, password });
    res.status(201).send("User registered successfully");
  } catch {
    res.status(400).send("Error: Username or email already exists");
  }
};

login = async (req, res) => {
  try {
    const user = await AuthService.login(req.body);
    const token = TokenService.issueTokens(res, user);
    res.status(200).json({
      token,
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err.message); // ✅ Debug log
    res.status(400).json({ message: err.message });
  }
};

module.exports = {
  login,
  register,
};
