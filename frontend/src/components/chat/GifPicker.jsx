import React, { useState, useEffect } from "react";
import "./ChatComponents.css";

const GIPHY_API_KEY = "dc6zaTOxFJmzC"; // Public beta key for demo purposes

export default function GifPicker({ onSelect }) {
    const [query, setQuery] = useState("");
    const [gifs, setGifs] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchTrending();
    }, []);

    const fetchTrending = async () => {
        setLoading(true);
        try {
            const res = await fetch(`https://api.giphy.com/v1/gifs/trending?api_key=${GIPHY_API_KEY}&limit=20`);
            const data = await res.json();
            setGifs(data.data || []);
        } catch (err) {
            console.error("Giphy fetch error", err);
        }
        setLoading(false);
    };

    const searchGifs = async (e) => {
        e.preventDefault();
        if (!query.trim()) return fetchTrending();

        setLoading(true);
        try {
            const res = await fetch(`https://api.giphy.com/v1/gifs/search?api_key=${GIPHY_API_KEY}&q=${encodeURIComponent(query)}&limit=20`);
            const data = await res.json();
            setGifs(data.data || []);
        } catch (err) {
            console.error("Giphy search error", err);
        }
        setLoading(false);
    };

    return (
        <div className="media-picker-popover gif-picker">
            <div className="media-picker-header">
                <form onSubmit={searchGifs} className="gif-search-form">
                    <input
                        type="text"
                        placeholder="Search GIFs..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        className="gif-search-input"
                    />
                </form>
            </div>
            <div className="gif-grid">
                {loading ? (
                    <div className="picker-loading">Loading...</div>
                ) : (
                    gifs.map((g) => (
                        <button
                            key={g.id}
                            className="gif-btn"
                            onClick={() => onSelect(g.images.fixed_height.url)}
                        >
                            <img src={g.images.fixed_height_small.url} alt={g.title} loading="lazy" />
                        </button>
                    ))
                )}
            </div>
        </div>
    );
}
