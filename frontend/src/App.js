import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import Navbar from './components/navbar';
import Register from './components/register';
import Login from './components/login';
import Profile from './components/profile';
import Dashboard from './components/dashboard';
import Transactions from './components/transactions';
import Budgets from './components/budgets';
import Categories from './components/categories';
import Reports from './components/reports';
import './App.css';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

  const setAuth = (authStatus) => {
    setIsAuthenticated(authStatus);
  };

  return (
    <Router>
      <Navbar isAuthenticated={isAuthenticated} />
      <div className="main-content">
        <Routes>
          <Route path="/register" element={isAuthenticated ? <Navigate to="/" /> : <Register />} />
          <Route path="/login" element={isAuthenticated ? <Navigate to="/" /> : <Login setAuth={setAuth} />} />
          <Route path="/profile" element={isAuthenticated ? <Profile /> : <Navigate to="/login" />} />
          <Route path="/transactions" element={isAuthenticated ? <Transactions /> : <Navigate to="/login" />} />
          <Route path="/budgets" element={isAuthenticated ? <Budgets /> : <Navigate to="/login" />} />
          <Route path="/categories" element={isAuthenticated ? <Categories /> : <Navigate to="/login" />} />
          <Route path="/reports" element={isAuthenticated ? <Reports /> : <Navigate to="/login" />} />
          <Route path="/" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;