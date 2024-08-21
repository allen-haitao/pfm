import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Import the api module
import './Profile.css';

const Profile = () => {
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        first_name: '',
        last_name: '',
        new_password: '',  // Field for new password
        old_password: ''   // Field for old password, only used when changing the password
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        fetchUserData();
    }, []);

    const fetchUserData = async () => {
        try {
            const response = await api.get('/profile/'); // Fetch the user's current profile data
            setUserData({ ...response.data, new_password: '', old_password: '' }); // Reset passwords
        } catch (err) {
            setError('Failed to fetch user data');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData({
            ...userData,
            [name]: value
        });
    };

    const handleProfileUpdate = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (userData.new_password && !userData.old_password) {
            setError('You must enter your current password to set a new password');
            return;
        }

        try {
            const response = await api.put('/profile/', userData); // Send the updated data to the backend
            setSuccess('Profile updated successfully!');
            fetchUserData(); // Reload the data to ensure it's up-to-date
        } catch (err) {
            setError('Failed to update profile');
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p className="error">{error}</p>;
    }

    return (
        <div className="profile-container">
            <h1>Profile</h1>
            {success && <p className="success">{success}</p>}
            <form onSubmit={handleProfileUpdate} className="profile-form">
                <div className="form-group">
                    <label htmlFor="username">Username:</label>
                    <input
                        type="text"
                        id="username"
                        name="username"
                        value={userData.username}
                        onChange={handleInputChange}
                        disabled // Disable username change if needed
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="email">Email:</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={userData.email}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="first_name">First Name:</label>
                    <input
                        type="text"
                        id="first_name"
                        name="first_name"
                        value={userData.first_name}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="last_name">Last Name:</label>
                    <input
                        type="text"
                        id="last_name"
                        name="last_name"
                        value={userData.last_name}
                        onChange={handleInputChange}
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="new_password">New Password:</label>
                    <input
                        type="password"
                        id="new_password"
                        name="new_password"
                        value={userData.new_password}
                        onChange={handleInputChange}
                        placeholder="Leave blank to keep current password"
                    />
                </div>
                {userData.new_password && (
                    <div className="form-group">
                        <label htmlFor="old_password">Current Password:</label>
                        <input
                            type="password"
                            id="old_password"
                            name="old_password"
                            value={userData.old_password}
                            onChange={handleInputChange}
                            placeholder="Enter current password if changing password"
                            required
                        />
                    </div>
                )}
                <button type="submit">Update Profile</button>
            </form>
        </div>
    );
};

export default Profile;