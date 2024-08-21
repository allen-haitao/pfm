import React, { useState, useEffect } from 'react';
import api from '../services/api'; // Import the api module
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import './Categories.css';

const Categories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [newCategory, setNewCategory] = useState({ name: '', category_type: 'expense' });
    const [editingCategory, setEditingCategory] = useState(null);

    useEffect(() => {
        fetchCategories();
    }, []);

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

    const handleAddCategory = async () => {
        try {
            await api.post('/categories/', {
                ...newCategory,
            });
            setNewCategory({ name: '', category_type: 'expense' });
            fetchCategories(); // Refresh the list after adding a category
        } catch (err) {
            setError('Failed to add category');
        }
    };

    const handleEditCategory = async () => {
        try {
            await api.put(`/categories/${editingCategory.id}/`, {
                ...editingCategory,
            });
            setEditingCategory(null);
            fetchCategories(); // Refresh the list after editing a category
        } catch (err) {
            setError('Failed to edit category');
        }
    };

    const handleDeleteCategory = async (id) => {
        try {
            await api.delete(`/categories/${id}/`);
            fetchCategories(); // Refresh the list after deleting a category
        } catch (err) {
            setError('Failed to delete category');
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (error) {
        return <p className="error">{error}</p>;
    }

    return (
        <div className="categories-container">
            <h1>Categories</h1>

            <div className="add-category-form">
                <h2>Add New Category <FontAwesomeIcon icon={faPlus} /></h2>
                <input
                    type="text"
                    placeholder="Category Name"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                />
                <select
                    value={newCategory.category_type}
                    onChange={(e) => setNewCategory({ ...newCategory, category_type: e.target.value })}
                >
                    <option value="expense">Expense</option>
                    <option value="income">Income</option>
                </select>
                <button onClick={handleAddCategory}><FontAwesomeIcon icon={faPlus} size='2x' /></button>
            </div>

            {editingCategory && (
                <div className="edit-category-form">
                    <h2>Edit Category <FontAwesomeIcon icon={faEdit} /></h2>
                    <input
                        type="text"
                        value={editingCategory.name}
                        onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                    />
                    <select
                        value={editingCategory.category_type}
                        onChange={(e) => setEditingCategory({ ...editingCategory, category_type: e.target.value })}
                    >
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                    </select>
                    <button onClick={handleEditCategory}>Save Changes <FontAwesomeIcon icon={faEdit} /></button>
                    <button onClick={() => setEditingCategory(null)}>Cancel</button>
                </div>
            )}

            <table className="categories-table">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Type</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(category => (
                        <tr key={category.id}>
                            <td>{category.name}</td>
                            <td>{category.category_type}</td>
                            <td>
                                {category.user_id === null ? (
                                    <span>Default Category</span>
                                ) : (
                                    <>
                                        <button onClick={() => setEditingCategory(category)}><FontAwesomeIcon icon={faEdit} /></button>
                                        <button onClick={() => handleDeleteCategory(category.id)}><FontAwesomeIcon icon={faTrash} /></button>
                                    </>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

export default Categories;