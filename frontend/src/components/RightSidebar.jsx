import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import socket from "../socket";
import api from "../api/axios";
import "./RightSidebar.css";

const Icons = {
    Bell: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 01-3.46 0" />
        </svg>
    ),
    Settings: () => (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="3" />
            <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06a1.65 1.65 0 00.33-1.82 1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06a1.65 1.65 0 001.82.33H9a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06a1.65 1.65 0 00-.33 1.82V9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
        </svg>
    )
};

export default function RightSidebar({ isOpen }) {
    const { user } = useContext(AuthContext);
    const [suggestedUsers, setSuggestedUsers] = useState([]);
    const [notifications, setNotifications] = useState([]);
    const [showNotifications, setShowNotifications] = useState(false);

    const unreadCount = notifications.filter(n => !n.isRead).length;

    useEffect(() => {
        const fetchSuggestedUsers = async () => {
            try {
                const res = await api.get("/users/search?q=");
                if (res.data) {
                    const filtered = res.data.filter(u => u._id !== (user?.id || user?._id));
                    const shuffled = filtered.sort(() => 0.5 - Math.random());
                    setSuggestedUsers(shuffled.slice(0, 3));
                }
            } catch (error) {
                console.error("Failed to fetch suggested users:", error);
            }
        };

        const fetchNotifications = async () => {
            try {
                const res = await api.get("/notifications");
                setNotifications(res.data);
            } catch (error) {
                console.error("Failed to fetch notifications:", error);
            }
        };

        if (user) {
            fetchSuggestedUsers();
            fetchNotifications();
        }
    }, [user]);

    // Socket.io for realtime notifications
    useEffect(() => {
        if (!user) return;

        const token = localStorage.getItem("token");
        if (token) {
            socket.auth = { token };
        }

        socket.on("newNotification", (notification) => {
            setNotifications(prev => [notification, ...prev]);
        });

        return () => {
            socket.off("newNotification");
        };
    }, [user]);

    const handleNotificationClick = async (notif) => {
        if (!notif.isRead) {
            try {
                await api.put(`/notifications/${notif._id}/read`);
                setNotifications(prev => prev.map(n => n._id === notif._id ? { ...n, isRead: true } : n));
            } catch (err) {
                console.error(err);
            }
        }
        setShowNotifications(false);
    };

    return (
        <aside className={`layout-right-sidebar ${isOpen ? 'open' : ''}`}>

            {/* Top action icons mimicking the reference */}
            <div className="right-sidebar-header" style={{ position: 'relative' }}>
                <button className="header-icon-btn" onClick={() => setShowNotifications(!showNotifications)}>
                    <Icons.Bell />
                    {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
                </button>
                <button className="header-icon-btn"><Icons.Settings /></button>
                <div className="user-profile-avatar" style={{ width: 36, height: 36, cursor: 'pointer', marginLeft: 8 }}>
                    {user?.profilePic ? (
                        <img src={`${import.meta.env.VITE_API_URL}/uploads/${user.profilePic}`} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                        user?.username?.charAt(0) || "U"
                    )}
                </div>

                {showNotifications && (
                    <div className="notifications-dropdown">
                        <div className="notifications-header">Notifications</div>
                        {notifications.length === 0 ? (
                            <div className="notifications-empty">No new notifications</div>
                        ) : (
                            <div className="notifications-list">
                                {notifications.map((n) => (
                                    <div key={n._id} className={`notification-item ${!n.isRead ? 'unread' : ''}`} onClick={() => handleNotificationClick(n)}>
                                        <div className="notification-avatar">
                                            {n.sender?.profilePic ? (
                                                <img src={`${import.meta.env.VITE_API_URL}/uploads/${n.sender.profilePic}`} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                            ) : (
                                                n.sender?.username?.charAt(0) || "U"
                                            )}
                                        </div>
                                        <div className="notification-text">
                                            <span className="notification-user">{n.sender?.username}</span>
                                            {' '}
                                            {n.type === 'like' && 'liked your post'}
                                            {n.type === 'comment' && 'commented on your post'}
                                            {n.type === 'share' && 'shared your post'}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Who to follow widget */}
            {suggestedUsers.length > 0 && (
                <div className="sidebar-widget">
                    <div className="widget-title">
                        <span>Who to follow</span>
                        <span className="widget-title-icon"><Icons.Settings /></span>
                    </div>

                    <div className="widget-list">
                        {suggestedUsers.map((u) => (
                            <div className="suggestion-item" key={u._id}>
                                <div className="suggestion-info">
                                    <div className="suggestion-avatar">
                                        {u.profilePic ? (
                                            <img src={`${import.meta.env.VITE_API_URL}/uploads/${u.profilePic}`} alt={u.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                                        ) : (
                                            u.username.charAt(0)
                                        )}
                                    </div>
                                    <div className="suggestion-text">
                                        <span className="suggestion-name">{u.username}</span>
                                    </div>
                                </div>
                                <button className="follow-btn">Follow</button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <div className="sidebar-footer">
                <span>© 2026 GhostApp</span>
                <span>Privacy · Terms</span>
            </div>

        </aside>
    );
}
