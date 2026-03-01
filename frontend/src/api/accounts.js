import api from './axios';

export const createAccount  = (data)           => api.post('/api/accounts', data);
export const getAllAccounts = ()                => api.get('/api/accounts');
export const getAccount     = (id)             => api.get(`/api/accounts/${id}`);
export const getBalance     = (id)             => api.get(`/api/accounts/${id}/balance`);
export const deposit        = (id, data)       => api.post(`/api/accounts/${id}/deposit`, data);
export const withdraw       = (id, data)       => api.post(`/api/accounts/${id}/withdraw`, data);
export const transfer       = (data)           => api.post('/api/accounts/transfer', data);
export const getTransactions = (id, page = 0, size = 10) =>
  api.get(`/api/accounts/${id}/transactions?page=${page}&size=${size}&direction=DESC`);
