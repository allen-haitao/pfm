/**
 * @file login.js
 * @description Login mudule of the app
 * @author Haitao Wang
 * @date 2024-08-18
 */

import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleLogin } from '@react-oauth/google';
import api from "../services/api"
import './Login.css';


const Login = ({ handleLogin }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await api.post('login/', {
                email: email,
                password: password,
            });

            handleLogin(response.data.access, response.data.refresh, response.data.username);

            navigate('/');
        } catch (err) {
            setError('Invalid email or password');
        }
    };

    // Handle Google login success
    const handleGoogleLoginSuccess = async (response) => {
        const googleToken = response.credential;

        try {
            // Send the Google token to your backend for verification
            const serverResponse = await api.post('/google-login/', { token: googleToken });

            // returns access and refresh tokens
            handleLogin(serverResponse.data.access, serverResponse.data.refresh, serverResponse.data.username);
            navigate('/');
        } catch (err) {
            setError('Google login failed');
        }
    };

    // Handle Google login failure
    const handleGoogleLoginFailure = () => {
        setError('Google login failed');
    };

    return (
        <div className="login-container">
            <h1>Login</h1>
            {error && <p className="error">{error}</p>}
            <form onSubmit={handleSubmit} className="login-form">
                <div className="form-group">
                    <label htmlFor="email">Email</label>
                    <input
                        type="email"
                        id="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                </div>
                <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" className="login-button">Login</button>
            </form>
            <div className="register">
                <p>
                    Don't have an account?
                    <Link to="/register"> Register here</Link>
                </p>
            </div>
            <div className="google-login">
                <GoogleLogin
                    onSuccess={handleGoogleLoginSuccess}
                    onError={handleGoogleLoginFailure}
                />
            </div>
        </div>

    );
};

export default Login;