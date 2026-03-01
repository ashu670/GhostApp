import React, { useState } from "react";
import MessageActions from "./MessageActions";
import "./ChatComponents.css";

const Icons = {
    MoreVertical: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <circle cx="12" cy="12" r="1" />
            <circle cx="12" cy="5" r="1" />
            <circle cx="12" cy="19" r="1" />
        </svg>
    )
};

export default function MessageBubble({ message, isOwn, onEdit, onDelete }) {
    const [isEditing, setIsEditing] = useState(false);
    const [editText, setEditText] = useState(message.text || "");
    const [showActions, setShowActions] = useState(false);

    const canEdit = isOwn && !message.deleted && (!message.media || message.text);
    const canDelete = isOwn && !message.deleted;

    const handleSaveEdit = () => {
        if (editText.trim() !== message.text) {
            onEdit(message._id, editText);
        }
        setIsEditing(false);
    };

    const handleCancelEdit = () => {
        setEditText(message.text || "");
        setIsEditing(false);
    };

    // Render deleted state
    if (message.deleted) {
        return (
            <div className={`message-wrapper ${isOwn ? "own" : "other"}`}>
                <div className="message-bubble deleted-bubble">
                    <span className="deleted-text">🚫 This message was deleted</span>
                </div>
            </div>
        );
    }

    // Render media
    const renderMedia = () => {
        if (!message.media) return null;

        // Check if it's the new object structure or the old string structure
        const isObject = typeof message.media === 'object' && message.media !== null;

        // For backward compatibility with older string-based media
        if (!isObject) {
            const isVideo = message.media.match(/\.(mp4|webm|ogg)$/i);
            const url = message.media;
            return isVideo ? (
                <video src={url} controls className="message-media" />
            ) : (
                <img src={url} alt="Media" className="message-media" loading="lazy" />
            );
        }

        // New structure
        const { type, url } = message.media;

        if (type === "video") {
            return <video src={url} controls className="message-media" />;
        }
        if (type === "image") {
            return <img src={url} alt="Image" className="message-media" loading="lazy" />;
        }
        if (type === "gif") {
            return <img src={url} alt="GIF" className="message-media gif-media" loading="lazy" />;
        }
        if (type === "sticker") {
            return <img src={url} alt="Sticker" className="message-media sticker-media" loading="lazy" />;
        }
        return null;
    };

    return (
        <div
            className={`message-wrapper ${isOwn ? "own" : "other"}`}
            onMouseEnter={() => setShowActions(true)}
            onMouseLeave={() => setShowActions(false)}
        >
            {/* Action Menu Trigger (Only Desktop Hover for now) */}
            {isOwn && showActions && (canEdit || canDelete) && !isEditing && (
                <div className="message-actions-container">
                    <MessageActions
                        onEdit={() => setIsEditing(true)}
                        onDelete={() => onDelete(message._id)}
                        canEdit={canEdit}
                        canDelete={canDelete}
                    />
                </div>
            )}

            <div className={`message-bubble ${message.media?.type === 'sticker' ? 'sticker-bubble' : ''}`}>

                {/* Media */}
                {renderMedia()}

                {/* Text / Editing Inline */}
                {isEditing ? (
                    <div className="inline-edit-container">
                        <textarea
                            className="inline-edit-input"
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            autoFocus
                        />
                        <div className="inline-edit-actions">
                            <button className="btn-save" onClick={handleSaveEdit}>Save</button>
                            <button className="btn-cancel" onClick={handleCancelEdit}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    message.text && (
                        <div className="message-text">
                            {message.text}
                            {message.edited && <span className="edited-flag">(edited)</span>}
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
