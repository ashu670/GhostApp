import React, { useEffect, useState, useContext, useRef } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import ChatInput from "../components/chat/ChatInput";
import MessageBubble from "../components/chat/MessageBubble";
import formatTime from "../utils/formatTime";
import "./Chat.css";

export default function Chat() {
  const { user } = useContext(AuthContext);

  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect socket
  useEffect(() => {
    const newSocket = io("http://localhost:5000", {
      auth: {
        token: localStorage.getItem("token"),
      },
    });

    setSocket(newSocket);

    newSocket.on("receiveMessage", (msg) => {
      setMessages((prev) => [...prev, msg]);
    });

    newSocket.on("messageEdited", (updatedMsg) => {
      setMessages((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
    });

    newSocket.on("messageDeleted", (updatedMsg) => {
      setMessages((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
    });

    return () => newSocket.close();
  }, []);

  // Fetch all users
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await api.get("/users/search?q=");
        setUsers(res.data.filter(u => u._id !== (user?.id || user?._id)));
      } catch (err) {
        console.error(err);
      }
    };
    if (user) {
      fetchUsers();
    }
  }, [user]);

  // Select user and get conversation
  const selectUser = async (u) => {
    setSelectedUser(u);
    try {
      const res = await api.post("/messages/conversation", {
        receiverId: u._id,
      });
      setConversationId(res.data._id);

      const msgs = await api.get(`/messages/${res.data._id}`);
      setMessages(msgs.data);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Send from ChatInput
  const handleSendMessage = async ({ text, file, mediaType, mediaUrl }) => {
    if ((!text?.trim() && !file && !mediaUrl) || !conversationId) return;

    const formData = new FormData();
    formData.append("conversationId", conversationId);
    formData.append("receiverId", selectedUser._id);
    if (text?.trim()) formData.append("text", text);
    if (file) formData.append("media", file);
    if (mediaType && mediaUrl) {
      formData.append("mediaType", mediaType);
      formData.append("mediaUrl", mediaUrl);
    }

    try {
      const res = await api.post("/messages", formData, {
        headers: { "Content-Type": "multipart/form-data" }
      });
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Edit from MessageBubble
  const handleEditMessage = async (msgId, newText) => {
    try {
      const res = await api.put(`/messages/${msgId}`, { text: newText });
      setMessages((prev) => prev.map(m => m._id === msgId ? res.data : m));
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Delete from MessageBubble
  const handleDeleteMessage = async (msgId) => {
    try {
      const res = await api.delete(`/messages/${msgId}`);
      setMessages((prev) => prev.map(m => m._id === msgId ? res.data : m));
    } catch (err) {
      console.error(err);
    }
  };

  const handleBackToUsers = () => {
    setSelectedUser(null);
  };

  return (
    <div className="chat-layout">
      {/* Users List Sidebar */}
      <div className={`chat-sidebar ${selectedUser ? 'mobile-hidden' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">Messages</span>
        </div>
        <div className="user-list">
          {users.map((u) => (
            <div
              key={u._id}
              onClick={() => selectUser(u)}
              className={`user-item ${selectedUser?._id === u._id ? 'active' : ''}`}
            >
              <div className="user-avatar">
                {u.profilePic ? (
                  <img src={`http://localhost:5000/uploads/${u.profilePic}`} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  u.username.charAt(0)
                )}
              </div>
              <div className="user-info">
                <span className="user-name">{u.username}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`chat-main ${!selectedUser ? 'mobile-hidden' : ''}`}>
        {selectedUser ? (
          <>
            <div className="chat-header">
              <button className="mobile-back-btn" onClick={handleBackToUsers}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="user-avatar" style={{ width: '36px', height: '36px' }}>
                {selectedUser.profilePic ? (
                  <img src={`http://localhost:5000/uploads/${selectedUser.profilePic}`} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                ) : (
                  selectedUser.username.charAt(0)
                )}
              </div>
              <span className="chat-header-name">{selectedUser.username}</span>
            </div>

            <div className="chat-messages">
              {messages.map((m, index) => {
                const prevMessage = messages[index - 1];
                const showTimestamp = !prevMessage || (new Date(m.createdAt) - new Date(prevMessage.createdAt) > 20 * 60 * 1000);

                return (
                  <React.Fragment key={m._id || index}>
                    {showTimestamp && (
                      <div className="chat-timestamp">
                        {formatTime(m.createdAt)}
                      </div>
                    )}
                    <MessageBubble
                      message={m}
                      isOwn={m.sender === (user?.id || user?._id) || m.sender?._id === (user?.id || user?._id)}
                      onEdit={handleEditMessage}
                      onDelete={handleDeleteMessage}
                    />
                  </React.Fragment>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="chat-input-area" style={{ padding: '0px', borderTop: 'none', background: 'transparent' }}>
              <ChatInput onSendMessage={handleSendMessage} />
            </div>
          </>
        ) : (
          <div className="empty-chat">
            Select a user from the sidebar to start chatting
          </div>
        )}
      </div>
    </div>
  );
}