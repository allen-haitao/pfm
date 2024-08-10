import React from 'react';
import './Profile.css';

const Profile = () => {
    return (
        <div className="profile">
            <h1>Profile</h1>
            <div className="profile-card">
                <h2>John Doe</h2>
                <p>Email: johndoe@example.com</p>
                {/* Add other user info */}
                <button>Edit Profile</button>
            </div>
        </div>
    );
};

export default Profile;