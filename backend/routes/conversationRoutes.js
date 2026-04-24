const express = require("express");
const auth = require("../middleware/authMiddleware");
const Conversation = require("../models/Conversation");

const router = express.Router();

// GET ALL CONVERSATIONS FOR LOGGED IN USER
router.get("/", auth, async (req, res) => {
    try {
        const conversations = await Conversation.find({
            participants: { $in: [req.user._id] }
        })
        .populate("participants", "username profilePic")
        .populate("lastMessage")
        .sort({ updatedAt: -1 });

        res.json(conversations);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE OR RETRIEVE CONVERSATION ON DEMAND
router.post("/", auth, async (req, res) => {
    try {
        const { receiverId } = req.body;

        if (receiverId === req.user._id.toString()) {
            return res.status(400).json({ message: "Cannot create conversation with yourself." });
        }

        let conversation = await Conversation.findOne({
            participants: { $all: [req.user._id, receiverId] }
        });

        if (!conversation) {
            conversation = await Conversation.create({
                participants: [req.user._id, receiverId]
            });
        }

        const populatedConvo = await Conversation.findById(conversation._id)
            .populate("participants", "username profilePic")
            .populate("lastMessage");

        res.json(populatedConvo);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
