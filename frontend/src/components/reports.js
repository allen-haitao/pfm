import React from 'react';
import './Reports.css';

const Reports = () => {
    return (
        <div className="reports">
            <h1>Reports</h1>
            <div className="reports-charts">
                {/* Render charts or reports here */}
            </div>
            <button className="download-report">Download Report</button>
        </div>
    );
};

export default Reports;