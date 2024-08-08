import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Switch, Redirect, Link } from 'react-router-dom';
import Register from './components/register';
import Login from './components/login';
import Profile from './components/profile';
import Dashboard from './components/dashboard';
import Transactions from './components/transactions';
import Budgets from './components/budgets';
import Categories from './components/categories';
import Reports from './components/reports';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('access_token'));

  const setAuth = (authStatus) => {
    setIsAuthenticated(authStatus);
  };

  return (
    <Router>
      <div>
        <nav>
          <ul>
            <li><Link to="/">Dashboard</Link></li>
            <li><Link to="/profile">Profile</Link></li>
            <li><Link to="/transactions">Transactions</Link></li>
            <li><Link to="/budgets">Budgets</Link></li>
            <li><Link to="/categories">Categories</Link></li>
            <li><Link to="/reports">Reports</Link></li>
            {!isAuthenticated && <li><Link to="/register">Register</Link></li>}
            {!isAuthenticated && <li><Link to="/login">Login</Link></li>}
          </ul>
        </nav>
        <Switch>
          <Route path="/register">
            {isAuthenticated ? <Redirect to="/" /> : <Register />}
          </Route>
          <Route path="/login">
            {isAuthenticated ? <Redirect to="/" /> : <Login setAuth={setAuth} />}
          </Route>
          <Route path="/profile">
            {isAuthenticated ? <Profile /> : <Redirect to="/login" />}
          </Route>
          <Route path="/transactions">
            {isAuthenticated ? <Transactions /> : <Redirect to="/login" />}
          </Route>
          <Route path="/budgets">
            {isAuthenticated ? <Budgets /> : <Redirect to="/login" />}
          </Route>
          <Route path="/categories">
            {isAuthenticated ? <Categories /> : <Redirect to="/login" />}
          </Route>
          <Route path="/reports">
            {isAuthenticated ? <Reports /> : <Redirect to="/login" />}
          </Route>
          <Route path="/">
            {isAuthenticated ? <Dashboard /> : <Redirect to="/login" />}
          </Route>
        </Switch>
      </div>
    </Router>
  );
};

export default App;