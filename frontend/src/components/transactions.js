import React, { useState, useEffect } from 'react';
import api from '../services/api';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { RingLoader } from 'react-spinners';
import { faPlus, faEdit, faTrash, faCamera, faSave, faCancel, faImage } from '@fortawesome/free-solid-svg-icons';
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
    const [taskId, setTaskId] = useState(''); // task_id
    const [taskStatus, setTaskStatus] = useState(''); // task status
    const [polling, setPolling] = useState(false); // check ststus

    // init data
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

    // upload image
    const handleImageUpload = (e) => {
        setImage(e.target.files[0]);
    };

    // submit task and begin check the task status
    const handleImageSubmit = async () => {
        if (!image) {
            setError('Please upload a receipt or invoice image.');
            return;
        }

        const formData = new FormData();
        formData.append('image', image);

        try {
            setLoading(true); // loading
            const response = await api.post('/transactions/process_receipt/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setTaskId(response.data.task_id); // task id
            setTaskStatus('submitted');
            setPolling(true); // check
        } catch (err) {
            setError('Failed to process the image.');
            setLoading(false);
        }
    };

    // check task status
    useEffect(() => {
        let pollingInterval;
        let pollingAttempts = 0;
        const maxPollingAttempts = 100;

        if (polling) {
            pollingInterval = setInterval(async () => {
                pollingAttempts += 1;
                try {
                    const response = await api.get(`/transactions/${taskId}/check_task_status/`);
                    setTaskStatus(response.data.status);
                    if (response.data.status === 'completed') {
                        setExtractedData(response.data.result);
                        clearInterval(pollingInterval);
                        setPolling(false);
                        setLoading(false);
                    } else if (pollingAttempts >= maxPollingAttempts) {
                        alert('Polling attempts exceeded.');
                        clearInterval(pollingInterval);
                        setPolling(false);
                        setLoading(false);
                    }
                } catch (err) {
                    console.error('Failed to check task status.', err);
                    clearInterval(pollingInterval);
                    setPolling(false);
                    setLoading(false);
                }
            }, 3000); // check task status each 3 seconds
        }

        return () => clearInterval(pollingInterval); // clear timer
    }, [polling, taskId]);

    // modify price
    const handlePriceChange = (index, newPrice) => {
        const updatedData = { ...extractedData };
        updatedData.product[index].product_total_price = newPrice;
        recalculateCategorySubtotals(updatedData);
        setExtractedData(updatedData);
    };

    // modify category
    const handleCategoryChange = (index, newCategory) => {
        const updatedData = { ...extractedData };
        updatedData.product[index].category = newCategory;
        recalculateCategorySubtotals(updatedData);
        setExtractedData(updatedData);
    };

    // update subtotal after modify price
    const recalculateCategorySubtotals = (data) => {
        const newCategorySubtotals = data.product.reduce((acc, item) => {
            const category = item.category;
            const amount = item.product_total_price;
            acc[category] = (acc[category] || 0) + amount;
            return acc;
        }, {});

        data.total_bill.category_subtotals = newCategorySubtotals;

        // update total
        const total = Object.values(newCategorySubtotals).reduce((acc, subtotal) => acc + subtotal, 0);
        data.total_bill.total = total;
        data.total_bill.final_total = total + data.total_bill.tax_amount;
    };

    // confirm transactions
    const handleConfirmTransaction = async () => {
        try {
            const finalSummaryData = Object.entries(extractedData.total_bill.category_subtotals).map(([category, amount], index) => {
                const existingData = summaryData[index] || {};
                return {
                    category,
                    amount,
                    occu_date: existingData.occu_date || new Date().toISOString().split('T')[0],
                    notes: existingData.notes || 'Add by receipt',
                };
            });

            for (const row of finalSummaryData) {
                const category = categories.find(cat => cat.name === row.category);
                if (category) {
                    await autoAddTransaction({
                        category_id: category.id,
                        types: 'expense',
                        amount: parseFloat(row.amount).toFixed(2),
                        notes: row.notes,
                        occu_date: row.occu_date,
                    });
                }
            }

            alert('Transactions successfully saved!');
            fetchTransactionsAndCategories();
            setShowUploadForm(false);
        } catch (err) {
            setError('Failed to save the transactions.');
        }
    };

    const handleSummaryChange = (index, field, value) => {
        const updatedSummaryData = [...summaryData];
        updatedSummaryData[index] = {
            ...updatedSummaryData[index],
            [field]: value,
        };
        setSummaryData(updatedSummaryData);
    };
    // add transaction
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
            fetchTransactionsAndCategories();
        } catch (err) {
            setError('Failed to add transaction');
        }
    };

    // 删除交易
    const handleDeleteTransaction = async (id) => {
        try {
            await api.delete(`/transactions/${id}/`);
            fetchTransactionsAndCategories();
        } catch (err) {
            setError('Failed to delete transaction');
        }
    };

    // add transaction manually
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

    // loading
    if (loading) {
        return (
            <div className="loading-container">
                <RingLoader size={50} color={"#123abc"} loading={loading} />
            </div>
        );
    }

    // 错误状态
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
                <FontAwesomeIcon icon={faImage} size='2x' />
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
                    <h2>Upload Receipt <FontAwesomeIcon icon={faImage} /></h2>
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
                                    {extractedData.product.map((item, index) => (
                                        <tr key={index}>
                                            <td>{item.product_description}</td>
                                            <td>
                                                <input
                                                    type="number"
                                                    value={item.product_total_price.toFixed(2)}
                                                    onChange={(e) => handlePriceChange(index, parseFloat(e.target.value))}
                                                />
                                            </td>
                                            <td>
                                                <select
                                                    value={item.category}
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
                                    ))}
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
                                        {Object.entries(extractedData.total_bill.category_subtotals).map(([category, amount], index) => (
                                            <tr key={index}>
                                                <td>{category}</td>
                                                <td>${amount.toFixed(2)}</td>
                                                <td>
                                                    <input
                                                        type="date"
                                                        defaultValue={summaryData[index]?.occu_date || new Date().toISOString().split('T')[0]}
                                                        onChange={(e) => handleSummaryChange(index, 'occu_date', e.target.value)}
                                                    />
                                                </td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        defaultValue={summaryData[index]?.notes || "Add by receipt"}
                                                        onChange={(e) => handleSummaryChange(index, 'notes', e.target.value)}
                                                    />
                                                </td>
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