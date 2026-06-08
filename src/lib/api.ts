import axios from 'axios';

// Ensure the API URL ends with /api
const baseApiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
const API_URL = baseApiUrl.endsWith('/api') ? baseApiUrl : `${baseApiUrl}/api`;

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  register: (data: any) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Hospital APIs
export const hospitalAPI = {
  getAll: () => api.get('/hospitals'),
  getById: (id: string) => api.get(`/hospitals/${id}`),
  create: (data: any) => api.post('/hospitals', data),
  update: (id: string, data: any) => api.put(`/hospitals/${id}`, data),
  delete: (id: string) => api.delete(`/hospitals/${id}`),
};

// Department APIs
export const departmentAPI = {
  getByHospital: (hospitalId: string) =>
    api.get(`/departments/hospital/${hospitalId}`),
  getById: (id: string) => api.get(`/departments/${id}`),
  create: (data: any) => api.post('/departments', data),
  update: (id: string, data: any) => api.put(`/departments/${id}`, data),
  delete: (id: string) => api.delete(`/departments/${id}`),
};

// Token APIs
export const tokenAPI = {
  getPatientTokens: (patientId: string, date?: string) =>
    api.get(`/tokens/patient/${patientId}${date ? `?date=${date}` : ''}`),
  getDoctorTokens: (doctorId: string, date?: string, status?: string) => {
    const params = new URLSearchParams();
    if (date) params.append('date', date);
    if (status) params.append('status', status);
    const queryString = params.toString();
    return api.get(`/tokens/doctor/${doctorId}${queryString ? `?${queryString}` : ''}`);
  },
  getQueue: (departmentId: string, date?: string) =>
    api.get(`/tokens/queue/${departmentId}${date ? `?date=${date}` : ''}`),
  bookToken: (data: any) => api.post('/tokens', data),
  callToken: (id: string) => api.post(`/tokens/${id}/call`),
  completeToken: (id: string) => api.post(`/tokens/${id}/complete`),
  skipToken: (id: string) => api.post(`/tokens/${id}/skip`),
  cancelToken: (id: string) => api.post(`/tokens/${id}/cancel`),
};

// Queue APIs
export const queueAPI = {
  getStatus: (doctorId: string, date?: string) =>
    api.get(`/queues/status/${doctorId}${date ? `?date=${date}` : ''}`),
  getDisplay: (departmentId: string, date?: string) =>
    api.get(`/queues/display/${departmentId}${date ? `?date=${date}` : ''}`),
  getAnalytics: (doctorId: string, startDate?: string, endDate?: string) =>
    api.get(
      `/queues/analytics/${doctorId}${startDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`
    ),
  updateStatus: (queueId: string, status: string) =>
    api.put(`/queues/status/${queueId}`, { status }),
};

// User APIs
export const userAPI = {
  getDoctors: (hospitalId?: string, department?: string) =>
    api.get(`/users/doctors${hospitalId ? `?hospitalId=${hospitalId}` : ''}${department ? `&department=${department}` : ''}`),
  getAll: (role?: string, hospitalId?: string) =>
    api.get(`/users${role ? `?role=${role}` : ''}${hospitalId ? `&hospitalId=${hospitalId}` : ''}`),
  getById: (id: string) => api.get(`/users/${id}`),
  create: (data: any) => api.post('/users', data),
  update: (id: string, data: any) => api.put(`/users/${id}`, data),
  delete: (id: string) => api.delete(`/users/${id}`),
};

// Analytics APIs
export const analyticsAPI = {
  getDashboard: (startDate?: string, endDate?: string) =>
    api.get(`/analytics/dashboard${startDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`),
  getDoctorAnalytics: (doctorId: string, startDate?: string, endDate?: string) =>
    api.get(`/analytics/doctor/${doctorId}${startDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`),
  getHospitalAnalytics: (hospitalId: string, startDate?: string, endDate?: string) =>
    api.get(`/analytics/hospital/${hospitalId}${startDate ? `?startDate=${startDate}&endDate=${endDate}` : ''}`),
};

// Patient APIs
export const patientAPI = {
  getAllPatients: () => api.get('/users/patients'),
  getById: (id: string) => api.get(`/users/patients/${id}`),
  getMyPatients: (doctorId: string) => api.get(`/users/patients/my/${doctorId}`),
};

// Notification APIs
export const notificationAPI = {
  getNotifications: (userId: string) => api.get(`/notifications/${userId}`),
  markAsRead: (id: string) => api.put(`/notifications/${id}/read`),
  markAllAsRead: (userId: string) => api.put(`/notifications/${userId}/read-all`),
  deleteNotification: (id: string) => api.delete(`/notifications/${id}`),
  getUnreadCount: (userId: string) => api.get(`/notifications/${userId}/unread-count`),
};

// Schedule APIs
export const scheduleAPI = {
  getByDoctor: (doctorId: string, date?: string) =>
    api.get(`/schedules/doctor/${doctorId}${date ? `?date=${date}` : ''}`),
  getAll: (params?: { doctorId?: string; date?: string; status?: string }) =>
    api.get('/schedules', { params }),
  create: (data: any) => api.post('/schedules', data),
  update: (id: string, data: any) => api.put(`/schedules/${id}`, data),
  delete: (id: string) => api.delete(`/schedules/${id}`),
  deleteSlot: (scheduleId: string, slotIndex: number) => api.put(`/schedules/${scheduleId}/slots/${slotIndex}/delete`),
  getAvailability: (doctorId: string, startDate?: string) =>
    api.get(`/schedules/availability/${doctorId}${startDate ? `?startDate=${startDate}` : ''}`),
  getSlotsForDate: (doctorId: string, date: string) =>
    api.get(`/schedules/${doctorId}/date/${date}`),
};

// Appointment APIs
export const appointmentAPI = {
  book: (data: any) => api.post('/appointments/book', data),
  getMyAppointments: (params?: { status?: string; upcoming?: boolean }) =>
    api.get('/appointments/my', { params }),
  getDoctorAppointments: (doctorId: string, params?: { date?: string; type?: 'today' | 'all' | 'upcoming' | 'completed' }) =>
    api.get(`/appointments/doctor/${doctorId}`, { params }),
  complete: (id: string) => api.put(`/appointments/${id}/complete`),
  cancel: (id: string) => api.put(`/appointments/${id}/cancel`),
  getById: (id: string) => api.get(`/appointments/appointment/${id}`),
};
