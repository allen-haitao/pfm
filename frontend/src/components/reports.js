/**
 * @file reports.js
 * @description reports
 * @author Haitao Wang
 * @date 2024-09-02
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
    ArcElement,
    Title,
    Tooltip,
    Legend,
} from 'chart.js';
import { Bar, Line, Pie } from 'react-chartjs-2';
import './Reports.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    LineElement,
    PointElement,
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
                const response = await api.get('/reports/');
                console.log("Fetched Report Data:", response.data);
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

    // Month names to be displayed on the x-axis
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

    // Helper function to aggregate data by month
    const aggregateByMonth = (data, year) => {
        const monthlyTotals = Array(12).fill(0); // Initialize array for 12 months
        if (data && Array.isArray(data)) {
            data.forEach(item => {
                if (Math.floor(item.year) === year) { // Check if the year matches
                    const monthIndex = Math.floor(item.month) - 1; // Convert month to 0-11 index
                    monthlyTotals[monthIndex] += parseFloat(item.total || 0);
                }
            });
        }
        return monthlyTotals;
    };
    const aggregateBudget = (data, year) => {
        const monthlyTotals = Array(12).fill(0); // Initialize array for 12 months
        if (data && Array.isArray(data)) {
            data.forEach(item => {
                if (Math.floor(item.year) === year) { // Check if the year matches
                    const monthIndex = Math.floor(item.month) - 1; // Convert month to 0-11 index
                    monthlyTotals[monthIndex] += parseFloat(item.budgeted_amount || 0);
                }
            });
        }
        return monthlyTotals;
    };

    //filter the categories spends by month or year
    const filterExpenseTrends = (data, year, month, filterByYear) => {
        const filteredData = data.filter(item => {
            const matchesYear = Math.floor(item.year) === year;
            const matchesMonth = filterByYear || Math.floor(item.month) === month;
            return matchesYear && matchesMonth;
        });

        // Aggregate data by category
        const categoryTotals = {};
        filteredData.forEach(item => {
            if (!categoryTotals[item.category_name]) {
                categoryTotals[item.category_name] = 0;
            }
            categoryTotals[item.category_name] += parseFloat(item.total || 0);
        });

        return categoryTotals;
    };

    // Prepare data for the charts
    const incomeData = aggregateByMonth(report.income_trends, year);
    const expenseData = aggregateByMonth(report.expense_trends, year);
    const cashFlowData = incomeData.map((income, index) => income - expenseData[index]);
    const categoriesData = aggregateByMonth(report.expense_categories, year);

    // Budget vs. Actual comparison
    const budgetedData = aggregateBudget(report.budget_vs_actual, year);
    const actualData = expenseData;

    const barData = {
        labels: Array.from({ length: 12 }, (_, i) => monthNames[i]),
        datasets: [
            {
                label: 'Income',
                data: incomeData.length ? incomeData : Array(12).fill(0),
                backgroundColor: '#4caf50',
            },
            {
                label: 'Expenses',
                data: expenseData.length ? expenseData : Array(12).fill(0),
                backgroundColor: '#f44336',
            },
            {
                label: 'Cash Flow',
                data: cashFlowData.length ? cashFlowData : Array(12).fill(0),
                backgroundColor: '#2196f3',
            },
        ],
    };

    const budgetVsActualData = {
        labels: Array.from({ length: 12 }, (_, i) => monthNames[i]),
        datasets: [
            {
                label: 'Budgeted',
                data: budgetedData,
                backgroundColor: '#ffeb3b',
            },
            {
                label: 'Actual',
                data: actualData,
                backgroundColor: '#f44336',
            },
        ],
    };

    const spendingTrendsData = {
        labels: Array.from({ length: 12 }, (_, i) => monthNames[i]),
        datasets: []
    };

    const categoryMap = {};

    report.expense_trends.forEach(expense => {
        const monthIndex = expense.month - 1; // Convert month to 0-11 index

        if (!categoryMap[expense.category_name]) {
            categoryMap[expense.category_name] = Array(12).fill(0);
        }

        categoryMap[expense.category_name][monthIndex] = parseFloat(expense.total);
    });

    Object.keys(categoryMap).forEach(categoryName => {
        spendingTrendsData.datasets.push({
            label: categoryName,
            data: categoryMap[categoryName],
            fill: false,
            borderColor: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
            tension: 0.1,
        });
    });
    const getRandomColor = () => {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) {
            color += letters[Math.floor(Math.random() * 16)];
        }
        return color;
    };

    return (
        <div className="reports-container">
            <h1>Income and Expense Trend</h1>
            <div className="chart-container">
                <Bar data={barData} options={{ scales: { y: { beginAtZero: true } } }} />
            </div>

            {/* Cash flow Reports */}
            <h1>Monthly Cash Flow Report</h1>
            <div className="chart-container">
                <Bar data={{
                    labels: Array.from({ length: 12 }, (_, i) => monthNames[i]),
                    datasets: [
                        {
                            label: 'Cash Flow',
                            data: cashFlowData,
                            backgroundColor: cashFlowData.map(value => value < 0 ? 'red' : '#2196f3'),
                        },
                    ],
                }} options={{
                    scales: {
                        y:
                            { beginAtZero: true }
                    },
                    plugins: {
                        legend: {
                            display: false
                        }
                    }
                }} />
            </div>

            <h1>Spending Trends Report</h1>
            <div className="chart-container">
                <Line data={spendingTrendsData} options={{ scales: { y: { beginAtZero: true } } }} />
            </div>

            <h1>Budget vs. Actual Report</h1>
            <div className="chart-container">
                <Bar data={budgetVsActualData} options={{ scales: { y: { beginAtZero: true } } }} />
            </div>

            <div className="pie-chart-row">
                <div className="pie-chart-left">
                    <h3>Expense Categories </h3>
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
                    <Pie data={{
                        labels: Object.keys(filterExpenseTrends(report.expense_trends, year, month, filterByYear)),
                        datasets: [{
                            data: Object.values(filterExpenseTrends(report.expense_trends, year, month, filterByYear)),
                            backgroundColor: Object.keys(filterExpenseTrends(report.expense_trends, year, month, filterByYear)).map(() => getRandomColor()),
                            hoverOffset: 4,
                        }]
                    }}
                        options={{
                            plugins: {
                                legend: {
                                    position: 'left', // Position legend on the left
                                    align: 'left',  // Align the legend items vertically in the center
                                    labels: {
                                        boxWidth: 20, // Control the size of the legend box
                                    }
                                }
                            }
                        }} />
                </div>

            </div>

        </div>
    );
};

export default Reports;