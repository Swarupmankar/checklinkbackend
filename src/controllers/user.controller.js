const userService = require("../services/user.services");

/**
 * GET /api/users/me
 */
const getProfile = async (req, res) => {
  try {
    const user = await userService.getById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * PUT /api/users/me
 */
const updateProfile = async (req, res) => {
  try {
    const updated = await userService.updateProfile(req.user.id, req.body);
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * PUT /api/users/me/password
 */
const changePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword)
    return res.status(400).json({ message: "Both passwords are required" });

  try {
    await userService.changePassword(req.user.id, currentPassword, newPassword);
    res.json({ message: "Password updated successfully" });
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

/**
 * DELETE /api/users/me
 */
const deleteAccount = async (req, res) => {
  try {
    await userService.remove(req.user.id);
    res.json({ message: "Account deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount,
};
