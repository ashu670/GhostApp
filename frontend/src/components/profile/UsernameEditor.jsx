import { useState, useContext } from "react";
import api from "../../api/axios";
import { AuthContext } from "../../context/AuthContext";

export default function UsernameEditor() {
    const { user, login } = useContext(AuthContext);
    const [isEditing, setIsEditing] = useState(false);
    const [username, setUsername] = useState(user?.username || "");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSave = async () => {
        if (username.trim() === user?.username) {
            setIsEditing(false);
            return;
        }

        if (username.trim().length < 3) {
            return setError("Username must be at least 3 characters.");
        }

        if (!/^[a-zA-Z0-9_]+$/.test(username)) {
            return setError("Only letters, numbers, and underscores allowed.");
        }

        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            const res = await api.put("/users/profile/username", { username: username.trim() });

            const currentToken = localStorage.getItem("token");
            login({ user: res.data, token: currentToken });

            setSuccess(true);
            setIsEditing(false);
            setTimeout(() => setSuccess(false), 3000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update username");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setUsername(user?.username || "");
        setError("");
        setIsEditing(false);
    };

    return (
        <div className="profile-settings-card">
            <div className="card-header">
                <h3>Username</h3>
                {!isEditing && (
                    <button className="btn-edit-text" onClick={() => setIsEditing(true)}>
                        Edit
                    </button>
                )}
            </div>

            <div className="card-body">
                {isEditing ? (
                    <div className="edit-form">
                        <input
                            type="text"
                            className="profile-input"
                            value={username}
                            onChange={(e) => {
                                setUsername(e.target.value);
                                setError("");
                            }}
                            placeholder="Enter new username"
                            autoFocus
                        />
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
                        <span>@{user?.username}</span>
                        {success && <span className="success-badge">Updated!</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
