/** Backend API base — override with VITE_API_URL in .env */
export const BACKEND_URL =
  (import.meta.env.VITE_API_URL as string | undefined)?.replace(/\/$/, '') ||
  'http://localhost:8000';
