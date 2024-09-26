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
    const [taskId, setTaskId] = useState(''); // 任务ID
    const [taskStatus, setTaskStatus] = useState(''); // 任务状态
    const [polling, setPolling] = useState(false); // 控制是否轮询

    // 初始化数据
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

    // 处理图片上传
    const handleImageUpload = (e) => {
        setImage(e.target.files[0]);
    };

    // 提交图片并启动轮询
    const handleImageSubmit = async () => {
        if (!image) {
            setError('Please upload a receipt or invoice image.');
            return;
        }

        const formData = new FormData();
        formData.append('image', image);

        try {
            setLoading(true); // 启动loading状态
            const response = await api.post('/transactions/process_receipt/', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            setTaskId(response.data.task_id); // 假设后端返回任务ID
            setTaskStatus('submitted');
            setPolling(true); // 开始轮询
        } catch (err) {
            setError('Failed to process the image.');
            setLoading(false); // 失败时取消loading状态
        }
    };

    // 自动轮询任务状态
    useEffect(() => {
        let pollingInterval;
        let pollingAttempts = 0;
        const maxPollingAttempts = 30; // 最大轮询次数

        if (polling) {
            pollingInterval = setInterval(async () => {
                pollingAttempts += 1;
                try {
                    const response = await api.get(`/transactions/${taskId}/check_task_status/`);
                    setTaskStatus(response.data.status);
                    if (response.data.status === 'completed') {
                        setExtractedData(response.data.result);
                        clearInterval(pollingInterval); // 任务完成，停止轮询
                        setPolling(false);
                        setLoading(false); // 任务完成时取消loading状态
                    } else if (pollingAttempts >= maxPollingAttempts) {
                        alert('Polling attempts exceeded.');
                        clearInterval(pollingInterval); // 达到最大轮询次数，停止轮询
                        setPolling(false);
                        setLoading(false); // 取消loading状态
                    }
                } catch (err) {
                    console.error('Failed to check task status.', err);
                    clearInterval(pollingInterval); // 请求失败，停止轮询
                    setPolling(false);
                    setLoading(false); // 取消loading状态
                }
            }, 10000); // 每隔 10 秒轮询一次任务状态
        }

        return () => clearInterval(pollingInterval); // 清理计时器
    }, [polling, taskId]);

    // 处理价格修改
    const handlePriceChange = (index, newPrice) => {
        const updatedData = { ...extractedData };
        updatedData.data[2][1][index][3][1] = newPrice; // Update the price in extractedData
        recalculateCategorySubtotals(updatedData);
        setExtractedData(updatedData);
    };

    // 处理类别修改
    const handleCategoryChange = (index, newCategory) => {
        const updatedData = { ...extractedData };
        updatedData.data[2][1][index][4][1] = newCategory; // Update the category in extractedData
        recalculateCategorySubtotals(updatedData);
        setExtractedData(updatedData);
    };

    // 重新计算类别小计
    const recalculateCategorySubtotals = (data) => {
        const newCategorySubtotals = data.data[2][1].reduce((acc, item) => {
            const category = item[4][1];
            const amount = item[3][1];
            acc[category] = (acc[category] || 0) + amount;
            return acc;
        }, {});

        data.data[3][1][5][1] = newCategorySubtotals;

        // 更新总计和最终总计
        const total = Object.values(newCategorySubtotals).reduce((acc, subtotal) => acc + subtotal, 0);
        data.data[3][1][0][1] = total;
        data.data[3][1][4][1] = total + data.data[3][1][2][1]; // Assuming final total = total + tax
    };

    // 确认交易
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
                        types: 'expense', // 假设所有交易都是支出
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

    const handleSummaryChange = (index, field, value) => {
        const updatedSummaryData = [...summaryData];
        updatedSummaryData[index] = {
            ...updatedSummaryData[index],
            [field]: value,
        };
        setSummaryData(updatedSummaryData);
    };
    // 自动添加交易
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
            fetchTransactionsAndCategories(); // 添加交易后刷新列表
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

    // 添加交易
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

    // 加载状态
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