import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 
    (process.env.NODE_ENV === 'production' ? 'https://academie-reebi-backend.onrender.com' : 'http://localhost:3001'),
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('reebi_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const getLearners = () => api.get('/learners');
export const createLearner = (data: any) => api.post('/learners', data);
export const updateLearner = (id: string, data: any) => api.patch(`/learners/${id}`, data);
export const deleteLearner = (id: string) => api.delete(`/learners/${id}`);

export const getSessions = () => api.get('/sessions');
export const getSessionDetails = (id: string) => api.get(`/sessions/${id}`);
export const createSession = (data: any) => api.post('/sessions', data);
export const importExcelToSession = (sessionId: string, formData: FormData) =>
  api.post(`/sessions/${sessionId}/import`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
export const getSheetData = (sheetId: string) => api.get(`/sessions/sheets/${sheetId}/data`);
export const updateSheetValue = (sheetId: string, data: { learnerId: string, sessionColumnId: string, value: string }) =>
  api.put(`/sessions/sheets/${sheetId}/values`, data);
export const createColumn = (sheetId: string, data: { name: string, dataType: string }) =>
  api.post(`/sessions/sheets/${sheetId}/columns`, data);
export const deleteColumn = (sheetId: string, columnId: string) =>
  api.delete(`/sessions/sheets/${sheetId}/columns/${columnId}`);

export const getExperiences = () => api.get('/experiences');
export const createExperience = (data: any) => api.post('/experiences', data);
export const deleteExperience = (id: string) => api.delete(`/experiences/${id}`);
export const getExperiencesStats = () => api.get('/experiences/stats');

export default api;
