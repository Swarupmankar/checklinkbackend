const bcrypt = require("bcrypt");
const User = require("../models/user.model");

// Register function
const register = async ({ username, email, password }) => {
  const hashed = await bcrypt.hash(password, 10);
  return User.create({ username, email, password: hashed });
};

const login = async ({ email, password }) => {
  const user = await User.findOne({ email });
  if (!user) throw new Error("User not found");

  const ok = await bcrypt.compare(password, user.password);
  if (!ok) throw new Error("Invalid credentials");

  return user;
};

module.exports = {
  register,
  login,
};
