import { useState, useRef, useContext } from "react";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";
import "./Profile.css";

export default function ProfilePhotoUploader() {
    const { user, login } = useContext(AuthContext);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const fileInputRef = useRef(null);

    const handleFileChange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        if (!file.type.startsWith("image/")) {
            return setError("Please select a valid image file.");
        }

        if (file.size > 5 * 1024 * 1024) {
            return setError("Image size must be less than 5MB.");
        }

        setError("");
        setLoading(true);

        const formData = new FormData();
        formData.append("profilePic", file);

        try {
            const res = await api.put("/users/profile/photo", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });

            // Update auth context with new user data (preserves token)
            const currentToken = localStorage.getItem("token");
            login({ user: res.data, token: currentToken });

        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update photo");
        } finally {
            setLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    };

    const getProfileImageUrl = () => {
        if (user?.profilePic) {
            return `http://localhost:5000/uploads/${user.profilePic}`;
        }
        return null;
    };

    return (
        <div className="profile-photo-section">
            <div
                className={`profile-photo-container ${loading ? 'loading' : ''}`}
                onClick={() => !loading && fileInputRef.current?.click()}
            >
                {getProfileImageUrl() ? (
                    <img src={getProfileImageUrl()} alt="Profile" className="profile-photo-img" />
                ) : (
                    <div className="profile-avatar-fallback">
                        {user?.username?.charAt(0).toUpperCase() || "U"}
                    </div>
                )}

                <div className="profile-photo-overlay">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" width="24" height="24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                </div>
            </div>

            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*"
                style={{ display: "none" }}
            />

            {error && <p className="profile-error-text">{error}</p>}

            <div className="profile-photo-info">
                <h2 className="profile-name-display">{user?.username}</h2>
                <p className="profile-email-display">{user?.email}</p>
                <p className="profile-photo-hint">Click avatar to change photo</p>
            </div>
        </div>
    );
}
