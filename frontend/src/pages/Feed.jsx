import { useEffect, useState, useContext } from "react";
import api from "../api/axios";
import { AuthContext } from "../context/AuthContext";
import formatTime from "../utils/formatTime";
import "./Feed.css";

// Icons (UI only)
const ImageFileIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
  </svg>
);

const HeartIcon = ({ filled }) => (
  <svg fill={filled ? "currentColor" : "none"} viewBox="0 0 24 24" stroke="currentColor" className={filled ? "icon-filled" : ""}>
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const ChatBubbleIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
  </svg>
);

const ShareIcon = () => (
  <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

export default function Feed() {
  const { user } = useContext(AuthContext);

  const [posts, setPosts] = useState([]);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [page, setPage] = useState(1);
  const [activeComments, setActiveComments] = useState(null);
  const [commentText, setCommentText] = useState("");

  const fetchPosts = async () => {
    try {
      const res = await api.get(`/posts?page=${page}&limit=5`);
      setPosts(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, [page]);

  const uploadPost = async () => {
    if (!file && !caption) return;

    const formData = new FormData();
    if (file) formData.append("media", file);
    formData.append("caption", caption);

    try {
      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setFile(null);
      setCaption("");
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const deletePost = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return;
    try {
      await api.delete(`/posts/${id}`);
      fetchPosts();
    } catch (err) {
      console.error(err);
    }
  };

  const likePost = async (id) => {
    try {
      const res = await api.post(`/posts/${id}/like`);
      // Update local state optimizing for fast UI
      setPosts(posts.map(p => p._id === id ? { ...p, likes: res.data.likes } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const sharePost = async (id) => {
    try {
      const res = await api.post(`/posts/${id}/share`);
      setPosts(posts.map(p => p._id === id ? { ...p, shares: res.data.shares } : p));
    } catch (err) {
      console.error(err);
    }
  };

  const toggleComments = (id) => {
    if (activeComments === id) {
      setActiveComments(null);
    } else {
      setActiveComments(id);
      setCommentText("");
    }
  };

  const submitComment = async (id) => {
    if (!commentText.trim()) return;
    try {
      await api.post(`/posts/${id}/comment`, { text: commentText });
      setCommentText("");
      fetchPosts(); // Safest way to ensure deep populate matches
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="feed-layout">
      <div className="feed-container">

        {/* Top Search Bar */}
        <div className="top-search-bar">
          <svg className="top-search-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            className="top-search-input"
            placeholder="Search GhostApp"
          />
        </div>

        {/* Upload Section */}
        <div className="upload-card-dash">
          <div className="post-avatar" style={{ width: '36px', height: '36px', fontSize: '14px' }}>
            {user?.profilePic ? (
              <img src={`${import.meta.env.VITE_API_URL}/uploads/${user.profilePic}`} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              user?.username?.charAt(0) || "U"
            )}
          </div>

          <div className="upload-input-group">
            <textarea
              className="upload-input-dash"
              placeholder="What's on your mind?"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={1}
            />
          </div>

          <div className="upload-actions-dash">
            <div className="file-input-wrapper">
              <button className="file-input-btn-dash">
                <ImageFileIcon />
                Media
              </button>
              <input type="file" onChange={(e) => setFile(e.target.files[0])} accept="image/*,video/*" />
            </div>

            <button
              className="upload-submit-dash"
              onClick={uploadPost}
              disabled={!file && !caption.trim()}
            >
              Post
            </button>
          </div>
        </div>

        {/* Posts */}
        {posts.map((post) => (
          <div className="post-card" key={post._id}>

            <div className="post-header">
              <div className="post-user-info">
                <div className="post-avatar">
                  {post.user.profilePic ? (
                    <img src={`${import.meta.env.VITE_API_URL}/uploads/${post.user.profilePic}`} alt={post.user.username} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    post.user.username.charAt(0)
                  )}
                </div>
                <div>
                  <span className="post-username">{post.user.username}</span>
                  <span className="post-handle-time">@{post.user.username.toLowerCase().replace(/\s/g, '')} · {formatTime(post.createdAt)}</span>
                </div>
              </div>

              {post.user._id === (user?.id || user?._id) ? (
                <button className="post-options-btn" title="Delete Post" onClick={() => deletePost(post._id)}>
                  ✕
                </button>
              ) : (
                <button className="post-options-btn">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z" />
                  </svg>
                </button>
              )}
            </div>

            <div className="post-content-area">
              <p className={post.media ? "post-content" : "post-content text-only-post"}>{post.caption}</p>

              {post.media && (
                <div className="post-media-container">
                  {post.media.match(/\.(mp4|webm|ogg)$/) ? (
                    <video
                      className="post-media"
                      src={`${import.meta.env.VITE_API_URL}/uploads/${post.media}`}
                      controls
                    />
                  ) : (
                    <img
                      className="post-media"
                      src={`${import.meta.env.VITE_API_URL}/uploads/${post.media}`}
                      alt="Post media"
                    />
                  )}
                </div>
              )}

              {/* Reaction Icons */}
              <div className="post-actions">
                <button className="action-btn" onClick={() => toggleComments(post._id)}>
                  <ChatBubbleIcon /> {post.comments?.length > 0 && post.comments.length}
                </button>
                <button className="action-btn" onClick={() => sharePost(post._id)}>
                  <ShareIcon /> {post.shares > 0 && post.shares}
                </button>
                <button className={post.likes?.includes(user?.id || user?._id) ? "action-btn liked glowing" : "action-btn"} onClick={() => likePost(post._id)}>
                  <HeartIcon filled={post.likes?.includes(user?.id || user?._id)} /> {post.likes?.length > 0 && post.likes.length}
                </button>
              </div>

              {/* Comments Section */}
              {activeComments === post._id && (
                <div className="comments-section">
                  <div className="comments-list">
                    {post.comments?.map((c, i) => (
                      <div className="comment-item" key={i}>
                        <div className="comment-avatar">
                          {c.user?.profilePic ? (
                            <img src={`${import.meta.env.VITE_API_URL}/uploads/${c.user.profilePic}`} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                          ) : (
                            c.user?.username?.charAt(0) || "U"
                          )}
                        </div>
                        <div className="comment-body">
                          <div className="comment-header">
                            <span className="comment-username">{c.user?.username || "Deleted User"}</span>
                            <span className="comment-time">{formatTime(c.createdAt)}</span>
                          </div>
                          <div className="comment-text">{c.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="comment-input-area">
                    <input
                      type="text"
                      className="comment-input"
                      placeholder="Add a comment..."
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && submitComment(post._id)}
                    />
                    <button className="comment-submit" onClick={() => submitComment(post._id)} disabled={!commentText.trim()}>Post</button>
                  </div>
                </div>
              )}
            </div>

          </div>
        ))}

        {/* Pagination Dashboard Style */}
        <div className="pagination">
          <button
            className="page-btn"
            onClick={() => setPage((p) => p + 1)}
            disabled={posts.length < 5}
          >
            Load more
          </button>
        </div>

      </div>
    </div>
  );
}