/**
 * @file budgets.js
 * @description Budget module 
 * @author Haitao Wang
 * @date 2024-08-25
 */

import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Import the api module
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import './Budgets.css';

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newBudget, setNewBudget] = useState({
        category_id: '',
        limits: '',
        period_type: 'monthly',
        month: '',
        year: new Date().getFullYear(),  // Default to the current year
    });
    const [editingBudget, setEditingBudget] = useState(null);

    useEffect(() => {
        fetchBudgetsAndCategories();
    }, []);

    const fetchBudgetsAndCategories = async () => {
        try {
            const [budgetsResponse, categoriesResponse] = await Promise.all([
                api.get('/budgets/'),
                api.get('/categories/')
            ]);

            const processedBudgets = budgetsResponse.data.map(budget => ({
                ...budget,
                limits: parseFloat(budget.limits),
                spent: parseFloat(budget.spent),
                remain: parseFloat(parseFloat(budget.limits) - parseFloat(budget.spent))
            }));

            setBudgets(processedBudgets);
            setCategories(categoriesResponse.data);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddBudget = async () => {
        try {
            await api.post('/budgets/', {
                ...newBudget,
                limits: parseFloat(newBudget.limits),
            });
            setNewBudget({
                category_id: '',
                limits: '',
                period_type: 'monthly',
                month: '',
                year: new Date().getFullYear(),
            });
            fetchBudgetsAndCategories(); // Refresh the table after adding a budget
        } catch (err) {
            setError('Failed to add budget');
        }
    };

    const handleEditBudget = async () => {
        try {
            await api.put(`/budgets/${editingBudget.id}/`, {
                ...editingBudget,
                limits: parseFloat(editingBudget.limits),
            });
            setEditingBudget(null);
            fetchBudgetsAndCategories(); // Refresh the table after editing a budget
        } catch (err) {
            setError('Failed to edit budget');
        }
    };

    const handleDeleteBudget = async (id) => {
        try {
            await api.delete(`/budgets/${id}/`);
            fetchBudgetsAndCategories(); // Refresh the table after deleting a budget
        } catch (err) {
            setError('Failed to delete budget');
        }
    };

    const renderDateFields = () => {
        if (newBudget.period_type === 'monthly') {
            return (
                <div>
                    <label htmlFor="month">Month:</label>
                    <select
                        id="month"
                        value={newBudget.month}
                        onChange={(e) => setNewBudget({ ...newBudget, month: e.target.value })}
                    >
                        <option value="">Select Month</option>
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                                {new Date(0, i).toLocaleString('default', { month: 'long' })}
                            </option>
                        ))}
                    </select>
                </div>
            );
        }
        return null;
    };

    const getRowStyle = (remain, limit) => {
        const percentRemaining = (remain / limit) * 100;
        if (remain < 0) return { backgroundColor: 'red', color: 'white' };
        if (percentRemaining < 10) return { backgroundColor: 'yellow', color: 'black' };
        return {};
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p className="error">{error}</p>;
    }

    return (
        <div className="budgets-container">
            <h1>Budgets</h1>

            <div className="add-budget-form">
                <h2>Add New Budget</h2>
                <select
                    value={newBudget.category_id}
                    onChange={(e) => setNewBudget({ ...newBudget, category_id: e.target.value })}
                >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
                <input
                    type="number"
                    placeholder="Budget Limit"
                    value={newBudget.limits}
                    onChange={(e) => setNewBudget({ ...newBudget, limits: e.target.value })}
                />

                {renderDateFields()}
                <label htmlFor="year">Year:</label>
                <input
                    type="number"
                    id="year"
                    placeholder="Year"
                    value={newBudget.year}
                    onChange={(e) => setNewBudget({ ...newBudget, year: e.target.value })}
                />
                <button onClick={handleAddBudget}><FontAwesomeIcon icon={faPlus} size='2x' /></button>
            </div>

            {editingBudget && (
                <div className="edit-budget-form">
                    <h2>Edit Budget</h2>
                    <select
                        value={editingBudget.category_id}
                        onChange={(e) => setEditingBudget({ ...editingBudget, category_id: e.target.value })}
                    >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                    <input
                        type="number"
                        value={editingBudget.limits}
                        onChange={(e) => setEditingBudget({ ...editingBudget, limits: e.target.value })}
                    />

                    {renderDateFields()}
                    <label htmlFor="year">Year:</label>
                    <input
                        type="number"
                        id="year"
                        value={editingBudget.year}
                        onChange={(e) => setEditingBudget({ ...editingBudget, year: e.target.value })}
                    />
                    <button onClick={handleEditBudget}>Save Changes</button>
                    <button onClick={() => setEditingBudget(null)}>Cancel</button>
                </div>
            )}

            <table className="budgets-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Period</th>
                        <th>Month/Year</th>
                        <th>Limit</th>
                        <th>Spent</th>
                        <th>Remain</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {budgets.map(budget => (
                        <tr key={budget.id} style={getRowStyle(budget.remain, budget.limits)}>
                            <td>{budget.category.name}</td>
                            <td>{budget.period_type.charAt(0).toUpperCase() + budget.period_type.slice(1)}</td>
                            <td>
                                {budget.period_type === 'monthly'
                                    ? `${new Date(budget.year, budget.month - 1).toLocaleString('default', { month: 'long' })} ${budget.year}`
                                    : budget.year}
                            </td>
                            <td>${budget.limits.toFixed(2)}</td>
                            <td>${budget.spent.toFixed(2)}</td>
                            <td>${budget.remain.toFixed(2)}</td>
                            <td>
                                <button onClick={() => setEditingBudget(budget)}><FontAwesomeIcon icon={faEdit} /></button>
                                <button onClick={() => handleDeleteBudget(budget.id)}><FontAwesomeIcon icon={faTrash} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Budgets;