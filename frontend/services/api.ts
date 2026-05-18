import axios from 'axios';

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (process.env.NODE_ENV === 'production'
    ? 'https://academie-reebi-backend.onrender.com'
    : 'http://localhost:3001');

const api = axios.create({
  baseURL: BACKEND_URL,
  // Timeout 20s — couvre le cold start Render (30-50s géré par warmup avant connexion)
  timeout: 20000,
});

// ─── Warmup Backend ────────────────────────────────────────────────────────────
// Appeler au chargement de la page login pour réveiller le serveur Render
// avant que l'utilisateur clique sur "Connexion".
let warmupDone = false;
let warmupPromise: Promise<boolean> | null = null;

export const warmupBackend = (): Promise<boolean> => {
  if (warmupDone) return Promise.resolve(true);
  if (warmupPromise) return warmupPromise;

  warmupPromise = fetch(`${BACKEND_URL}/health`, {
    method: 'GET',
    signal: AbortSignal.timeout(35000), // 35s max pour le cold start
  })
    .then(() => {
      warmupDone = true;
      return true;
    })
    .catch(() => {
      warmupPromise = null; // permettre un retry
      return false;
    });

  return warmupPromise;
};

// ─── Request Interceptor ──────────────────────────────────────────────────────
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('reebi_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// ─── Response Interceptor ─────────────────────────────────────────────────────
// Anti-faux-logout : ne rediriger que si le token est réellement invalide.
// On ignore les erreurs réseau (cold start, timeout) qui ne sont pas des 401.
let lastRedirectTime = 0;

api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Erreur réseau ou timeout — PAS une erreur 401 authentique
    if (!error.response) {
      return Promise.reject(error);
    }

    if (typeof window !== 'undefined' && error.response?.status === 401) {
      const now = Date.now();
      // Debounce : éviter des redirections multiples en cascade (2s)
      if (now - lastRedirectTime < 2000) {
        return Promise.reject(error);
      }

      // Vérifier que le token existe vraiment (évite faux positifs)
      const token = localStorage.getItem('reebi_token');
      if (!token) {
        // Pas de token du tout → redirection légitime
        lastRedirectTime = now;
        const pathname = window.location.pathname;
        const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';
        window.location.href = loginPath;
      } else {
        // Token présent mais rejeté → le supprimer et rediriger
        lastRedirectTime = now;
        localStorage.removeItem('reebi_token');
        localStorage.removeItem('reebi_user');
        const pathname = window.location.pathname;
        const loginPath = pathname.startsWith('/admin') ? '/admin/login' : '/login';
        window.location.href = loginPath;
      }
    }

    return Promise.reject(error);
  }
);

// ─── API Endpoints ────────────────────────────────────────────────────────────
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
export const deleteSheet = (sheetId: string) =>
  api.delete(`/sessions/sheets/${sheetId}`);

export const getExperiences = () => api.get('/experiences');
export const createExperience = (data: any) => api.post('/experiences', data);
export const deleteExperience = (id: string) => api.delete(`/experiences/${id}`);
export const getExperiencesStats = () => api.get('/experiences/stats');

export default api;
