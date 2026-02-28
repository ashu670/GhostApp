import { NavLink, useNavigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import "./Sidebar.css";

const Icons = {
    Dashboard: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
    ),
    Messages: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
        </svg>
    ),
    Search: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
    ),
    Profile: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
    ),
    Logout: () => (
        <svg className="nav-icon" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
        </svg>
    )
};

export default function Sidebar({ isOpen }) {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate("/login");
    };

    return (
        <aside className={`layout-sidebar ${isOpen ? 'open' : ''}`}>
            <div className="brand-logo">
                <div className="logo-icon"></div>
                GhostApp
            </div>

            <nav className="nav-menu">
                <NavLink to="/feed" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Icons.Dashboard /> Dashboard
                </NavLink>
                <NavLink to="/chat" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Icons.Messages /> Messages
                </NavLink>
                <NavLink to="/search" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Icons.Search /> Search
                </NavLink>
                <NavLink to="/profile" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                    <Icons.Profile /> Profile
                </NavLink>
            </nav>

            <div className="user-profile-widget">
                <div className="user-profile-info">
                    <div className="user-profile-avatar">
                        {user?.profilePic ? (
                            <img src={`http://localhost:5000/uploads/${user.profilePic}`} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                        ) : (
                            user?.username?.charAt(0) || "U"
                        )}
                    </div>
                    <div className="user-profile-text">
                        <span className="user-profile-name">{user?.username || "User"}</span>
                        <span className="user-profile-email">{user?.email || "user@example.com"}</span>
                    </div>
                </div>
            </div>

            <button className="logout-btn" onClick={handleLogout}>
                <Icons.Logout /> Logout
            </button>
        </aside>
    );
}
