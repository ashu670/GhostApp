import React from "react";
import "./ChatComponents.css";

const emojis = [
    "😀", "😂", "🤣", "😊", "😍", "🥰", "😘", "😜", "😎", "🤩",
    "🥳", "😏", "😒", "😞", "😔", "😢", "😭", "😤", "😡", "🤬",
    "🤯", "😳", "🥵", "🥶", "😱", "😨", "🤔", "🤫", "🤥", "😶",
    "🙄", "😬", "😴", "😷", "🤒", "🤕", "🤢", "🤮", "🤧", "😇",
    "👍", "👎", "👏", "🙌", "👐", "🤲", "🤝", "🙏", "✌️", "🤞",
    "❤️", "🧡", "💛", "💚", "💙", "💜", "🖤", "🤍", "🤎", "💔",
    "🔥", "✨", "🌟", "💫", "☀️", "🌙", "☁️", "🌧️", "⚡", "❄️"
];

export default function EmojiPicker({ onSelect }) {
    return (
        <div className="media-picker-popover emoji-picker">
            <div className="media-picker-header">
                <span>Emojis</span>
            </div>
            <div className="emoji-grid">
                {emojis.map((emoji, idx) => (
                    <button
                        key={idx}
                        className="emoji-btn"
                        onClick={() => onSelect(emoji)}
                    >
                        {emoji}
                    </button>
                ))}
            </div>
        </div>
    );
}
