import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const api = axios.create({
  baseURL: API,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Health check
export const healthCheck = () => api.get('/health');

// Calculate section properties
export const calculateSectionProperties = (data) => 
  api.post('/calculate/section-properties', data);

// Calculate concrete properties
export const calculateConcreteProperties = (fck) => 
  api.post(`/calculate/concrete-properties?fck=${fck}`);

// Analyze beam design
export const analyzeBeam = (data) => 
  api.post('/design/analyze', data);

// Generate PDF report
export const generatePdf = async (data) => {
  const response = await api.post('/design/generate-pdf', data, {
    responseType: 'blob',
  });
  return response;
};

// Get projects
export const getProjects = () => api.get('/projects');

// Get single project
export const getProject = (id) => api.get(`/projects/${id}`);

// Delete project
export const deleteProject = (id) => api.delete(`/projects/${id}`);

export default api;
