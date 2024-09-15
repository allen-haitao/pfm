import React, { useState, useEffect } from 'react';
import api from '../services/api';
import './Dashboard.css';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/dashboard/');
                const processedData = {
                    ...response.data,
                    total_income: parseFloat(response.data.total_income),
                    total_expenses: parseFloat(response.data.total_expenses),
                    recent_notification: response.data.recent_notification.map(notification => ({
                        ...notification,
                    })),
                };

                setDashboardData(processedData);
                setLoading(false);
            } catch (err) {
                setError(err.response?.data?.detail || err.message);
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p className="error">{error}</p>;
    }

    return (
        <div className="dashboard-container">
            <h1>Dashboard</h1>
            <div className="dashboard-stats">
                <div className="dashboard-card">
                    <h2>Total Income</h2>
                    <p>${dashboardData.total_income.toFixed(2)}</p>
                </div>
                <div className="dashboard-card">
                    <h2>Total Expenses</h2>
                    <p>${dashboardData.total_expenses.toFixed(2)}</p>
                </div>
                <div className="dashboard-card">
                    <h2>Net Balance</h2>
                    <p>${(dashboardData.total_income - dashboardData.total_expenses).toFixed(2)}</p>
                </div>
            </div>
            <div className="recent-notification">
                <h2>Recent Transactions</h2>
                <table className="transactions-table">
                    <thead>
                        <tr>
                            <th>Notify</th>
                            <th>Type</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dashboardData.recent_notification.map((notification) => (
                            <tr key={notification.id}
                                style={{
                                    backgroundColor: notification.types === 'warning' ? '#b51222' :
                                        notification.types === 'info' ? '#ffcccb' :
                                            'transparent'
                                }}>
                                <td>{notification.notify}</td>
                                <td>{notification.types}</td>
                                <td>{notification.create_time}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;