import React, { useEffect, useState, useContext, useRef } from "react";
import { io } from "socket.io-client";
import { AuthContext } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import api from "../api/axios";
import ChatInput from "../components/chat/ChatInput";
import MessageBubble from "../components/chat/MessageBubble";
import formatTime from "../utils/formatTime";
import "./Chat.css";
import socketInstance from "../socket";

export default function Chat() {
  const { user } = useContext(AuthContext);
  const location = useLocation();

  const [socket, setSocket] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);

  const messagesEndRef = useRef(null);
  const conversationIdRef = useRef(null);

  useEffect(() => {
    conversationIdRef.current = selectedConversation?._id;
  }, [selectedConversation]);

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
      if (conversationIdRef.current === msg.conversationId) {
        setMessages((prev) => [...prev, msg]);
      }

      setConversations((prev) => {
        const index = prev.findIndex(c => String(c._id) === String(msg.conversationId));
        if (index > -1) {
          const newConvos = [...prev];
          const bumped = newConvos.splice(index, 1)[0];
          bumped.lastMessage = msg;
          newConvos.unshift(bumped);
          return newConvos;
        } else {
          api.get("/conversations").then(res => setConversations(res.data));
          return prev;
        }
      });
    });

    socketInstance.on("messageUpdated", (updatedMsg) => {
      if (String(conversationIdRef.current) === String(updatedMsg.conversationId || updatedMsg.conversationId?._id)) {
        setMessages((prev) => prev.map((m) => {
            if (String(m._id) === String(updatedMsg._id)) {
                return { ...m, ...updatedMsg, text: updatedMsg.content || updatedMsg.text };
            }
            return m;
        }));
      }
    });

    socketInstance.on("messageDeleted", (updatedMsg) => {
      if (String(conversationIdRef.current) === String(updatedMsg.conversationId || updatedMsg.conversationId?._id)) {
        setMessages((prev) => prev.map((m) => {
            if (String(m._id) === String(updatedMsg._id)) {
                return { ...m, ...updatedMsg, text: updatedMsg.content || updatedMsg.text };
            }
            return m;
        }));
      }
    });

    return () => {
      socketInstance.off("receiveMessage");
      socketInstance.off("messageEdited");
      socketInstance.off("messageDeleted");
    };
  }, []);

  // Fetch conversations locally restricted to active networks natively
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const res = await api.get("/conversations");
        setConversations(res.data);

        // Natively hook navigation arguments resolving into the DOM automatically if prompted
        if (location.state?.conversation) {
            selectConversation(location.state.conversation);
            window.history.replaceState({}, document.title);
        }
      } catch (err) {
        console.error(err);
      }
    };
    if (user) {
      fetchConversations();
    }
  }, [user, location.state]);

  const selectConversation = async (conv) => {
    setSelectedConversation(conv);
    const targetParticipant = conv.participants.find(p => p._id !== (user?._id || user?.id));
    setSelectedUser(targetParticipant);

    try {
      const msgs = await api.get(`/messages/${conv._id}`);
      setMessages(msgs.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSendMessage = async ({ text, file, mediaType, mediaUrl }) => {
    if ((!text?.trim() && !file && !mediaUrl) || !selectedConversation) return;

    const formData = new FormData();
    formData.append("conversationId", selectedConversation._id);
    formData.append("receiverId", selectedUser._id);
    if (text?.trim()) formData.append("content", text); 
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
      
      // Bump map logic natively
      setConversations((prev) => {
        const index = prev.findIndex(c => String(c._id) === String(selectedConversation._id));
        if (index > -1) {
          const newConvos = [...prev];
          const bumped = newConvos.splice(index, 1)[0];
          bumped.lastMessage = res.data;
          newConvos.unshift(bumped);
          return newConvos;
        }
        return prev;
      });

    } catch (err) {
      console.error(err);
    }
  };

  const handleEditMessage = async (msgId, newText) => {
    // Optimistic UI Update natively parsing DOM before backend
    setMessages((prev) => prev.map((m) => {
        if (String(m._id) === String(msgId)) {
            return { ...m, content: newText, text: newText, edited: true };
        }
        return m;
    }));

    try {
      const res = await api.put(`/messages/${msgId}`, { text: newText });
      const updatedMsg = res.data;
      
      setMessages((prev) => prev.map((m) => {
          if (String(m._id) === String(msgId)) {
              return { ...m, ...updatedMsg, text: updatedMsg.content || updatedMsg.text };
          }
          return m;
      }));
    } catch (err) {
      console.error("DOM Sync Failed: ", err);
    }
  };

  const handleDeleteMessage = async (msgId) => {
    // Optimistic UI Update rendering Native Deleted Bubble
    setMessages((prev) => prev.map((m) => {
        if (String(m._id) === String(msgId)) {
            return { ...m, deleted: true, content: "", text: "" };
        }
        return m;
    }));

    try {
      const res = await api.delete(`/messages/${msgId}`);
      const updatedMsg = res.data;

      setMessages((prev) => prev.map((m) => {
          if (String(m._id) === String(msgId)) {
              return { ...m, ...updatedMsg, text: updatedMsg.content || updatedMsg.text };
          }
          return m;
      }));
    } catch (err) {
      console.error("DOM Sync Failed: ", err);
    }
  };

  const handleBackToUsers = () => {
    setSelectedConversation(null);
    setSelectedUser(null);
  };

  return (
    <div className="chat-layout">
      {/* Inbox List Sidebar */}
      <div className={`chat-sidebar ${selectedConversation ? 'mobile-hidden' : ''}`}>
        <div className="sidebar-header">
          <span className="sidebar-title">Messages</span>
        </div>
        <div className="user-list">
          {conversations.length === 0 ? (
            <div style={{ color: '#888', padding: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                You have no active conversations. Visit a profile to start chatting!
            </div>
          ) : conversations.map((c) => {
            const target = c.participants.find(p => p._id !== (user?._id || user?.id));
            if (!target) return null;

            return (
              <div
                key={c._id}
                onClick={() => selectConversation(c)}
                className={`user-item ${selectedConversation?._id === c._id ? 'active' : ''}`}
              >
                <div className="user-avatar">
                  {target.profilePic ? (
                    <img src={target.profilePic} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    target.username.charAt(0)
                  )}
                </div>
                <div className="user-info" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <span className="user-name">{target.username}</span>
                  {c.lastMessage && (
                      <span style={{ fontSize: '0.8rem', color: '#888', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '200px' }}>
                          {c.lastMessage.content || "Sent an attachment"}
                      </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Window */}
      <div className={`chat-main ${!selectedConversation ? 'mobile-hidden' : ''}`}>
        {selectedConversation ? (
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
                  {selectedUser?.profilePic ? (
                    <img src={selectedUser.profilePic} alt="Profile" style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                  ) : (
                    selectedUser?.username?.charAt(0) || "U"
                  )}
                </div>
                <span className="chat-header-name">{selectedUser?.username}</span>
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
                      message={{...m, text: m.content || m.text}} 
                      isOwn={String(m.sender) === String(user?.id || user?._id) || String(m.sender?._id) === String(user?.id || user?._id)}
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
            Select a conversation heavily restricted on permissions.
          </div>
        )}
      </div>
    </div>
  );
}