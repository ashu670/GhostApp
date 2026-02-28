const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        members: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
    ],
    },
    { timestamps: true }
);

// Prevent duplicate conversation between same 2 users
conversationSchema.index({ members: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);