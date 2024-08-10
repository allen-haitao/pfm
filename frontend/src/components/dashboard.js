import React from 'react';
import './Dashboard.css';

const Dashboard = () => {
    return (
        <div className="dashboard">
            <h1>Welcome Back!</h1>
            <div className="dashboard-cards">
                <div className="dashboard-card">
                    <h2>Total Income</h2>
                    <p>$5000</p>
                </div>
                <div className="dashboard-card">
                    <h2>Total Expenses</h2>
                    <p>$3000</p>
                </div>
                <div className="dashboard-card">
                    <h2>Budget Remaining</h2>
                    <p>$2000</p>
                </div>
            </div>
            <div className="dashboard-charts">
                {/* Implement charts using a library like Chart.js or Recharts */}
            </div>
            <div className="recent-transactions">
                <h2>Recent Transactions</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Date</th>
                            <th>Category</th>
                            <th>Amount</th>
                            <th>Notes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {/* Render transaction rows here */}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Dashboard;