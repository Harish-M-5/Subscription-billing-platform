import api from './client';

export const authApi = {
  registerBusiness: (data) => api.post('/auth/business/register', data),
  registerCustomer: (data) => api.post('/auth/customer/register', data),
  login: (data) => api.post('/auth/login', data),
  me: () => api.get('/auth/me'),
};

export const businessApi = {
  getMine: () => api.get('/business/me'),
  update: (data) => api.put('/business/me', data),
  updateSettings: (data) => api.put('/business/settings', data),
};

export const staffApi = {
  list: (params) => api.get('/staff', { params }),
  add: (data) => api.post('/staff', data),
  update: (id, data) => api.put(`/staff/${id}`, data),
  deactivate: (id) => api.delete(`/staff/${id}`),
};

export const customerApi = {
  list: (params) => api.get('/customers', { params }),
  get: (id) => api.get(`/customers/${id}`),
  add: (data) => api.post('/customers', data),
  update: (id, data) => api.put(`/customers/${id}`, data),
  remove: (id) => api.delete(`/customers/${id}`),
};

export const planApi = {
  list: (params) => api.get('/plans', { params }),
  create: (data) => api.post('/plans', data),
  update: (id, data) => api.put(`/plans/${id}`, data),
  deactivate: (id) => api.put(`/plans/${id}/deactivate`),
};

export const subscriptionApi = {
  list: (params) => api.get('/subscriptions', { params }),
  create: (data) => api.post('/subscriptions', data),
  renew: (id) => api.post(`/subscriptions/${id}/renew`),
  upgrade: (id, newPlanId) => api.post(`/subscriptions/${id}/upgrade`, { newPlanId }),
  cancel: (id, reason) => api.post(`/subscriptions/${id}/cancel`, { reason }),
};

export const paymentApi = {
  list: (params) => api.get('/payments', { params }),
  record: (data) => api.post('/payments', data),
};

export const invoiceApi = {
  list: (params) => api.get('/invoices', { params }),
  get: (id) => api.get(`/invoices/${id}`),
  downloadPdf: (id) => api.get(`/invoices/${id}/download`, { responseType: 'blob' }),
  setInstallmentPlan: (id, data) => api.put(`/invoices/${id}/installment-plan`, data),
};

export const dashboardApi = {
  summary: () => api.get('/dashboard/summary'),
  reports: (params) => api.get('/dashboard/reports', { params }),
};

export const profileApi = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  changePassword: (data) => api.put('/profile/password', data),
  deleteAccount: (data) => api.delete('/profile', { data }),
};

export const portalApi = {
  dashboard: () => api.get('/portal/dashboard'),
  payments: () => api.get('/portal/payments'),
  invoices: () => api.get('/portal/invoices'),
  downloadInvoicePdf: (id) => api.get(`/portal/invoices/${id}/download`, { responseType: 'blob' }),
  subscriptions: () => api.get('/portal/subscriptions'),
  notifications: (params) => api.get('/portal/notifications', { params }),
  markNotificationRead: (id) => api.put(`/portal/notifications/${id}/read`),
  markAllNotificationsRead: () => api.put('/portal/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/portal/notifications/${id}`),
};

export const notificationApi = {
  list: (params) => api.get('/notifications', { params }),
  markRead: (id) => api.put(`/notifications/${id}/read`),
  markAllRead: () => api.put('/notifications/read-all'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
};

export const uploadApi = {
  upload: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
  },
};
