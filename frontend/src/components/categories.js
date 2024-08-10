import React from 'react';
import './Categories.css';

const Categories = () => {
    return (
        <div className="categories">
            <h1>Categories</h1>
            <button className="add-category">Add Category</button>
            <ul>
                {/* Render category items here */}
            </ul>
        </div>
    );
};

export default Categories;