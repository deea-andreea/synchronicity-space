import React, { useState } from 'react';
import './UserPage.css';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../config';

export default function UserPage({ currentUser }: { currentUser: any }) {
  const [name, setName] = useState(currentUser?.username || localStorage.getItem('user_display_name') || "Guest");
  const [avatar, setAvatar] = useState<'boy' | 'girl'>(currentUser?.avatar || (localStorage.getItem('user_avatar') as 'boy' | 'girl') || 'boy');
  const navigate = useNavigate();

  const handleSave = async () => {
    localStorage.setItem('user_avatar', avatar);
    localStorage.setItem('user_display_name', name);
    
    if (currentUser?.id) {
      try {
        await fetch(`${API_BASE_URL}/users/${currentUser.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: name, avatar })
        });
      } catch (err) {
        console.error("Failed to update profile", err);
      }
    }
    
    navigate("/home");
  };

  return (
    <div className="user-page">
      <button className="back-btn" onClick={() => navigate("/home")}>← BACK TO HOME</button>
      
      <div className="user-customization-container">
        <h2 className="title">Customize Your Avatar</h2>
        
        <div className="form-group">
          <label>Display Name</label>
          <input 
            type="text" 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
            placeholder="Your Name" 
          />
        </div>

        <div className="avatar-selection">
          <div 
            className={`avatar-option ${avatar === 'girl' ? 'selected' : ''}`}
            onClick={() => setAvatar('girl')}
          >
            <div className="avatar-preview">
              <img src="/girl/front_idle.svg" alt="Girl Avatar" />
            </div>
            <span>Girl</span>
          </div>
          
          <div 
            className={`avatar-option ${avatar === 'boy' ? 'selected' : ''}`}
            onClick={() => setAvatar('boy')}
          >
            <div className="avatar-preview">
              <img src="/boy/front_idle.svg" alt="Boy Avatar" />
            </div>
            <span>Boy</span>
          </div>
        </div>

        <button className="save-btn" onClick={handleSave}>SAVE PROFILE</button>
      </div>
    </div>
  );
}
