import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated, setAuth }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        setAuth(false);
        window.location.assign('/');
    };
    return (
        <nav className="navbar">
            <div className="navbar-container">
                <Link to="/" className="navbar-logo">
                    MyApp
                </Link>
                <ul className="navbar-menu">
                    <li><Link to="/">Dashboard</Link></li>
                    <li><Link to="/profile">Profile</Link></li>
                    <li><Link to="/transactions">Transactions</Link></li>
                    <li><Link to="/budgets">Budgets</Link></li>
                    <li><Link to="/categories">Categories</Link></li>
                    <li><Link to="/reports">Reports</Link></li>
                    {!isAuthenticated && (
                        <>
                            <li><Link to="/register">Register</Link></li>
                            <li><Link to="/login">Login</Link></li>
                        </>
                    )}
                    {isAuthenticated && (
                        <>
                            <li><Link to="/"
                                onClick={(e) => {
                                    e.preventDefault(); // Prevent the default link behavior
                                    handleLogout();     // Call the logout function
                                }}>Logout</Link></li>
                        </>
                    )}
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;