import React, { useEffect, useState } from 'react';
import api from '../services/api';

const Transactions = () => {
    const [transactions, setTransactions] = useState([]);

    useEffect(() => {
        const fetchTransactions = async () => {
            try {
                const response = await api.get('/transactions/');
                setTransactions(response.data);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            }
        };

        fetchTransactions();
    }, []);

    return (
        <div>
            <h2>Transactions</h2>
            <ul>
                {transactions.map(transaction => (
                    <li key={transaction.id}>
                        {transaction.date} - {transaction.amount} ({transaction.type}) - {transaction.category.name}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Transactions;