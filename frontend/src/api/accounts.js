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

// Group 2
export const closeAccount     = (id)       => api.put(`/api/accounts/${id}/close`);
export const updateName       = (id, data) => api.put(`/api/accounts/${id}/update-name`, data);
export const searchByName     = (name)     => api.get(`/api/accounts/search?name=${encodeURIComponent(name)}`);
export const getMiniStatement = (id)       => api.get(`/api/accounts/${id}/mini-statement`);

// Group 3
export const getTransactionsByDate = (id, startDate, endDate) =>
  api.get(`/api/accounts/${id}/transactions/filter?startDate=${startDate}&endDate=${endDate}`);
export const calculateInterest = (id) => api.get(`/api/accounts/${id}/interest`);

// Group 4
export const globalSearch         = (keyword)  => api.get(`/api/accounts/global-search?keyword=${encodeURIComponent(keyword)}`);
export const softDeleteAccount    = (id)        => api.delete(`/api/accounts/${id}`);
export const exportAccountsCsv    = ()          => api.get('/api/accounts/export/csv',                          { responseType: 'blob' });
export const exportTransactionsCsv = (id)       => api.get(`/api/accounts/${id}/transactions/export/csv`,       { responseType: 'blob' });
