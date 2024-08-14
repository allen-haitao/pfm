import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Import the api module
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faSave, faTimes } from '@fortawesome/free-solid-svg-icons';
import './Budgets.css';
//import { format } from 'date-fns';

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newBudget, setNewBudget] = useState({ category_id: '', limits: '', spend: 0, period_type: 'monthly', start_date: '' });
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
                category_id: budget.category.id,
                limits: parseFloat(budget.limits),
                spend: parseFloat(budget.spent),
                period_type: budget.period_type,
                start_date: new Date(budget.start_date),
                end_date: calculateEndDate(budget.start_date, budget.period_type),
            }));

            setBudgets(processedBudgets);
            setCategories(categoriesResponse.data);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const calculateEndDate = (startDate, periodType) => {
        const date = new Date(startDate);
        switch (periodType) {
            case 'monthly':
                date.setMonth(date.getMonth() + 1);
                break;
            case 'quarterly':
                date.setMonth(date.getMonth() + 3);
                break;
            case 'annual':
                date.setFullYear(date.getFullYear() + 1);
                break;
            default:
                break;
        }
        return date;
    };

    const calculateRemainingPercentage = (limits, spend) => {
        return ((limits - spend) / limits) * 100;
    };

    const getRemainingColor = (remainingPercentage) => {
        if (remainingPercentage <= 10) {
            return 'red';
        } else if (remainingPercentage <= 20) {
            return 'brown';
        } else {
            return 'green';
        }
    };

    const handleAddBudget = async () => {
        try {
            await api.post('/budgets/', {
                ...newBudget,
                limits: parseFloat(newBudget.limits),
                start_date: newBudget.start_date,
            });
            setNewBudget({ category_id: '', limits: '', spend: 0, period_type: 'monthly', start_date: '' });
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
                <select
                    value={newBudget.period_type}
                    onChange={(e) => setNewBudget({ ...newBudget, period_type: e.target.value })}
                >
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annual">Annual</option>
                </select>
                <label htmlFor="startDate" style={{ marginRight: '10px', fontWeight: 'bold' }}>Start Date:</label>
                <input
                    type="date"
                    placeholder="Start Date"
                    value={newBudget.start_date}
                    onChange={(e) => setNewBudget({ ...newBudget, start_date: e.target.value })}
                />
                <input
                    type="number"
                    placeholder="Budget Limit"
                    value={newBudget.limits}
                    onChange={(e) => setNewBudget({ ...newBudget, limits: e.target.value })}
                />
                <button onClick={handleAddBudget}><FontAwesomeIcon icon={faPlus} size='2x' /></button>
            </div>

            {
                editingBudget && (
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
                        <select
                            value={editingBudget.period_type}
                            onChange={(e) => setEditingBudget({ ...editingBudget, period_type: e.target.value })}
                        >
                            <option value="monthly">Monthly</option>
                            <option value="quarterly">Quarterly</option>
                            <option value="annual">Annual</option>
                        </select>
                        <input
                            type="date"
                            value={editingBudget.start_date}
                            onChange={(e) => setEditingBudget({ ...editingBudget, start_date: e.target.value })}
                        />
                        <button onClick={handleEditBudget}><FontAwesomeIcon icon={faSave} /> Save Changes</button>
                        <button onClick={() => setEditingBudget(null)}><FontAwesomeIcon icon={faTimes} /> Cancel</button>
                    </div>
                )
            }

            <table className="budgets-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Limit</th>
                        <th>Spent</th>
                        <th>Period</th>
                        <th>Remaining</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {budgets.map(budget => {
                        const remainingPercentage = calculateRemainingPercentage(budget.limits, budget.spend);
                        const remainingColor = getRemainingColor(remainingPercentage);
                        return (
                            <tr key={budget.id}>
                                <td>{categories.find(cat => cat.id === budget.category_id)?.name}</td>
                                <td>${budget.limits.toFixed(2)}</td>
                                <td>${budget.spend.toFixed(2)}</td>
                                <td>{new Date(budget.start_date).toISOString().split('T')[0]} ~ {new Date(budget.end_date).toISOString().split('T')[0]}</td>
                                <td style={{ color: remainingColor }}>{remainingPercentage.toFixed(2)}%</td>
                                <td>
                                    <button onClick={() => setEditingBudget(budget)}><FontAwesomeIcon icon={faEdit} /></button>
                                    <button onClick={() => handleDeleteBudget(budget.id)}><FontAwesomeIcon icon={faTrash} /></button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div >
    );
};

export default Budgets;