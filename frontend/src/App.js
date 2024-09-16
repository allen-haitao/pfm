import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Navbar from './components/navbar';
import Register from './components/register';
import Login from './components/login';
import Profile from './components/profile';
import Dashboard from './components/dashboard';
import Transactions from './components/transactions';
import Budgets from './components/budgets';
import Categories from './components/categories';
import Reports from './components/reports';
import Footer from './components/footer';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));
  const [username, setUsername] = useState(localStorage.getItem('username') || '');

  const handleLogin = (accessToken, refreshToken, username) => {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
    localStorage.setItem('username', username);

    setIsAuthenticated(true);
    setUsername(username); // Set username in state
  };

  const handleLogout = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    setUsername(''); // Clear username in state
  };

  const setAuth = (authStatus) => {
    setIsAuthenticated(authStatus);
  };

  return (
    <GoogleOAuthProvider clientId="744737354297-gsjli5vd9kd0p3ogc3cmetbuffv70hk5.apps.googleusercontent.com">
      <Router>
        <Navbar isAuthenticated={isAuthenticated} susername={username} handleLogout={handleLogout} />
        <div className="main-content">
          <Routes>
            <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register setAuth={setAuth} />} />
            <Route path="/login" element={<Login handleLogin={handleLogin} />} />
            <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
            <Route path="/transactions" element={isAuthenticated ? <Transactions /> : <Navigate to="/login" />} />
            <Route path="/budgets" element={isAuthenticated ? <Budgets /> : <Navigate to="/login" />} />
            <Route path="/categories" element={isAuthenticated ? <Categories /> : <Navigate to="/login" />} />
            <Route path="/reports" element={isAuthenticated ? <Reports /> : <Navigate to="/login" />} />
            <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
          </Routes>
          <Footer />
        </div>
      </Router>
    </GoogleOAuthProvider >
  );
};

export default App;