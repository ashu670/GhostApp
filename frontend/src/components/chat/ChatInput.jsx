import React, { useState, useRef, useEffect } from "react";
import EmojiPicker from "./EmojiPicker";
import GifPicker from "./GifPicker";
import StickerPanel from "./StickerPanel";
import "./ChatComponents.css";
import "./ChatInput.css";

const Icons = {
    Image: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
        </svg>
    ),
    Smile: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <circle cx="12" cy="12" r="10" />
            <path d="M8 14s1.5 2 4 2 4-2 4-2" />
            <line x1="9" y1="9" x2="9.01" y2="9" />
            <line x1="15" y1="9" x2="15.01" y2="9" />
        </svg>
    ),
    Gif: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <rect x="2" y="5" width="20" height="14" rx="2" ry="2" />
            <path d="M7 10h-2v4h2" />
            <line x1="12" y1="10" x2="12" y2="14" />
            <path d="M17 10h-2v4" />
        </svg>
    ),
    Sticker: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="20" height="20">
            <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
            <path d="M7.5 4.21l4.5 2.6 4.5-2.6" />
            <path d="M7.5 19.79V14.6l-4.5-2.6" />
            <path d="M21 12l-4.5 2.6v5.19" />
            <path d="M3.27 6.96L12 12l8.73-5.04" />
            <path d="M12 22.08V12" />
        </svg>
    ),
    Send: () => (
        <svg className="chat-send-icon" viewBox="0 0 24 24" width="20" height="20">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
        </svg>
    ),
    X: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" width="16" height="16">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
    )
};

export default function ChatInput({ onSendMessage }) {
    const [text, setText] = useState("");
    const [file, setFile] = useState(null);
    const [filePreview, setFilePreview] = useState(null);

    const [activePicker, setActivePicker] = useState(null); // 'emoji', 'gif', 'sticker'
    const fileInputRef = useRef(null);
    const wrapperRef = useRef(null);

    // Close pickers on outside click
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setActivePicker(null);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleFileChange = (e) => {
        const selected = e.target.files[0];
        if (selected) {
            setFile(selected);
            setFilePreview(URL.createObjectURL(selected));
            setText(""); // Clear text when attaching file to keep it simple, or keep it depending on UX preferred
            setActivePicker(null);
        }
    };

    const clearFile = () => {
        setFile(null);
        setFilePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleEmojiSelect = (emoji) => {
        setText((prev) => prev + emoji);
        // Don't auto-close emoji picker, let user pick multiple
    };

    const handleGifSelect = (url) => {
        onSendMessage({ text: "", mediaType: "gif", mediaUrl: url });
        setActivePicker(null);
    };

    const handleStickerSelect = (url) => {
        onSendMessage({ text: "", mediaType: "sticker", mediaUrl: url });
        setActivePicker(null);
    };

    const handleSend = () => {
        if (!text.trim() && !file) return;

        onSendMessage({ text, file });

        setText("");
        clearFile();
        setActivePicker(null);
    };

    const handleKeyDown = (e) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    return (
        <div className="chat-input-wrapper" ref={wrapperRef}>

            {/* Media Preview (standard file uploads) */}
            {filePreview && (
                <div className="chat-media-preview">
                    {file.type.startsWith("video/") ? (
                        <video src={filePreview} />
                    ) : (
                        <img src={filePreview} alt="Preview" />
                    )}
                    <button className="remove-media-btn" onClick={clearFile} title="Remove attachment">
                        <Icons.X />
                    </button>
                </div>
            )}

            {/* Popovers */}
            <div className="pickers-container">
                {activePicker === "emoji" && <EmojiPicker onSelect={handleEmojiSelect} />}
                {activePicker === "gif" && <GifPicker onSelect={handleGifSelect} />}
                {activePicker === "sticker" && <StickerPanel onSelect={handleStickerSelect} />}
            </div>

            <div className="chat-input-container">
                {/* Attachment Options */}
                <div className="chat-input-actions">
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        accept="image/*,video/*"
                        style={{ display: "none" }}
                    />
                    <button
                        className="action-icon-btn"
                        onClick={() => fileInputRef.current?.click()}
                        title="Attach Media"
                    >
                        <Icons.Image />
                    </button>
                    <button
                        className={`action-icon-btn ${activePicker === 'sticker' ? 'active' : ''}`}
                        onClick={() => setActivePicker(activePicker === 'sticker' ? null : 'sticker')}
                        title="Stickers"
                    >
                        <Icons.Sticker />
                    </button>
                    <button
                        className={`action-icon-btn ${activePicker === 'gif' ? 'active' : ''}`}
                        onClick={() => setActivePicker(activePicker === 'gif' ? null : 'gif')}
                        title="GIFs"
                    >
                        <Icons.Gif />
                    </button>
                    <button
                        className={`action-icon-btn ${activePicker === 'emoji' ? 'active' : ''}`}
                        onClick={() => setActivePicker(activePicker === 'emoji' ? null : 'emoji')}
                        title="Emojis"
                    >
                        <Icons.Smile />
                    </button>
                </div>

                {/* Text Area */}
                <div className="chat-input-box">
                    <textarea
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={file ? "Add a caption... (optional)" : "Type a message..."}
                        rows={1}
                        disabled={!!file && false} // we could disable text if file is present based on UX rules, but ghostapp allows both
                    />

                    <button
                        className="chat-send-btn p-0"
                        disabled={!text.trim() && !file}
                        onClick={handleSend}
                    >
                        <Icons.Send />
                    </button>
                </div>
            </div>
        </div>
    );
}
