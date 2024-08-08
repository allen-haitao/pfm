import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);

    useEffect(() => {
        const fetchBudgets = async () => {
            try {
                const response = await api.get('/budgets/');
                setBudgets(response.data);
            } catch (error) {
                console.error('Error fetching budgets:', error);
            }
        };

        fetchBudgets();
    }, []);

    return (
        <div>
            <h2>Budgets</h2>
            <ul>
                {budgets.map(budget => (
                    <li key={budget.id}>
                        {budget.category.name} - Limit: {budget.limit} - Spent: {budget.spent}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Budgets;