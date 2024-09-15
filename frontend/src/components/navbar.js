import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChartLine, faDashboard, faExchange, faTags, faUser, faPiggyBank, faRegistered, faSignIn, faSignOut, faUserPlus } from '@fortawesome/free-solid-svg-icons';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, setAuth }) => {
    const navigate = useNavigate();
    const [username, setUsername] = useState('');

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('username'); // Clear username on logout
        setAuth(false);
        window.location.assign('/');
    };
    useEffect(() => {
        // Retrieve username from localStorage
        const storedUsername = localStorage.getItem('username');
        if (storedUsername) {
            setUsername(storedUsername);
        }
    }, []);

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="logo-container">
                    <img src="/logo.webp" alt="Finance Tracker Logo" className="navbar-logo" />
                </div>
                <div className="slogan">
                    <link href="https://fonts.googleapis.com/css2?family=Gluten:wght@100..900&display=swap" rel="stylesheet"></link>
                    Your Path to Financial Freedom</div>
                <ul className="navbar-menu">
                    <li><Link to="/"><FontAwesomeIcon icon={faDashboard} size='1x' /> Dashboard</Link></li>
                    <li><Link to="/profile"><FontAwesomeIcon icon={faUser} size='1x' /> Profile</Link></li>
                    <li><Link to="/transactions"><FontAwesomeIcon icon={faExchange} size='1x' /> Transactions</Link></li>
                    <li><Link to="/budgets"><FontAwesomeIcon icon={faPiggyBank} size='1x' />Budgets</Link></li>
                    <li><Link to="/categories"><FontAwesomeIcon icon={faTags} size='1x' />Categories</Link></li>
                    <li><Link to="/reports"><FontAwesomeIcon icon={faChartLine} size='1x' />Reports</Link></li>
                    {!isAuthenticated && (
                        <>
                            <li><Link to="/register"><FontAwesomeIcon icon={faUserPlus} />Register</Link></li>
                            <li><Link to="/login"><FontAwesomeIcon icon={faSignIn} />Login</Link></li>
                        </>
                    )}
                    {isAuthenticated && (
                        <>
                            <li className="navbar-username">Hello, {username}</li>
                            <li><Link to="/"
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent the default link behavior
                                    handleLogout();     // Call the logout function
                                }}><FontAwesomeIcon icon={faSignOut} />Logout</Link></li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;