import api from './axios';

export const getProfile      = ()     => api.get('/api/users/profile');
export const changePassword  = (data) => api.put('/api/users/change-password', data);
