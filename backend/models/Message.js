const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
    {
        conversationId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Conversation",
        },
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        text: {
            type: String,
            default: "",
        },
        media: {
            type: {
                type: String,
                enum: ["image", "video", "gif", "sticker"],
            },
            url: {
                type: String,
            }
        },
        edited: {
            type: Boolean,
            default: false,
        },
        editedAt: {
            type: Date,
        },
        deleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
        },
        deletedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
        },
        systemEvent: {
            type: String,
        },
    },
    { timestamps: true }
);

messageSchema.index({ conversationId: 1 });

module.exports = mongoose.model("Message", messageSchema);