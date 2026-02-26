import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_BASE = `${BACKEND_URL}/api`;

// Create axios instance
const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('sla_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('sla_token');
      localStorage.removeItem('sla_admin');
      if (window.location.pathname.startsWith('/admin') && window.location.pathname !== '/admin/login') {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Public APIs
export const publicApi = {
  getProjects: (params) => api.get('/projects', { params }),
  getProject: (id) => api.get(`/projects/${id}`),
  getBlogPosts: (params) => api.get('/blog', { params }),
  getBlogPost: (id) => api.get(`/blog/${id}`),
  getTestimonials: (params) => api.get('/testimonials', { params }),
  getTeam: () => api.get('/team'),
  submitInquiry: (data) => api.post('/inquiries', data),
};

// Auth APIs
export const authApi = {
  login: (data) => api.post('/auth/login', data),
  register: (data) => api.post('/auth/register', data),
  getMe: () => api.get('/auth/me'),
};

// Admin APIs
export const adminApi = {
  // Stats
  getStats: () => api.get('/admin/stats'),
  
  // Inquiries
  getInquiries: (params) => api.get('/admin/inquiries', { params }),
  updateInquiry: (id, status) => api.put(`/admin/inquiries/${id}?status=${status}`),
  deleteInquiry: (id) => api.delete(`/admin/inquiries/${id}`),
  
  // Projects
  createProject: (data) => api.post('/admin/projects', data),
  updateProject: (id, data) => api.put(`/admin/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/admin/projects/${id}`),
  
  // Blog
  createBlogPost: (data) => api.post('/admin/blog', data),
  updateBlogPost: (id, data) => api.put(`/admin/blog/${id}`, data),
  togglePublish: (id, published) => api.put(`/admin/blog/${id}/publish?published=${published}`),
  deleteBlogPost: (id) => api.delete(`/admin/blog/${id}`),
  
  // Testimonials
  createTestimonial: (data) => api.post('/admin/testimonials', data),
  updateTestimonial: (id, data) => api.put(`/admin/testimonials/${id}`, data),
  deleteTestimonial: (id) => api.delete(`/admin/testimonials/${id}`),
  
  // Team
  createTeamMember: (data) => api.post('/admin/team', data),
  updateTeamMember: (id, data) => api.put(`/admin/team/${id}`, data),
  deleteTeamMember: (id) => api.delete(`/admin/team/${id}`),
};

export default api;
