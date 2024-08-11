import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Import the api module
import './Categories.css';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const response = await api.get('/categories/');
                setCategories(response.data);
            } catch (err) {
                setError('Failed to fetch categories');
            } finally {
                setLoading(false);
            }
        };

        fetchCategories();
    }, []);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p className="error">{error}</p>;
    }

    return (
        <div className="categories-container">
            <h1>Categories</h1>
            <ul className="category-list">
                {categories.map((category) => (
                    <li key={category.id} className="category-item">
                        <strong>{category.name}</strong> - {category.category_type}
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default Categories;