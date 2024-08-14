import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Import the api module
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faCamera, faImage, faCancel, faSave } from '@fortawesome/free-solid-svg-icons';
import './Budgets.css';

const Budgets = () => {
    const [budgets, setBudgets] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newBudget, setNewBudget] = useState({ category_id: '', limits: '', spend: 0 });
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
            setNewBudget({ category_id: '', limits: '', spend: 0 });
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
                <input
                    type="number"
                    placeholder="Budget Limit"
                    value={newBudget.limits}
                    onChange={(e) => setNewBudget({ ...newBudget, limits: e.target.value })}
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
                    <button onClick={handleEditBudget}>Save Changes</button>
                    <button onClick={() => setEditingBudget(null)}>Cancel</button>
                </div>
            )}

            <table className="budgets-table">
                <thead>
                    <tr>
                        <th>Category</th>
                        <th>Limit</th>
                        <th>Spent</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {budgets.map(budget => (
                        <tr key={budget.id}>
                            <td>{categories.find(cat => cat.id === budget.category_id)?.name}</td>
                            <td>${budget.limits.toFixed(2)}</td>
                            <td>${budget.spend.toFixed(2)}</td>
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