import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Categories
export const getCategories = () => api.get('/categories');
export const createCategory = (data) => api.post('/categories', data);
export const updateCategory = (id, data) => api.put(`/categories/${id}`, data);
export const deleteCategory = (id) => api.delete(`/categories/${id}`);

// Transactions
export const getTransactions = (params) => api.get('/transactions', { params });
export const createTransaction = (data) => api.post('/transactions', data);
export const updateTransaction = (id, data) => api.put(`/transactions/${id}`, data);
export const deleteTransaction = (id) => api.delete(`/transactions/${id}`);

// Budget Goals
export const getBudgetGoals = () => api.get('/budget-goals');
export const createBudgetGoal = (data) => api.post('/budget-goals', data);
export const updateBudgetGoal = (id, data) => api.put(`/budget-goals/${id}`, data);
export const deleteBudgetGoal = (id) => api.delete(`/budget-goals/${id}`);

// Dashboard
export const getDashboard = () => api.get('/dashboard');

// Seed data
export const seedData = () => api.post('/seed');

export default api;
