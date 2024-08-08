import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Reports = () => {
    const [reportData, setReportData] = useState({
        income_trends: [],
        expense_trends: [],
        expense_categories: []
    });

    useEffect(() => {
        const fetchReportData = async () => {
            try {
                const response = await api.get('/reports/');
                setReportData(response.data);
            } catch (error) {
                console.error('Error fetching report data:', error);
            }
        };

        fetchReportData();
    }, []);

    return (
        <div>
            <h2>Reports</h2>
            <div>
                <h3>Income Trends</h3>
                <ul>
                    {reportData.income_trends.map((income, index) => (
                        <li key={index}>
                            {income.date__year}-{income.date__month}: {income.total}
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h3>Expense Trends</h3>
                <ul>
                    {reportData.expense_trends.map((expense, index) => (
                        <li key={index}>
                            {expense.date__year}-{expense.date__month}: {expense.total}
                        </li>
                    ))}
                </ul>
            </div>
            <div>
                <h3>Expense Categories</h3>
                <ul>
                    {reportData.expense_categories.map((category, index) => (
                        <li key={index}>
                            {category.category__name}: {category.total}
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
};

export default Reports;