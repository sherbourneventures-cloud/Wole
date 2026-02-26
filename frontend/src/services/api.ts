import axios from 'axios';

const EXPO_PUBLIC_BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const apiClient = axios.create({
  baseURL: `${EXPO_PUBLIC_BACKEND_URL}/api`,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const api = {
  // Location endpoints
  createLocation: async (data: {
    name: string;
    description?: string;
    owner_email: string;
  }) => {
    const response = await apiClient.post('/locations', data);
    return response.data;
  },

  getLocations: async (ownerEmail?: string) => {
    const response = await apiClient.get('/locations', {
      params: ownerEmail ? { owner_email: ownerEmail } : {},
    });
    return response.data;
  },

  getLocation: async (locationId: string) => {
    const response = await apiClient.get(`/locations/${locationId}`);
    return response.data;
  },

  deleteLocation: async (locationId: string) => {
    const response = await apiClient.delete(`/locations/${locationId}`);
    return response.data;
  },

  // Visitor request endpoints
  createVisitorRequest: async (data: {
    location_id: string;
    visitor_name: string;
    visitor_phone: string;
    visitor_email: string;
    purpose: string;
    media_type: string;
    media_base64: string;
  }) => {
    const response = await apiClient.post('/visitor-requests', data);
    return response.data;
  },

  getVisitorRequests: async (locationId?: string) => {
    const response = await apiClient.get('/visitor-requests', {
      params: locationId ? { location_id: locationId } : {},
    });
    return response.data;
  },

  getVisitorRequest: async (requestId: string) => {
    const response = await apiClient.get(`/visitor-requests/${requestId}`);
    return response.data;
  },

  updateVisitorStatus: async (requestId: string, status: string) => {
    const response = await apiClient.patch(
      `/visitor-requests/${requestId}/status`,
      null,
      { params: { status } }
    );
    return response.data;
  },

  // Notification endpoints
  getNotifications: async (ownerEmail: string, unreadOnly = false) => {
    const response = await apiClient.get('/notifications', {
      params: { owner_email: ownerEmail, unread_only: unreadOnly },
    });
    return response.data;
  },

  getNotificationCount: async (ownerEmail: string) => {
    const response = await apiClient.get('/notifications/count', {
      params: { owner_email: ownerEmail },
    });
    return response.data;
  },

  markNotificationRead: async (notificationId: string) => {
    const response = await apiClient.patch(
      `/notifications/${notificationId}/read`
    );
    return response.data;
  },

  markAllNotificationsRead: async (ownerEmail: string) => {
    const response = await apiClient.patch('/notifications/mark-all-read', null, {
      params: { owner_email: ownerEmail },
    });
    return response.data;
  },
};
