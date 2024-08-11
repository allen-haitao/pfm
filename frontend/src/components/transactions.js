import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Import the api module
import './Transactions.css';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newTransaction, setNewTransaction] = useState({ category_id: '', types: 'expense', amount: '', notes: '', occu_date: '' });
    const [editingTransaction, setEditingTransaction] = useState(null);

    useEffect(() => {
        fetchTransactionsAndCategories();
    }, []);

    const fetchTransactionsAndCategories = async () => {
        try {
            const [transactionsResponse, categoriesResponse] = await Promise.all([
                api.get('/transactions/'),
                api.get('/categories/')
            ]);

            const processedTransactions = transactionsResponse.data.map(transaction => ({
                ...transaction,
                amount: parseFloat(transaction.amount),
            }));

            setTransactions(processedTransactions);
            setCategories(categoriesResponse.data);
        } catch (err) {
            setError('Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    const handleAddTransaction = async () => {
        try {
            await api.post('/transactions/', {
                ...newTransaction,
                amount: parseFloat(newTransaction.amount),
            });
            setNewTransaction({ category_id: '', types: '', amount: '', notes: '', occu_date: '' });
            fetchTransactionsAndCategories(); // Refresh the list after adding a transaction
        } catch (err) {
            setError('Failed to add transaction');
        }
    };

    const handleEditTransaction = async () => {
        try {
            await api.put(`/transactions/${editingTransaction.id}/`, {
                ...editingTransaction,
                amount: parseFloat(editingTransaction.amount),
            });
            setEditingTransaction(null);
            fetchTransactionsAndCategories(); // Refresh the list after editing a transaction
        } catch (err) {
            setError('Failed to edit transaction');
        }
    };

    const handleDeleteTransaction = async (id) => {
        try {
            await api.delete(`/transactions/${id}/`);
            fetchTransactionsAndCategories(); // Refresh the list after deleting a transaction
        } catch (err) {
            setError('Failed to delete transaction');
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p className="error">{error}</p>;
    }

    return (
        <div className="transactions-container">
            <h1>Transactions</h1>

            <div className="add-transaction-form">
                <h2>Add New Transaction</h2>
                <select
                    value={newTransaction.category_id}
                    onChange={(e) => setNewTransaction({ ...newTransaction, category_id: e.target.value })}
                >
                    <option value="">Select Category</option>
                    {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                            {category.name}
                        </option>
                    ))}
                </select>
                <select
                    value={newTransaction.type}
                    onChange={(e) => setNewTransaction({ ...newTransaction, types: e.target.value })}
                >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                </select>
                <input
                    type="date"
                    placeholder="Date"
                    value={newTransaction.occu_date}
                    onChange={(e) => setNewTransaction({ ...newTransaction, occu_date: e.target.value })}
                />
                <input
                    type="number"
                    placeholder="Amount"
                    value={newTransaction.amount}
                    onChange={(e) => setNewTransaction({ ...newTransaction, amount: e.target.value })}
                />
                <input
                    type="text"
                    placeholder="Notes"
                    value={newTransaction.notes}
                    onChange={(e) => setNewTransaction({ ...newTransaction, notes: e.target.value })}
                />
                <button onClick={handleAddTransaction}>Add Transaction</button>
            </div>

            {editingTransaction && (
                <div className="edit-transaction-form">
                    <h2>Edit Transaction</h2>
                    <select
                        value={editingTransaction.category_id}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, category_id: e.target.value })}
                    >
                        <option value="">Select Category</option>
                        {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                                {category.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={editingTransaction.type}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, type: e.target.value })}
                    >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>
                    <input
                        type="date"
                        value={editingTransaction.occu_date}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, occu_date: e.target.value })}
                    />
                    <input
                        type="number"
                        value={editingTransaction.amount}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, amount: e.target.value })}
                    />
                    <input
                        type="text"
                        value={editingTransaction.notes}
                        onChange={(e) => setEditingTransaction({ ...editingTransaction, notes: e.target.value })}
                    />
                    <button onClick={handleEditTransaction}>Save Changes</button>
                    <button onClick={() => setEditingTransaction(null)}>Cancel</button>
                </div>
            )}

            <table className="transactions-table">
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Notes</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {transactions.map(transaction => (
                        <tr key={transaction.id}>
                            <td>{new Date(transaction.occu_date).toLocaleDateString()}</td>
                            <td>{categories.find(cat => cat.id === transaction.category_id)?.name}</td>
                            <td>{transaction.type}</td>
                            <td>${transaction.amount.toFixed(2)}</td>
                            <td>{transaction.notes}</td>
                            <td>
                                <button onClick={() => setEditingTransaction(transaction)}>Edit</button>
                                <button onClick={() => handleDeleteTransaction(transaction.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Transactions;