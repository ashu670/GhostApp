import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import getImageUrl from "../utils/getImageUrl";
import formatTime from "../utils/formatTime";
import "./UserProfile.css";

// SVG UI Components
const HeartIcon = ({ filled }) => (
  <svg fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ width: 20, height: 20 }}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

export default function UserProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user: currentUser } = useContext(AuthContext);

    const [profileData, setProfileData] = useState(null);
    const [posts, setPosts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isFollowing, setIsFollowing] = useState(false);

    // Interaction states
    const [activeComments, setActiveComments] = useState(null);
    const [commentText, setCommentText] = useState("");

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const res = await api.get(`/users/${id}`);
                setProfileData(res.data.user);
                setPosts(res.data.posts);

                if (res.data.user.followers && currentUser) {
                    setIsFollowing(res.data.user.followers.includes(currentUser._id || currentUser.id));
                }
            } catch (err) {
                console.error("Failed to load profile:", err);
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchProfile();
    }, [id, currentUser]);

    const handleFollow = async () => {
        try {
            const res = await api.post(`/users/${id}/follow`);
            setIsFollowing(res.data.following);
            setProfileData(prev => ({
                ...prev,
                followers: res.data.following
                    ? [...prev.followers, currentUser._id || currentUser.id]
                    : prev.followers.filter(uid => uid !== (currentUser._id || currentUser.id))
            }));
        } catch (err) {
            console.error("Failed to follow/unfollow:", err);
        }
    };

    const handleMessage = async () => {
        try {
            const res = await api.post("/conversations", { receiverId: profileData._id });
            navigate("/chat", { state: { conversation: res.data } });
        } catch (err) {
            console.error("Failed to init chat:", err);
        }
    };

    const handleDeletePost = async (postId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) return;
        try {
            await api.delete(`/posts/${postId}`);
            setPosts(prev => prev.filter(p => p._id !== postId));
        } catch (err) {
            console.error("Failed to delete post:", err);
        }
    };

    const likePost = async (postId) => {
        try {
            const res = await api.post(`/posts/${postId}/like`);
            setPosts(prev => prev.map(p => p._id === postId ? { ...p, likes: res.data.likes } : p));
        } catch (err) {
            console.error("Failed to like:", err);
        }
    };

    const toggleComments = (postId) => {
        if (activeComments === postId) {
            setActiveComments(null);
        } else {
            setActiveComments(postId);
            setCommentText("");
        }
    };

    const submitComment = async (postId) => {
        if (!commentText.trim()) return;
        try {
            const res = await api.post(`/posts/${postId}/comment`, { text: commentText });
            setPosts(prev => prev.map(p => p._id === postId ? res.data : p));
            setCommentText("");
        } catch (err) {
            console.error("Failed to comment:", err);
        }
    };

    const deleteComment = async (postId, commentId) => {
        if (!window.confirm("Are you sure you want to remove this comment?")) return;
        try {
            const res = await api.delete(`/posts/${postId}/comments/${commentId}`);
            setPosts(prev => prev.map(p => p._id === postId ? res.data : p));
        } catch (err) {
            console.error("Failed to delete comment:", err);
        }
    };

    if (loading) return <div style={{ padding: '2rem', color: '#fff', textAlign: 'center' }}>Loading profile...</div>;
    if (!profileData) return <div style={{ padding: '2rem', color: '#fff', textAlign: 'center' }}>User not found.</div>;

    const isOwnProfile = (currentUser?._id || currentUser?.id) === id;

    return (
        <div className="profile-page-wrapper">
            <header className="profile-cover">
                <div className="profile-avatar-large">
                    {profileData.profilePic ? (
                        <img 
                            src={getImageUrl(profileData.profilePic)} 
                            alt={profileData.username} 
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'%3E%3Crect width='100' height='100' fill='%23333'/%3E%3Ctext x='50' y='55' font-family='Arial' font-size='40' fill='white' text-anchor='middle' dominant-baseline='middle'%3E${profileData.username.charAt(0).toUpperCase()}%3C/text%3E%3C/svg%3E`;
                            }}
                        />
                    ) : (
                        profileData.username.charAt(0).toUpperCase()
                    )}
                </div>

                <div className="profile-info-block">
                    <div className="profile-header-row">
                        <h1 className="profile-username">{profileData.username}</h1>
                        <div className="profile-actions">
                            {isOwnProfile ? (
                                <button className="btn-profile-action" onClick={() => navigate('/settings')}>
                                    Edit Profile
                                </button>
                            ) : (
                                <>
                                    <button 
                                        className={`btn-profile-action ${isFollowing ? '' : 'btn-profile-primary'}`} 
                                        onClick={handleFollow}
                                    >
                                        {isFollowing ? "Unfollow" : "Follow"}
                                    </button>
                                    <button className="btn-profile-action" onClick={handleMessage}>
                                        Message
                                    </button>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="profile-stats">
                        <span className="profile-stat-item"><strong>{posts.length}</strong> posts</span>
                        <span className="profile-stat-item"><strong>{profileData.followers?.length || 0}</strong> followers</span>
                        <span className="profile-stat-item"><strong>{profileData.following?.length || 0}</strong> following</span>
                    </div>

                    <div className="profile-bio">
                        {profileData.bio || "No bio yet."}
                    </div>
                </div>
            </header>

            <section className="profile-feed-column">
                {posts.length === 0 ? (
                    <div style={{ color: '#888', textAlign: 'center', padding: '2rem' }}>
                        No posts yet.
                    </div>
                ) : (
                    posts.map(post => {
                        const isTextOnly = !post.media;
                        return (
                            <div className={`profile-post-card ${isTextOnly ? 'text-only' : ''}`} key={post._id}>
                                {isOwnProfile && (
                                    <button 
                                        className="btn-profile-delete-absolute"
                                        onClick={() => handleDeletePost(post._id)}
                                        style={{
                                            position: 'absolute', top: 10, right: 10, zIndex: 10,
                                            background: 'rgba(50, 50, 50, 0.8)', border: 'none',
                                            color: '#fff', borderRadius: '50%', width: '28px', height: '28px',
                                            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            transition: 'background 0.2s'
                                        }}
                                        onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(200, 40, 40, 0.9)'}
                                        onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(50, 50, 50, 0.8)'}
                                    >
                                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                    </button>
                                )}

                                {!isTextOnly && (
                                    <div className="profile-post-media">
                                        {post.media.match(/\.(mp4|webm|ogg)$/) ? (
                                            <video src={getImageUrl(post.media)} controls />
                                        ) : (
                                            <img src={getImageUrl(post.media)} alt="Post" />
                                        )}
                                    </div>
                                )}
                                
                                {post.caption && (
                                    <div className="profile-post-caption">
                                        {post.caption}
                                    </div>
                                )}

                                <div className="profile-post-actions">
                                    <button 
                                        className={`profile-action-btn ${post.likes?.includes(currentUser?._id || currentUser?.id) ? 'liked' : ''}`}
                                        onClick={() => likePost(post._id)}
                                    >
                                        <HeartIcon filled={post.likes?.includes(currentUser?._id || currentUser?.id)} /> 
                                        {post.likes?.length || 0}
                                    </button>
                                    <button className="profile-action-btn" onClick={() => toggleComments(post._id)}>
                                        <ChatBubbleIcon /> {post.comments?.length || 0}
                                    </button>
                                    <span style={{ marginLeft: 'auto', fontSize: '0.85rem', color: '#666', alignSelf: 'center' }}>
                                        {formatTime(post.createdAt)}
                                    </span>
                                </div>

                                {activeComments === post._id && (
                                    <div className="profile-comments-section">
                                        {post.comments?.map(c => {
                                            const canDeleteComment = isOwnProfile || c.user?._id === (currentUser?._id || currentUser?.id);
                                            return (
                                                <div className="profile-comment-item" key={c._id}>
                                                    <div className="profile-comment-avatar">
                                                        {c.user?.profilePic ? (
                                                            <img src={getImageUrl(c.user.profilePic)} alt="User" />
                                                        ) : (
                                                            (c.user?.username || "U").charAt(0).toUpperCase()
                                                        )}
                                                    </div>
                                                    <div className="profile-comment-body">
                                                        <div className="profile-comment-header">
                                                            <span className="profile-comment-username">{c.user?.username || "User"}</span>
                                                            {canDeleteComment && (
                                                                <button 
                                                                    className="profile-comment-delete" 
                                                                    title="Delete Comment"
                                                                    onClick={() => deleteComment(post._id, c._id)}
                                                                >
                                                                    <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                                                                </button>
                                                            )}
                                                        </div>
                                                        <div className="profile-comment-text">{c.text}</div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        
                                        <div className="profile-comment-input-area">
                                            <input 
                                                type="text" 
                                                className="profile-comment-input" 
                                                placeholder="Add a comment..."
                                                value={commentText}
                                                onChange={(e) => setCommentText(e.target.value)}
                                                onKeyPress={(e) => e.key === 'Enter' && submitComment(post._id)}
                                            />
                                            <button 
                                                className="profile-comment-submit" 
                                                onClick={() => submitComment(post._id)}
                                                disabled={!commentText.trim()}
                                            >
                                                Post
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })
                )}
            </section>
        </div>
    );
}
