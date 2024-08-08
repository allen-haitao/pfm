import React, { useEffect, useState } from 'react';
import api from '../services/api';

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

    return (
        <div>
            <h2>Profile</h2>
            <div>
                <p>Username: {profile.username}</p>
                <p>Email: {profile.email}</p>
            </div>
        </div>
    );
};

export default Profile;