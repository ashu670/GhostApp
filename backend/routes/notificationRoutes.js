const express = require("express");
const auth = require("../middleware/authMiddleware");
const Notification = require("../models/Notification");

const router = express.Router();

// GET notifications for logged in user
router.get("/", auth, async (req, res) => {
    try {
        const notifications = await Notification.find({ recipient: req.user._id })
            .populate("sender", "username profilePic")
            .populate("post", "caption") // optional, just to show what it was
            .sort({ createdAt: -1 })
            .limit(20);

        res.json(notifications);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// MARK notification as read
router.put("/:id/read", auth, async (req, res) => {
    try {
        const notification = await Notification.findOneAndUpdate(
            { _id: req.params.id, recipient: req.user._id },
            { isRead: true },
            { new: true }
        );

        if (!notification) {
            return res.status(404).json({ message: "Notification not found" });
        }

        res.json(notification);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
