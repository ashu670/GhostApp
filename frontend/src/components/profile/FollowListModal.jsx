import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api/axios";
import getImageUrl from "../../utils/getImageUrl";
import "./FollowListModal.css";

export default function FollowListModal({ type, userId, isOpen, onClose }) {
    const [list, setList] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        if (!isOpen || !userId) return;

        const fetchList = async () => {
            setLoading(true);
            try {
                const res = await api.get(`/users/${userId}/${type}`);
                setList(res.data);
            } catch (err) {
                console.error(`Failed to load ${type}:`, err);
            } finally {
                setLoading(false);
            }
        };

        fetchList();
    }, [isOpen, userId, type]);

    if (!isOpen) return null;

    const handleUserClick = (id) => {
        onClose();
        navigate(`/profile/${id}`);
    };

    return (
        <div className="follow-modal-overlay" onClick={onClose}>
            <div className="follow-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="follow-modal-header">
                    <h2>{type === "followers" ? "Followers" : "Following"}</h2>
                    <button className="follow-modal-close" onClick={onClose}>
                        <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                <div className="follow-modal-body">
                    {loading ? (
                        <div className="follow-modal-loading">Loading...</div>
                    ) : list.length === 0 ? (
                        <div className="follow-modal-empty">
                            No {type} yet.
                        </div>
                    ) : (
                        list.map((u) => (
                            <div className="follow-list-item" key={u._id} onClick={() => handleUserClick(u._id)}>
                                <div className="follow-item-avatar">
                                    {u.profilePic ? (
                                        <img src={getImageUrl(u.profilePic)} alt={u.username} />
                                    ) : (
                                        u.username.charAt(0).toUpperCase()
                                    )}
                                </div>
                                <div className="follow-item-info">
                                    <span className="follow-item-username">{u.username}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
