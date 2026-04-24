const mongoose = require("mongoose");

const conversationSchema = new mongoose.Schema(
    {
        participants: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User",
            },
        ],
        lastMessage: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Message",
        }
    },
    { timestamps: true }
);

// Prevent duplicate conversation between same 2 users
conversationSchema.index({ participants: 1 });

module.exports = mongoose.model("Conversation", conversationSchema);