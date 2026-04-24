import React, { useState, useEffect } from "react";
import api from "../../api/axios";
import { useNavigate } from "react-router-dom";
import getImageUrl from "../../utils/getImageUrl";

export default function SearchComponent() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (query.trim().length > 0) {
        setLoading(true);
        api.get(`/users/search?q=${query}`)
          .then(res => setResults(res.data))
          .catch(err => console.error(err))
          .finally(() => setLoading(false));
      } else {
        setResults([]);
      }
    }, 300); // 300ms debounce

    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  return (
    <div style={{ position: 'relative', width: '100%', maxWidth: '500px', margin: '0 auto' }}>
      <input 
        type="text" 
        placeholder="Search for users..." 
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        style={{ 
            width: '100%', padding: '12px 16px', borderRadius: '8px', 
            border: '1px solid #444', background: '#111', color: '#fff',
            fontSize: '1rem', outline: 'none'
        }}
      />
      
      {(results.length > 0 || loading) && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, 
          background: '#222', color: '#fff', borderRadius: '8px', marginTop: '8px',
          boxShadow: '0 8px 16px rgba(0,0,0,0.5)', zIndex: 100, maxHeight: '350px', overflowY: 'auto'
        }}>
          {loading && <div style={{ padding: '15px', color: '#888', textAlign: 'center' }}>Searching...</div>}
          {!loading && results.map(u => (
            <div 
              key={u._id} 
              onClick={() => navigate(`/profile/${u._id}`)}
              style={{ 
                  display: 'flex', alignItems: 'center', padding: '12px 16px', 
                  cursor: 'pointer', borderBottom: '1px solid #333', transition: 'background 0.2s' 
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = '#333'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
            >
              <img 
                src={getImageUrl(u.profilePic) || 'https://via.placeholder.com/40'} 
                alt="PFP" 
                onError={(e) => { e.target.src = 'https://via.placeholder.com/40'; }}
                style={{ width: '40px', height: '40px', borderRadius: '50%', marginRight: '15px', objectFit: 'cover' }} 
              />
              <span style={{ fontWeight: 'bold', fontSize: '1.1rem' }}>{u.username}</span>
            </div>
          ))}
          {!loading && results.length === 0 && query.trim().length > 0 && (
             <div style={{ padding: '15px', color: '#888', textAlign: 'center' }}>No users found.</div>
          )}
        </div>
      )}
    </div>
  );
}
