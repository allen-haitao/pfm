import React from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = ({ isAuthenticated }) => {
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
                </ul>
            </div>
        </nav>
    );
};

export default Navbar;