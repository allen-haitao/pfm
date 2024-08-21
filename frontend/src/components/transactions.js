import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Import the api module
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash, faCamera, faImage, faCancel, faSave } from '@fortawesome/free-solid-svg-icons';
import './Transactions.css';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newTransaction, setNewTransaction] = useState({ category_id: '', types: 'expense', amount: '', notes: '', occu_date: '' });
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false); // State to manage form visibility
    const [showUploadForm, setShowUploadForm] = useState(false); // State to manage receipt upload form visibility
    const [image, setImage] = useState(null); // State to store the uploaded image
    const [extractedData, setExtractedData] = useState(null); // State to store extracted data from the receipt

    useEffect(() => {
        fetchTransactionsAndCategories();
    }, []);

    // Get transactions and categories
    const fetchTransactionsAndCategories = async () => {
        try {
            const [transactionsResponse, categoriesResponse] = await Promise.all([
                api.get('/transactions/'),
                api.get('/categories/')
            ]);

            const processedTransactions = transactionsResponse.data.map(transaction => ({
                ...transaction,
                category_id: transaction.category.id,
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

    const handleImageUpload = (e) => {
        setImage(e.target.files[0]);
    };

    const handleImageSubmit = async () => {
        if (!image) {
            setError('Please upload a receipt or invoice image.');
            return;
        }

        const formData = new FormData();
        formData.append('image', image);

        try {
            setLoading(true);
            const response = await api.post('/transactions/process_receipt/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setExtractedData(response.data);
            setLoading(false);
        } catch (err) {
            setError('Failed to process the image.');
            setLoading(false);
        }
    };

    const handleConfirmTransaction = async () => {
        try {
            await api.post('/confirm-transaction/', extractedData);
            alert('Transaction successfully saved!');
            fetchTransactionsAndCategories(); // Refresh the transaction list
            setShowUploadForm(false); // Hide the upload form after confirmation
        } catch (err) {
            setError('Failed to save the transaction.');
        }
    };

    const handleAddTransaction = async () => {
        try {
            await api.post('/transactions/', {
                ...newTransaction,
                amount: parseFloat(newTransaction.amount),
            });
            setNewTransaction({ category_id: '', types: '', amount: '', notes: '', occu_date: '' });
            setShowAddForm(false); // Hide the form after adding a transaction
            fetchTransactionsAndCategories(); // Refresh the list after adding a transaction
        } catch (err) {
            setError('Failed to add transaction');
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

            <button onClick={() => setShowAddForm(true)} title="Add transaction"><FontAwesomeIcon icon={faPlus} size='2x' /></button>
            <button onClick={() => setShowUploadForm(!showUploadForm)} title="Add transaction by scan receipt"><FontAwesomeIcon icon={faCamera} size='2x' /></button>

            {showAddForm && (
                <div className="add-transaction-form">
                    <h2>Add New Transaction <FontAwesomeIcon icon={faPlus} /></h2>
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
                        value={newTransaction.types}
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
                    <button onClick={handleAddTransaction}><FontAwesomeIcon icon={faSave} /></button>
                    <button onClick={() => setShowAddForm(false)}><FontAwesomeIcon icon={faCancel} /></button>
                </div>
            )}

            {showUploadForm && (
                <div className="upload-receipt-form">
                    <h2>Upload Receipt <FontAwesomeIcon icon={faCamera} /></h2>
                    <input type="file" accept="image/*" onChange={handleImageUpload} />
                    <button onClick={handleImageSubmit}><FontAwesomeIcon icon={faSave} /> Process Image</button>

                    {extractedData && (
                        <div className="extracted-data">
                            <h3>Extracted Transaction Data</h3>
                            {/* Display extracted items, categories, and amounts here */}
                            <button onClick={handleConfirmTransaction}><FontAwesomeIcon icon={faSave} /> Confirm Transaction</button>
                        </div>
                    )}
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
                            <td>{transaction.types}</td>
                            <td>${transaction.amount.toFixed(2)}</td>
                            <td>{transaction.notes}</td>
                            <td>
                                <button onClick={() => setEditingTransaction(transaction)}><FontAwesomeIcon icon={faEdit} /></button>
                                <button onClick={() => handleDeleteTransaction(transaction.id)}><FontAwesomeIcon icon={faTrash} /></button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Transactions;