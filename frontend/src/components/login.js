import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from "../services/api"
import './Login.css';


const Login = ({ setAuth }) => {
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

            localStorage.setItem('access_token', response.data.access);
            localStorage.setItem('refresh_token', response.data.refresh);
            localStorage.setItem('username', response.data.username);
            setAuth(true);
            navigate('/');
        } catch (err) {
            setError('Invalid email or password');
        }
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
        </div>
    );
};

export default Login;