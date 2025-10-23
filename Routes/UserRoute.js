const express = require("express");
const {
  registerUser,
  activateUser,
  loginUser,
  logoutUser,
  authorizeRoles,
  updateAccessToken,
  getUserInfo,
  socialAuth,
  updateUserInfo,
  updatePassword,
  updateProfilePicture,
} = require("../controllers/user");

const isAuthenticated = require("../Middleware/auth");

const router = express.Router();

router.post("/registration", registerUser);
router.post("/activate-user", activateUser);
router.post("/login", loginUser);
router.get("/logout", isAuthenticated, logoutUser);
router.get("/refresh", updateAccessToken);
router.get("/me", isAuthenticated, getUserInfo);
router.post("/social-auth", socialAuth);
router.put("/update-user-info", isAuthenticated, updateUserInfo);
router.put("/update-user-password", isAuthenticated, updatePassword);
router.put("/update-user-avatar", isAuthenticated, updateProfilePicture);

module.exports = router;
