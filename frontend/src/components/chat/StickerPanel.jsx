import React from "react";
import "./ChatComponents.css";

// Sample static stickers (using random cute placeholders for demo)
const stickers = [
    "https://media.giphy.com/media/l41lFw057lAJQMwg0/giphy.gif",
    "https://media.giphy.com/media/3oriO0OEd9QIDdllqo/giphy.gif",
    "https://media.giphy.com/media/26AHONQ79FdWZhAI0/giphy.gif",
    "https://media.giphy.com/media/3o7aD2saalEvpjj4U8/giphy.gif",
    "https://media.giphy.com/media/xT0xezQGU5xCDJuCPe/giphy.gif",
    "https://media.giphy.com/media/l0HlJzWDt6Y69XU2c/giphy.gif",
    "https://media.giphy.com/media/26u4lOMA8JKSnL9Uk/giphy.gif",
    "https://media.giphy.com/media/3o7TKSjRrfIPjeiVy8/giphy.gif",
    "https://media.giphy.com/media/xT9IgG50Fb7Mi0prBC/giphy.gif"
];

export default function StickerPanel({ onSelect }) {
    return (
        <div className="media-picker-popover sticker-picker">
            <div className="media-picker-header">
                <span>Stickers</span>
            </div>
            <div className="sticker-grid">
                {stickers.map((url, idx) => (
                    <button
                        key={idx}
                        className="sticker-btn"
                        onClick={() => onSelect(url)}
                    >
                        <img src={url} alt="Sticker" loading="lazy" />
                    </button>
                ))}
            </div>
        </div>
    );
}
