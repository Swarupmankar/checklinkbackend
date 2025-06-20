const bcrypt = require("bcrypt");
const User = require("../models/user.model");

const getById = async (id) => {
  return User.findById(id).select("-password -__v");
};

const updateProfile = async (id, data) => {
  const allow = ["username", "email"]; // only these fields are editable
  const payload = Object.fromEntries(
    Object.entries(data).filter(([k]) => allow.includes(k))
  );
  return User.findByIdAndUpdate(id, payload, { new: true }).select(
    "-password -__v"
  );
};

const changePassword = async (id, oldPwd, newPwd) => {
  const user = await User.findById(id);
  if (!user) throw new Error("User not found");

  const ok = await bcrypt.compare(oldPwd, user.password);
  if (!ok) throw new Error("Current password is incorrect");

  user.password = await bcrypt.hash(newPwd, 10);
  await user.save();
  return true;
};

const remove = async (id) => {
  return User.findByIdAndDelete(id);
};

module.exports = {
  getById,
  updateProfile,
  changePassword,
  remove,
};
