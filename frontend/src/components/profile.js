import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Profile.css';

const Profile = () => {
    const [profile, setProfile] = useState({});

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get('/profile/');
                setProfile(response.data);
            } catch (error) {
                console.error('Error fetching profile:', error);
            }
        };

        fetchProfile();
    }, []);
    if (!profile) {
        return <div>Loading...</div>;
    }
    return (
        <div className="profile-container">
            <h1>Profile</h1>
            <div className="profile-card">
                <div className="profile-details">
                    <p><strong>Name:</strong> {profile.name}</p>
                    <p><strong>Email:</strong> {profile.email}</p>
                    <p><strong>Phone:</strong> {profile.phone}</p>
                    <p><strong>Address:</strong> {profile.address}</p>
                </div>
                <button className="edit-profile-button">Edit Profile</button>
            </div>
        </div>
    );
};

export default Profile;