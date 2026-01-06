import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_BASE_URL, SESSION_DURATION_MS, STORAGE_KEYS, USER_ROLES } from '../config/constants';

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES] | null;

export interface UserData {
  id: number;
  login?: string;
  name?: string;
  apt_num?: string;
  apt_id?: number;
}

interface SessionData {
  user: UserData;
  role: UserRole;
  timestamp: number;
}

interface AdminCredentials {
  login: string;
  haslo: string;
}

interface ResidentCredentials {
  imie: string;
  nazwisko: string;
  numer: string;
}

export function useAuth() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [userData, setUserData] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEYS.SESSION);
    if (!savedSession) return;

    try {
      const session: SessionData = JSON.parse(savedSession);
      const isSessionValid = Date.now() - session.timestamp < SESSION_DURATION_MS;

      if (isSessionValid) {
        setUserData(session.user);
        setUserRole(session.role);
        setIsLoggedIn(true);
      } else {
        localStorage.removeItem(STORAGE_KEYS.SESSION);
      }
    } catch {
      localStorage.removeItem(STORAGE_KEYS.SESSION);
    }
  }, []);

  const loginAdmin = useCallback(async (credentials: AdminCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/login`, credentials);
      
      if (response.data.success === true) {
        const session: SessionData = {
          user: response.data.user,
          role: USER_ROLES.ADMIN,
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
        setUserData(session.user);
        setUserRole(session.role);
        setIsLoggedIn(true);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loginResident = useCallback(async (credentials: ResidentCredentials): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_BASE_URL}/login/resident`, credentials);
      
      if (response.data.success === true) {
        const session: SessionData = {
          user: response.data.user,
          role: response.data.role || USER_ROLES.RESIDENT,
          timestamp: Date.now(),
        };
        localStorage.setItem(STORAGE_KEYS.SESSION, JSON.stringify(session));
        setUserData(session.user);
        setUserRole(session.role);
        setIsLoggedIn(true);
        return true;
      }
      return false;
    } catch {
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEYS.SESSION);
    setIsLoggedIn(false);
    setUserRole(null);
    setUserData(null);
  }, []);

  return {
    isLoggedIn,
    userRole,
    userData,
    isLoading,
    loginAdmin,
    loginResident,
    logout,
  };
}
