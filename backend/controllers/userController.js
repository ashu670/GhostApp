const User = require("../models/User");
const bcrypt = require("bcryptjs");
const uploadToCloudinary = require("../utils/uploadToCloudinary");
const { redisClient } = require("../config/redis");
const Post = require("../models/Post");

// @route   GET /api/users/profile
// @desc    Get user profile data
// @access  Private
exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user._id).select("-password");
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json(user);
    } catch (err) {
        console.error("getProfile Error:", err);
        res.status(500).json({ message: "Server Error" });
    }
};

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

// @route   PUT /api/users/profile/bio
// @desc    Update bio string
// @access  Private
exports.updateBio = async (req, res) => {
    try {
        const { bio } = req.body;

        if (bio && bio.length > 150) {
            return res.status(400).json({ message: "Bio cannot exceed 150 characters." });
        }

        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            { bio: bio ? bio.trim() : "" },
            { new: true }
        ).select("-password");

        res.json(updatedUser);
    } catch (err) {
        console.error("updateBio Error:", err);
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

// @route   GET /api/users/:id
exports.getUserProfile = async (req, res) => {
    try {
        const userId = req.params.id;
        const cacheKey = `userProfile:${userId}`;

        if (redisClient.isReady) {
            try {
                const cached = await redisClient.get(cacheKey);
                if (cached) return res.json(JSON.parse(cached));
            } catch (rErr) {}
        }

        const user = await User.findById(userId).select("-password -email");
        if (!user) return res.status(404).json({ message: "User not found" });

        const posts = await Post.find({ user: userId }).sort({ createdAt: -1 });

        const responsePayload = { user, posts };

        if (redisClient.isReady) {
            try {
                await redisClient.setEx(cacheKey, 60, JSON.stringify(responsePayload));
            } catch (rErr) {}
        }

        res.json(responsePayload);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route   POST /api/users/:id/follow
exports.toggleFollow = async (req, res) => {
    try {
        const targetUserId = req.params.id;
        const currentUserId = req.user._id;

        if (targetUserId === currentUserId.toString()) {
            return res.status(400).json({ message: "You cannot follow yourself" });
        }

        const targetUser = await User.findById(targetUserId);
        const currentUser = await User.findById(currentUserId);

        if (!targetUser || !currentUser) return res.status(404).json({ message: "User not found" });

        const isFollowing = currentUser.following.includes(targetUserId);

        let Notification = require("../models/Notification");

        if (isFollowing) {
            currentUser.following.pull(targetUserId);
            targetUser.followers.pull(currentUserId);
        } else {
            currentUser.following.push(targetUserId);
            targetUser.followers.push(currentUserId);

            // Execute Native Realtime Notification System
            const notif = await Notification.create({
                sender: currentUserId,
                recipient: targetUserId,
                type: "follow"
            });

            const populatedNotif = await Notification.findById(notif._id).populate("sender", "username profilePic");
            const io = req.app.get("io");
            if (io) {
                io.to(targetUserId.toString()).emit("newNotification", populatedNotif);
            }
        }

        await currentUser.save();
        await targetUser.save();

        if (redisClient.isReady) {
            await redisClient.del(`suggestions:${currentUserId}`);
            await redisClient.del(`suggestions:${targetUserId}`);
            await redisClient.del(`userProfile:${targetUserId}`);
            await redisClient.del(`userProfile:${currentUserId}`);

            // Flush isolated feeds aggressively!
            try {
                const keys = await redisClient.keys(`feed:${currentUserId}:*`);
                if (keys.length > 0) await redisClient.del(keys);
            } catch (rErr) {
                console.error("Flush err:", rErr);
            }
        }

        res.json({ following: !isFollowing });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route   GET /api/users/:id/followers
exports.getFollowers = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate("followers", "_id username profilePic")
            .select("followers");
            
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user.followers || []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

// @route   GET /api/users/:id/following
exports.getFollowing = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate("following", "_id username profilePic")
            .select("following");
            
        if (!user) return res.status(404).json({ message: "User not found" });
        res.json(user.following || []);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};
