import React from "react";
import ProfilePhotoUploader from "../components/profile/ProfilePhotoUploader";
import UsernameEditor from "../components/profile/UsernameEditor";
import PasswordChanger from "../components/profile/PasswordChanger";
import "../components/profile/Profile.css";

export default function Profile() {
    return (
        <div className="profile-page-layout">
            <div className="profile-header">
                <h1 className="page-title">Account Settings</h1>
                <p className="page-subtitle">Manage your profile details and security.</p>
            </div>

            <div className="profile-grid-container">
                {/* Left Side: Avatar & Core Info */}
                <div className="profile-col-left">
                    <ProfilePhotoUploader />
                </div>

                {/* Right Side: Editable Settings */}
                <div className="profile-col-right">
                    <UsernameEditor />
                    <PasswordChanger />
                </div>
            </div>
        </div>
    );
}
