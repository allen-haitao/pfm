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

                // Convert the amounts in recent_transactions to floats
                const processedData = {
                    ...response.data,
                    total_income: parseFloat(response.data.total_income),
                    total_expenses: parseFloat(response.data.total_expenses),
                    recent_transactions: response.data.recent_transactions.map(transaction => ({
                        ...transaction,
                        amount: parseFloat(transaction.amount),
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
            <div className="recent-transactions">
                <h2>Recent Transactions</h2>
                <table className="transactions-table">
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Type</th>
                            <th>Amount</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {dashboardData.recent_transactions.map((transaction) => (
                            <tr key={transaction.id}>
                                <td>{new Date(transaction.occu_date).toLocaleDateString()}</td>
                                <td>{transaction.category_name}</td>
                                <td>{transaction.type}</td>
                                <td>${transaction.amount.toFixed(2)}</td>
                                <td>{transaction.notes}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;