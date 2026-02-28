const express = require("express");
const multer = require("multer");
const auth = require("../middleware/authMiddleware");
const Post = require("../models/Post");

const router = express.Router();

// Storage config
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
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
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

// CREATE POST (allow text-only by checking if file exists)
router.post("/", auth, upload.single("media"), async (req, res) => {
  try {
    const { caption } = req.body;
    const media = req.file ? req.file.filename : null;

    if (!caption?.trim() && !media) {
      return res.status(400).json({ message: "Post cannot be completely empty." });
    }

    const postData = {
      user: req.user._id,
      caption: caption || "",
    };

    if (media) {
      postData.media = media;
    }

    const post = await Post.create(postData);

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

const Notification = require("../models/Notification");

// LIKE A POST
router.post("/:id/like", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const userId = req.user._id;
    const hasLiked = post.likes.includes(userId);

    if (hasLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId.toString());
    } else {
      post.likes.push(userId);

      // Notify post owner if not self
      if (post.user.toString() !== userId.toString()) {
        const notif = await Notification.create({
          recipient: post.user,
          sender: userId,
          type: "like",
          post: post._id,
        });

        const populatedNotif = await Notification.findById(notif._id).populate("sender", "username profilePic");
        const io = req.app.get("io");
        io.to(post.user.toString()).emit("newNotification", populatedNotif);
      }
    }

    await post.save();
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// COMMENT ON A POST
router.post("/:id/comment", auth, async (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ message: "Comment config empty" });

    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    const newComment = {
      user: req.user._id,
      text,
    };

    post.comments.push(newComment);
    await post.save();

    // Notify post owner if not self
    if (post.user.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: "comment",
        post: post._id,
      });

      const populatedNotif = await Notification.findById(notif._id).populate("sender", "username profilePic");
      const io = req.app.get("io");
      io.to(post.user.toString()).emit("newNotification", populatedNotif);
    }

    // Return populated post
    const populatedPost = await Post.findById(post._id).populate("comments.user", "username profilePic");
    res.json(populatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// SHARE A POST
router.post("/:id/share", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ message: "Post not found" });

    post.shares += 1;
    await post.save();

    if (post.user.toString() !== req.user._id.toString()) {
      const notif = await Notification.create({
        recipient: post.user,
        sender: req.user._id,
        type: "share",
        post: post._id,
      });

      const populatedNotif = await Notification.findById(notif._id).populate("sender", "username profilePic");
      const io = req.app.get("io");
      io.to(post.user.toString()).emit("newNotification", populatedNotif);
    }

    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", auth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post)
      return res.status(404).json({ message: "Post not found" });

    if (post.user.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Not allowed" });

    await post.deleteOne();

    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET FEED (latest posts)
router.get("/", auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const posts = await Post.find()
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json(posts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;