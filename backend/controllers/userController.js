const User = require("../models/User");
const bcrypt = require("bcryptjs");
const uploadToCloudinary = require("../utils/uploadToCloudinary");

// @route   PUT /api/users/profile/photo
// @desc    Update user profile photo
// @access  Private
exports.updateProfilePhoto = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No image file provided." });
        }

        const result = await uploadToCloudinary(
            req.file.buffer,
            "ghostapp_profiles"
        );

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { profilePic: result.secure_url },
            { new: true }
        ).select("-password");

        if (!updatedUser) {
            return res.status(404).json({ message: "User not found." });
        }

        res.json(updatedUser);
    } catch (err) {
        console.error("updateProfilePhoto Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @route   PUT /api/users/profile/username
// @desc    Update username
// @access  Private
exports.updateUsername = async (req, res) => {
    try {
        const { username } = req.body;

        if (!username || username.trim().length < 3) {
            return res.status(400).json({ message: "Username must be at least 3 characters long." });
        }

        // Basic sanity check for special characters (allowing alphanumeric and underscores)
        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return res.status(400).json({ message: "Username can only contain letters, numbers, and underscores." });
        }

        const existingUser = await User.findOne({ username: username.trim() });
        if (existingUser && existingUser._id.toString() !== req.user._id.toString()) {
            return res.status(400).json({ message: "Username is already taken." });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { username: username.trim() },
            { new: true }
        ).select("-password");

        res.json(updatedUser);
    } catch (err) {
        console.error("updateUsername Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

// @route   PUT /api/users/profile/password
// @desc    Change user password
// @access  Private
exports.updatePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;

        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Please provide both current and new passwords." });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ message: "New password must be at least 6 characters long." });
        }

        const user = await User.findById(req.user._id);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        // Verify current password
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Incorrect current password." });
        }

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        res.json({ message: "Password updated successfully." });
    } catch (err) {
        console.error("updatePassword Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};
