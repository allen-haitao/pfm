import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState({});

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await api.get('/dashboard/');
                setDashboardData(response.data);
            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchDashboardData();
    }, []);

    return (
        <div>
            <h2>Dashboard</h2>
            <div>
                <p>Total Income: {dashboardData.total_income}</p>
                <p>Total Expenses: {dashboardData.total_expenses}</p>
                <p>Total Savings: {dashboardData.total_savings}</p>
                <h3>Recent Transactions:</h3>
                <ul>
                    {dashboardData.recent_transactions && dashboardData.recent_transactions.map(transaction => (
                        <li key={transaction.id}>
                            {transaction.date} - {transaction.amount} ({transaction.type})
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Dashboard;