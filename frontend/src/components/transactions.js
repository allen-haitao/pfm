import React from 'react';
import './Transactions.css';

const Transactions = () => {
    return (
        <div className="transactions">
            <h1>Transactions</h1>
            <button className="add-transaction">Add Transaction</button>
            <table>
                <thead>
                    <tr>
                        <th>Date</th>
                        <th>Category</th>
                        <th>Type</th>
                        <th>Amount</th>
                        <th>Notes</th>
                    </tr>
                </thead>
                <tbody>
                    {/* Render transaction rows here */}
                </tbody>
            </table>
        </div>
    );
};

export default Transactions;