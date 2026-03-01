import api from './axios';

export const getAdminDashboard = () => api.get('/api/admin/dashboard');
