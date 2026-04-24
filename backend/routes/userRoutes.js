const express = require("express");
const multer = require("multer");
const User = require("../models/User");
const auth = require("../middleware/authMiddleware");
const userController = require("../controllers/userController");
const { actionLimiter } = require("../middleware/rateLimiter");

const router = express.Router();

// Storage config for Profile Photos (Memory Storage for Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images are allowed for profile photos"), false);
    }
  },
});

// SEARCH USERS
router.get("/search", auth, async (req, res) => {
  try {
    const query = req.query.q || "";

    const users = await User.find({
      username: { $regex: query, $options: "i" },
      _id: { $ne: req.user._id },
    }).select("_id username profilePic").limit(10);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PROFILE UPDATES
router.get("/profile", auth, userController.getProfile);
router.put("/profile/photo", auth, upload.single("profilePic"), userController.updateProfilePhoto);
router.put("/profile/username", auth, userController.updateUsername);
router.put("/profile/password", auth, userController.updatePassword);

// ACTIONS
router.get("/:id", auth, userController.getUserProfile);
router.post("/:id/follow", auth, actionLimiter, userController.toggleFollow);

module.exports = router;