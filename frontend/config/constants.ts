export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export const SESSION_DURATION_MS = 60 * 60 * 1000;

export const NOTIFICATION_DURATION_MS = 5000;

export const STORAGE_KEYS = {
  SESSION: 'coop_session',
  THEME: 'theme',
} as const;

export const USER_ROLES = {
  ADMIN: 'admin',
  RESIDENT: 'resident',
} as const;

export const PAYMENT_STATUSES = ['Wystawiono', 'Zaplacono', 'Oczekuje', 'Zaleglosc'] as const;

export const REPAIR_STATUSES = ['Zgloszona', 'W toku', 'Wykonana', 'Anulowana'] as const;

export const MEASUREMENT_UNITS = ['m3', 'kWh', 'osoba', 'm2', 'ryczałt'] as const;
