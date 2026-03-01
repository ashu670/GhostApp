import React, { useEffect, useState, useContext, useRef } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import api from "../api/axios";
import ChatInput from "../components/chat/ChatInput";
import MessageBubble from "../components/chat/MessageBubble";
import formatTime from "../utils/formatTime";
import "./Chat.css";
import socketInstance from "../socket";

export default function Chat() {
  const { user } = useContext(AuthContext);

  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [conversationId, setConversationId] = useState(null);
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const conversationIdRef = useRef(conversationId);

  useEffect(() => {
    conversationIdRef.current = conversationId;
  }, [conversationId]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Connect socket
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      socketInstance.auth = { token };
      socketInstance.connect();
    }

    setSocket(socketInstance);

    socketInstance.on("receiveMessage", (msg) => {
      if (conversationIdRef.current && (msg.conversationId === conversationIdRef.current || (msg.conversationId && msg.conversationId._id === conversationIdRef.current))) {
        setMessages((prev) => [...prev, msg]);
      }

      // Bump sender to top if we receive a message from them
      setUsers(prevUsers => {
        let senderId = null;
        let senderObj = null;

        if (msg.sender && typeof msg.sender === 'object') {
          senderId = msg.sender._id || msg.sender.id;
          senderObj = msg.sender;
        } else {
          senderId = msg.sender;
        }

        if (!senderId) return prevUsers; // safety check

        // Find if user already exists in current list
        const userIndex = prevUsers.findIndex(u => String(u._id) === String(senderId));

        if (userIndex > -1) {
          // User exists, move them to top
          const newUsers = [...prevUsers];
          const bumpedUser = newUsers.splice(userIndex, 1)[0];

          // If the socket payload gave us a fresh populated object, merge any updates (like new profilePic)
          const updatedUser = senderObj ? { ...bumpedUser, ...senderObj } : bumpedUser;

          newUsers.unshift(updatedUser);
          return newUsers;
        } else if (senderObj) {
          // Doesn't exist in list yet, add to top.
          return [senderObj, ...prevUsers];
        }

        return prevUsers;
      });
    });

    socketInstance.on("messageEdited", (updatedMsg) => {
      if (!conversationIdRef.current || updatedMsg.conversationId === conversationIdRef.current || (updatedMsg.conversationId && updatedMsg.conversationId._id === conversationIdRef.current)) {
        setMessages((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
      }
    });

    socketInstance.on("messageDeleted", (updatedMsg) => {
      if (!conversationIdRef.current || updatedMsg.conversationId === conversationIdRef.current || (updatedMsg.conversationId && updatedMsg.conversationId._id === conversationIdRef.current)) {
        setMessages((prev) => prev.map(m => m._id === updatedMsg._id ? updatedMsg : m));
      }
    });

    return () => {
      socketInstance.off("receiveMessage");
      socketInstance.off("messageEdited");
      socketInstance.off("messageDeleted");
    };
  }, []);

  // Fetch users and map to recent conversations if any
  useEffect(() => {
    const fetchUsersAndConversations = async () => {
      try {
        // Fetch all users or friends
        const resUsers = await api.get("/users/search?q=");
        const allUsers = resUsers.data.filter(u => u._id !== (user?.id || user?._id));

        // Fetch recent conversations for sorting
        const resConvos = await api.get("/messages/conversations/recent");
        const recentConvos = resConvos.data; // Expected: [{ recipientId, lastMessageAt }, ...]

        // Create a map for quick lookup of last message time
        const lastActiveMap = {};
        recentConvos.forEach(c => {
          lastActiveMap[c.recipientId] = new Date(c.lastMessageAt).getTime();
        });

        // Sort users: those with conversations first (sorted by recent), then others alphabetically
        const sortedUsers = [...allUsers].sort((a, b) => {
          const timeA = lastActiveMap[a._id] || 0;
          const timeB = lastActiveMap[b._id] || 0;

          if (timeA !== timeB) {
            return timeB - timeA; // Descending time
          }
          // Fallback to alphabetical if both have no conversation or same time (unlikely)
          return a.username.localeCompare(b.username);
        });

        setUsers(sortedUsers);
      } catch (err) {
        console.error(err);
      }
    };
    if (user) {
      fetchUsersAndConversations();
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

  // When sending a message, manually bump the user to the top
  const bumpUserToTop = (userId) => {
    setUsers(prevUsers => {
      const userIndex = prevUsers.findIndex(u => u._id === userId);
      if (userIndex > 0) {
        const newUsers = [...prevUsers];
        const [bumpedUser] = newUsers.splice(userIndex, 1);
        newUsers.unshift(bumpedUser);
        return newUsers;
      }
      return prevUsers;
    });
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
      bumpUserToTop(selectedUser._id);
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
                  <img src={u.profilePic} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
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
              <div className="chat-header-left">
                <button className="mobile-back-btn" onClick={handleBackToUsers}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 12H5M12 19l-7-7 7-7" />
                  </svg>
                </button>
              </div>

              <div className="chat-header-center">
                <div className="user-avatar" style={{ width: '36px', height: '36px' }}>
                  {selectedUser.profilePic ? (
                    <img src={selectedUser.profilePic} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    selectedUser.username.charAt(0)
                  )}
                </div>
                <span className="chat-header-name">{selectedUser.username}</span>
              </div>

              <div className="chat-header-right">
                <button className="chat-menu-btn">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="1" />
                    <circle cx="12" cy="5" r="1" />
                    <circle cx="12" cy="19" r="1" />
                  </svg>
                </button>
              </div>
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