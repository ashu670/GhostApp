import { useState, useContext } from "react";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

export default function BioEditor() {
    const { user, login } = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);
    const [bio, setBio] = useState(user?.bio || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        if (bio.trim() === (user?.bio || "")) {
            setIsEditing(false);
            return;
        }

        if (bio.length > 150) {
            return setError("Bio cannot exceed 150 characters.");
        }

        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const res = await api.put("/users/profile/bio", { bio: bio.trim() });

            const currentToken = localStorage.getItem("token");
            login({ user: res.data, token: currentToken });

            setSuccess(true);
            setIsEditing(false);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update bio");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setBio(user?.bio || "");
        setError("");
        setIsEditing(false);
    };

    return (
        <div className="profile-settings-card">
            <div className="card-header">
                <h3>Bio</h3>
                {!isEditing && (
                    <button className="btn-edit-text" onClick={() => setIsEditing(true)}>
                        Edit
                    </button>
                )}
            </div>

            <div className="card-body">
                {isEditing ? (
                    <div className="edit-form">
                        <textarea
                            className="profile-input"
                            value={bio}
                            onChange={(e) => {
                                setBio(e.target.value);
                                setError("");
                            }}
                            placeholder="Tell us about yourself..."
                            autoFocus
                            rows={3}
                            style={{ resize: "vertical", fontFamily: "inherit" }}
                        />
                        <div style={{ textAlign: "right", fontSize: "0.8rem", color: bio.length > 150 ? "red" : "var(--text-secondary)", marginBottom: "10px" }}>
                            {bio.length} / 150
                        </div>
                        {error && <p className="profile-error-text sm">{error}</p>}

                        <div className="edit-actions">
                            <button className="btn-save" onClick={handleSave} disabled={loading}>
                                {loading ? "Saving..." : "Save"}
                            </button>
                            <button className="btn-cancel" onClick={handleCancel} disabled={loading}>
                                Cancel
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="read-only-val">
                        <span style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{user?.bio || "No bio yet."}</span>
                        {success && <span className="success-badge">Updated!</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
