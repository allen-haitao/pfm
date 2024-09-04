import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RingLoader } from 'react-spinners';
import { faPlus, faEdit, faTrash, faCamera, faSave, faCancel } from '@fortawesome/free-solid-svg-icons';
import './Transactions.css';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newTransaction, setNewTransaction] = useState({ category_id: '', types: 'expense', amount: '', notes: '', occu_date: '' });
    const [editingTransaction, setEditingTransaction] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [showUploadForm, setShowUploadForm] = useState(false);
    const [image, setImage] = useState(null);
    const [extractedData, setExtractedData] = useState(null);
    const [summaryData, setSummaryData] = useState([]);

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
    const handlePriceChange = (index, newPrice) => {
        const updatedData = { ...extractedData };
        updatedData.data[2][1][index][3][1] = newPrice; // Update the price in extractedData

        // Recalculate the category subtotals
        recalculateCategorySubtotals(updatedData);
        setExtractedData(updatedData);
    };
    const handleCategoryChange = (index, newCategory) => {
        const updatedData = { ...extractedData };
        updatedData.data[2][1][index][4][1] = newCategory; // Update the category in extractedData

        // Recalculate the category subtotals
        recalculateCategorySubtotals(updatedData);
        setExtractedData(updatedData);
    };

    const recalculateCategorySubtotals = (data) => {
        const newCategorySubtotals = data.data[2][1].reduce((acc, item) => {
            const category = item[4][1];
            const amount = item[3][1];
            acc[category] = (acc[category] || 0) + amount;
            return acc;
        }, {});

        data.data[3][1][5][1] = newCategorySubtotals;

        // Update the total and final total as well
        const total = Object.values(newCategorySubtotals).reduce((acc, subtotal) => acc + subtotal, 0);
        data.data[3][1][0][1] = total;
        data.data[3][1][4][1] = total + data.data[3][1][2][1]; // Assuming final total = total + tax
    };
    const handleSummaryChange = (index, field, value) => {
        const updatedSummaryData = [...summaryData];
        updatedSummaryData[index] = {
            ...updatedSummaryData[index],
            [field]: value,
        };
        setSummaryData(updatedSummaryData);
    };
    const autoAddTransaction = async ({ category_id, types, amount, notes, occu_date }) => {
        try {
            await api.post('/transactions/', {
                category_id,
                types,
                amount,
                notes,
                occu_date,
            });
            setNewTransaction({ category_id: '', types: 'expense', amount: '', notes: '', occu_date: '' });
            setShowAddForm(false);
            fetchTransactionsAndCategories(); // Refresh the list after adding a transaction
        } catch (err) {
            setError('Failed to add transaction');
        }
    };

    const handleConfirmTransaction = async () => {
        try {
            const finalSummaryData = Object.entries(extractedData.data[3][1][5][1]).map(([category, amount], index) => {
                const existingData = summaryData[index] || {};
                return {
                    category,
                    amount,
                    occu_date: existingData.occu_date || new Date().toISOString().split('T')[0],
                    notes: existingData.notes || 'Add by receipt',
                };
            });

            finalSummaryData.forEach(async (row, index) => {
                const category = categories.find(cat => cat.name === row.category);
                if (category) {
                    await autoAddTransaction({
                        category_id: category.id,
                        types: 'expense', // Assuming all are expenses; adjust if needed
                        amount: parseFloat(row.amount).toFixed(2),
                        notes: row.notes,
                        occu_date: row.occu_date,
                    });
                }
            });

            alert('Transactions successfully saved!');
            fetchTransactionsAndCategories();
            setShowUploadForm(false);
        } catch (err) {
            setError('Failed to save the transactions.');
        }
    };

    const handleAddTransaction = async () => {
        try {
            await api.post('/transactions/', {
                ...newTransaction,
                amount: parseFloat(newTransaction.amount),
            });
            setNewTransaction({ category_id: '', types: '', amount: '', notes: '', occu_date: '' });
            setShowAddForm(false);
            fetchTransactionsAndCategories();
        } catch (err) {
            setError('Failed to add transaction');
        }
    };

    const handleDeleteTransaction = async (id) => {
        try {
            await api.delete(`/transactions/${id}/`);
            fetchTransactionsAndCategories();
        } catch (err) {
            setError('Failed to delete transaction');
        }
    };

    if (loading) {
        return (
            <div className="loading-container">
                <RingLoader size={50} color={"#123abc"} loading={loading} />
            </div>
        );
    }

    if (error) {
        return <p className="error">{error}</p>;
    }

    return (
        <div className="transactions-container">
            <h1>Transactions</h1>

            <button onClick={() => setShowAddForm(true)} title="Add transaction">
                <FontAwesomeIcon icon={faPlus} size='2x' />
            </button>
            <button onClick={() => setShowUploadForm(!showUploadForm)} title="Add transaction by scan receipt">
                <FontAwesomeIcon icon={faCamera} size='2x' />
            </button>

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

                            <table className="extracted-data-table">
                                <thead>
                                    <tr>
                                        <th>Description</th>
                                        <th>Price</th>
                                        <th>Category</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {extractedData.data[2][1].map((item, index) => {
                                        const product = item.reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});
                                        return (
                                            <tr key={index}>
                                                <td>{product.product_description}</td>
                                                <td>
                                                    <input
                                                        type="number"
                                                        value={product.product_total_price.toFixed(2)}
                                                        onChange={(e) => handlePriceChange(index, parseFloat(e.target.value))}
                                                    />
                                                </td>
                                                <td>
                                                    <select
                                                        value={product.category}
                                                        onChange={(e) => handleCategoryChange(index, e.target.value)}
                                                    >
                                                        {categories.map((category) => (
                                                            <option key={category.id} value={category.name}>
                                                                {category.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>

                            <div className="transaction-summary">
                                <h3>Transaction Summary</h3>
                                <table>
                                    <thead>
                                        <tr>
                                            <th>Category</th>
                                            <th>Amount</th>
                                            <th>Date</th>
                                            <th>Notes</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {Object.entries(extractedData.data[3][1][5][1]).map(([category, amount], index) => (
                                            <tr key={index}>
                                                <td>{category}</td>
                                                <td>${amount.toFixed(2)}</td>
                                                <td> <input
                                                    type="date"
                                                    defaultValue={summaryData[index]?.occu_date || new Date().toISOString().split('T')[0]}
                                                    onChange={(e) => handleSummaryChange(index, 'occu_date', e.target.value)}
                                                /></td>
                                                <td><input
                                                    type="string"
                                                    defaultValue={summaryData[index]?.notes || "Add by receipt"}
                                                    onChange={(e) => handleSummaryChange(index, 'notes', e.target.value)}
                                                /></td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

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