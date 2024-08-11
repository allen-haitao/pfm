import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Import the api module
//import { Bar, Pie } from 'react-chartjs-2';
import './Reports.css';

const Reports = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1); // current month
    const [year, setYear] = useState(new Date().getFullYear()); // current year

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await api.get(`/reports/`, {
                    params: { month, year },
                });
                setReport(response.data);
            } catch (err) {
                setError('Failed to fetch report data');
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, [month, year]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p className="error">{error}</p>;
    }

    const incomeData = {
        labels: ['Income', 'Expenses'],
        datasets: [
            {
                label: 'Income vs Expenses',
                data: [report.income, report.expenses],
                backgroundColor: ['#4caf50', '#f44336'],
            },
        ],
    };

    const categoryData = {
        labels: report.categories.map(cat => cat['category__name']),
        datasets: [
            {
                label: 'Expenses by Category',
                data: report.categories.map(cat => cat.total_amount),
                backgroundColor: ['#2196f3', '#ffeb3b', '#f44336', '#4caf50', '#9c27b0'],
            },
        ],
    };

    return (
        <div className="reports-container">
            <h1>Monthly Report</h1>
            <div className="report-controls">
                <label>
                    Month:
                    <input
                        type="number"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                        min="1"
                        max="12"
                    />
                </label>
                <label>
                    Year:
                    <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(e.target.value)}
                        min="2000"
                        max={new Date().getFullYear()}
                    />
                </label>
            </div>
            <div className="chart-container">
                bar
            </div>
            <div className="chart-container">
                pie
            </div>
            <div className="report-summary">
                <p><strong>Total Income:</strong> ${report.income.toFixed(2)}</p>
                <p><strong>Total Expenses:</strong> ${report.expenses.toFixed(2)}</p>
                <p><strong>Net Savings:</strong> ${report.net.toFixed(2)}</p>
            </div>
        </div>
    );
};

export default Reports;