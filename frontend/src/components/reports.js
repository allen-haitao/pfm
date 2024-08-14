import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';
import './Reports.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    ArcElement,
    Title,
    Tooltip,
    Legend
);

const Reports = () => {
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [month, setMonth] = useState(new Date().getMonth() + 1); // Current month
    const [year, setYear] = useState(new Date().getFullYear()); // Current year
    const [filterByYear, setFilterByYear] = useState(false); // Toggle between month and year filter

    useEffect(() => {
        const fetchReport = async () => {
            try {
                const response = await api.get('/reports/'); // No parameters in API call
                setReport(response.data);
            } catch (err) {
                setError('Failed to fetch report data');
            } finally {
                setLoading(false);
            }
        };

        fetchReport();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p className="error">{error}</p>;
    }

    if (!report) {
        return <p>No report data available.</p>;
    }

    // Prepare data for bar chart
    const months = Array.from({ length: 12 }, (_, i) => i + 1); // [1, 2, 3, ..., 12]

    const aggregateByMonth = (data) => {
        const monthlyTotals = Array(12).fill(0);
        data.forEach(item => {
            const date = new Date(item.occu_date);
            const monthIndex = date.getMonth(); // 0-11 for Jan-Dec
            monthlyTotals[monthIndex] += item.total;
        });
        return monthlyTotals;
    };

    const incomeData = aggregateByMonth(report.income_trends);
    const expenseData = aggregateByMonth(report.expense_trends);

    const barData = {
        labels: months.map(m => `Month ${m}`),
        datasets: [
            {
                label: 'Income',
                data: incomeData,
                backgroundColor: '#4caf50',
            },
            {
                label: 'Expenses',
                data: expenseData,
                backgroundColor: '#f44336',
            },
        ],
    };

    // Prepare data for pie chart based on month or year
    let filteredExpenses;
    if (filterByYear) {
        // Sum totals for the selected year across all months
        filteredExpenses = report.expense_categories.filter(item => {
            const date = new Date(item.occu_date);
            return date.getFullYear() === year;
        });
    } else {
        // Filter for the selected month and year
        filteredExpenses = report.expense_categories.filter(item => {
            const date = new Date(item.occu_date);
            return date.getFullYear() === year && date.getMonth() + 1 === month;
        });
    }

    // Aggregate by category for the pie chart
    const categoryTotals = {};
    report.expense_categories.forEach(item => {
        const categoryName = item.category__name;
        if (!categoryTotals[categoryName]) {
            categoryTotals[categoryName] = 0;
        }
        categoryTotals[categoryName] += item.total;
    });

    const selectedMonthOrYearExpenses = Object.keys(categoryTotals).map(category => ({
        category,
        total: categoryTotals[category],
    }));

    const pieData = {
        labels: selectedMonthOrYearExpenses.map(item => item.category),
        datasets: [
            {
                data: selectedMonthOrYearExpenses.map(item => item.total || 0),
                backgroundColor: ['#2196f3', '#ffeb3b', '#f44336', '#4caf50', '#9c27b0'],
            },
        ],
    };

    const options = {
        scales: {
            x: {
                type: 'category',
            },
            y: {
                beginAtZero: true,
            },
        },
    };

    return (
        <div className="reports-container">
            <h1>Income and Expense Trend</h1>
            <div className="chart-container">
                <Bar data={barData} options={options} />
            </div>
            <h1>Monthly/Yearly Report</h1>
            <div className="report-controls">
                <label>
                    Filter by Year:
                    <input
                        type="checkbox"
                        checked={filterByYear}
                        onChange={() => setFilterByYear(!filterByYear)}
                    />
                </label>
                <label>
                    Month:
                    <input
                        type="number"
                        value={month}
                        onChange={(e) => setMonth(parseInt(e.target.value, 10))}
                        min="1"
                        max="12"
                        disabled={filterByYear} // Disable month selection if filtering by year
                    />
                </label>
                <label>
                    Year:
                    <input
                        type="number"
                        value={year}
                        onChange={(e) => setYear(parseInt(e.target.value, 10))}
                        min="2000"
                        max={new Date().getFullYear()}
                    />
                </label>
            </div>
            <div className="chart-container">
                <Pie data={pieData} options={options} />
            </div>
        </div>
    );
};

export default Reports;