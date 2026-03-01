const express = require("express");
const auth = require("../middleware/authMiddleware");
const Conversation = require("../models/Conversation");
const Message = require("../models/Message");

const multer = require("multer");

const router = express.Router();

// Storage config for messages
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit for chat
  fileFilter: (req, file, cb) => {
    if (
      file.mimetype.startsWith("image/") ||
      file.mimetype.startsWith("video/")
    ) {
      cb(null, true);
    } else {
      cb(new Error("Only images and videos allowed"), false);
    }
  },
});

// GET RECENT CONVERSATIONS (For sorting User list)
router.get("/conversations/recent", auth, async (req, res) => {
  try {
    const conversations = await Conversation.find({
      members: { $in: [req.user._id] }
    });

    if (!conversations.length) {
      return res.json([]);
    }

    // Since we need to sort by lastMessageAt which isn't directly on Conversation model in current shape,
    // we fetch the latest message for each.
    const recentConvos = [];

    for (const conv of conversations) {
      const latestMessage = await Message.findOne({ conversationId: conv._id })
        .sort({ createdAt: -1 })
        .limit(1);

      const recipientId = conv.members.find(m => m.toString() !== req.user._id.toString());

      recentConvos.push({
        conversationId: conv._id,
        recipientId,
        lastMessageAt: latestMessage ? latestMessage.createdAt : conv.createdAt
      });
    }

    // Sort descending by activity
    recentConvos.sort((a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt));

    res.json(recentConvos);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// CREATE OR GET CONVERSATION
router.post("/conversation", auth, async (req, res) => {
  try {
    const { receiverId } = req.body;

    let conversation = await Conversation.findOne({
      members: { $all: [req.user._id, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        members: [req.user._id, receiverId],
      });
    }

    res.json(conversation);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SEND MESSAGE (with optional media, gif, or sticker)
router.post("/", auth, upload.single("media"), async (req, res) => {
  try {
    const { conversationId, text, receiverId, mediaType, mediaUrl } = req.body;
    let finalMedia = null;

    if (mediaType && mediaUrl) {
      // It's a Giphy GIF or a WebP Sticker sent as a URL string
      finalMedia = {
        type: mediaType,
        url: mediaUrl,
      };
    } else if (req.file) {
      // It's a standard Multer file upload (image/video)
      const type = req.file.mimetype.startsWith("video/") ? "video" : "image";
      finalMedia = {
        type,
        url: req.file.filename,
      };
    }

    if (!text?.trim() && !finalMedia) {
      return res.status(400).json({ message: "Message cannot be empty." });
    }

    const message = await Message.create({
      conversationId,
      sender: req.user._id,
      text: text || "",
      media: finalMedia,
    });

    // Handle initial populated response if needed by frontend (optional, depending on existing rendering)
    const populatedMessage = await Message.findById(message._id).populate("sender", "username profilePic");

    // Emit real-time
    req.app.get("io").to(receiverId).emit("receiveMessage", populatedMessage);

    res.json(message);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});


// GET MESSAGES OF CONVERSATION
router.get("/:conversationId", auth, async (req, res) => {
  try {
    const conversation = await Conversation.findById(
      req.params.conversationId
    );

    if (!conversation)
      return res.status(404).json({ message: "Conversation not found" });

    // Ensure user is member
    if (!conversation.members.includes(req.user._id))
      return res.status(403).json({ message: "Access denied" });

    const messages = await Message.find({
      conversationId: req.params.conversationId,
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// EDIT MESSAGE
router.put("/:id", auth, async (req, res) => {
  try {
    const { text } = req.body;
    const message = await Message.findById(req.params.id);

    if (!message) return res.status(404).json({ message: "Message not found" });

    // Validate ownership
    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this message" });
    }

    // Rules: Can only edit text. Cannot edit if deleted or explicitly a media-only file (though if it has text + media, editing text is fine).
    if (message.deleted) {
      return res.status(403).json({ message: "Cannot edit a deleted message" });
    }

    message.text = text || "";
    message.edited = true;
    message.editedAt = new Date();

    await message.save();

    const populatedMessage = await Message.findById(message._id).populate("sender", "username profilePic");

    // We need to emit to both users in the conversation.
    // The easiest way is to find the conversation and emit to it, or emit to both sender and receiver.
    // We'll emit to the conversation room if we set it up, but currently we emit to `receiverId`. 
    // Wait, the client only listens to receiverId. No, in `socket.js`, people join their own `userId` room.
    // So we need to emit to the other members of the conversation.
    const conversation = await Conversation.findById(message.conversationId);
    conversation.members.forEach(memberId => {
      req.app.get("io").to(memberId.toString()).emit("messageEdited", populatedMessage);
    });

    res.json(populatedMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// DELETE MESSAGE (Soft delete)
router.delete("/:id", auth, async (req, res) => {
  try {
    const message = await Message.findById(req.params.id);

    if (!message) return res.status(404).json({ message: "Message not found" });

    if (message.sender.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this message" });
    }

    message.deleted = true;
    message.deletedAt = new Date();
    message.deletedBy = req.user._id;
    message.systemEvent = "message_deleted";
    message.text = "";
    message.media = null;

    await message.save();

    const populatedMessage = await Message.findById(message._id).populate("sender", "username profilePic");

    const conversation = await Conversation.findById(message.conversationId);
    conversation.members.forEach(memberId => {
      req.app.get("io").to(memberId.toString()).emit("messageDeleted", populatedMessage);
    });

    res.json(populatedMessage);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;