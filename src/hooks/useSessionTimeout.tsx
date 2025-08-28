/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './useAuth';
import { useToast } from './use-toast';

type SessionTimeoutContextValue = Record<string, never>;

const SessionTimeoutContext = createContext<SessionTimeoutContextValue>({});

const TIMEOUT_DURATION = 120 * 60 * 1000;

export const SessionTimeoutProvider = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, logout } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const handleLogout = useCallback(() => {
    logout();
    toast({
      title: 'Sessão Encerrada',
      description: 'Sua sessão foi encerrada por inatividade.',
      variant: 'default',
    });
    navigate('/login');
  }, [logout, toast, navigate]);

  const resetTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(handleLogout, TIMEOUT_DURATION);
  }, [handleLogout]);

  useEffect(() => {
    if (currentUser) {
      const events = ['mousemove', 'mousedown', 'keypress', 'scroll', 'touchstart'];

      const eventListener = () => {
        resetTimer();
      };

      events.forEach((event) => {
        window.addEventListener(event, eventListener);
      });

      resetTimer();

      return () => {
        events.forEach((event) => {
          window.removeEventListener(event, eventListener);
        });
        if (timerRef.current) {
          clearTimeout(timerRef.current);
        }
      };
    }
  }, [currentUser, resetTimer]);

  return (
    <SessionTimeoutContext.Provider value={{}}>
      {children}
    </SessionTimeoutContext.Provider>
  );
};

export const useSessionTimeout = () => useContext(SessionTimeoutContext);

