/**
 * @file api.js
 * @description helper function for api call to the backend
 * @author Haitao Wang
 * @date 2024-08-18
 */

import axios from 'axios';

const API_URL = `${process.env.REACT_APP_API_URL}`;

const api = axios.create({
    baseURL: API_URL,
});

api.interceptors.request.use(
    config => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export default api;