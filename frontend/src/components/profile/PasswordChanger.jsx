import { useState } from "react";
import api from "../../api/axios";

export default function PasswordChanger() {
    const [isEditing, setIsEditing] = useState(false);
    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);

    const handleSave = async (e) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            return setError("All fields are required.");
        }

        if (newPassword !== confirmPassword) {
            return setError("New passwords do not match.");
        }

        if (newPassword.length < 6) {
            return setError("New password must be at least 6 characters.");
        }

        setLoading(true);
        setError("");
        setSuccess(false);

        try {
            await api.put("/users/profile/password", {
                currentPassword,
                newPassword
            });

            setSuccess(true);
            setIsEditing(false);

            // Clear fields on success
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");

            setTimeout(() => setSuccess(false), 4000);
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || "Failed to update password");
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setError("");
        setIsEditing(false);
    };

    return (
        <div className="profile-settings-card">
            <div className="card-header">
                <h3>Password</h3>
                {!isEditing && (
                    <button className="btn-edit-text" onClick={() => setIsEditing(true)}>
                        Change
                    </button>
                )}
            </div>

            <div className="card-body">
                {isEditing ? (
                    <form className="edit-form" onSubmit={handleSave}>
                        <div className="input-group">
                            <label>Current Password</label>
                            <input
                                type="password"
                                className="profile-input"
                                value={currentPassword}
                                onChange={(e) => {
                                    setCurrentPassword(e.target.value);
                                    setError("");
                                }}
                            />
                        </div>

                        <div className="input-group">
                            <label>New Password</label>
                            <input
                                type="password"
                                className="profile-input"
                                value={newPassword}
                                onChange={(e) => {
                                    setNewPassword(e.target.value);
                                    setError("");
                                }}
                            />
                        </div>

                        <div className="input-group">
                            <label>Confirm New Password</label>
                            <input
                                type="password"
                                className="profile-input"
                                value={confirmPassword}
                                onChange={(e) => {
                                    setConfirmPassword(e.target.value);
                                    setError("");
                                }}
                            />
                        </div>

                        {error && <p className="profile-error-text sm">{error}</p>}

                        <div className="edit-actions">
                            <button type="submit" className="btn-save" disabled={loading}>
                                {loading ? "Updating..." : "Update Password"}
                            </button>
                            <button type="button" className="btn-cancel" onClick={handleCancel} disabled={loading}>
                                Cancel
                            </button>
                        </div>
                    </form>
                ) : (
                    <div className="read-only-val">
                        <span>••••••••</span>
                        {success && <span className="success-badge">Password updated!</span>}
                    </div>
                )}
            </div>
        </div>
    );
}
