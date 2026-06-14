import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Credit } from '@/src/types';
import { initialCredits } from '@/src/utils';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = '@mad_credits_data';

interface CreditsContextType {
  credits: Credit[];
  addCredit: (credit: Credit) => void;
  updateCredit: (id: string, data: Partial<Credit>) => void;
  deleteCredit: (id: string) => void;
  togglePaye: (id: string) => void;
  loaded: boolean;
}

const CreditsContext = createContext<CreditsContextType>({
  credits: [],
  addCredit: () => {},
  updateCredit: () => {},
  deleteCredit: () => {},
  togglePaye: () => {},
  loaded: false,
});

export function CreditsProvider({ children }: { children: React.ReactNode }) {
  const [credits, setCredits] = useState<Credit[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then((data) => {
      if (data) {
        setCredits(JSON.parse(data));
      } else {
        setCredits(initialCredits);
      }
      setLoaded(true);
    }).catch(() => {
      setCredits(initialCredits);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (loaded) {
      AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(credits)).catch(() => {});
    }
  }, [credits, loaded]);

  const addCredit = useCallback((credit: Credit) => {
    setCredits(prev => [credit, ...prev]);
  }, []);

  const updateCredit = useCallback((id: string, data: Partial<Credit>) => {
    setCredits(prev => prev.map(c => c.id === id ? { ...c, ...data } : c));
  }, []);

  const deleteCredit = useCallback((id: string) => {
    setCredits(prev => prev.filter(c => c.id !== id));
  }, []);

  const togglePaye = useCallback((id: string) => {
    setCredits(prev => prev.map(c => c.id === id ? { ...c, paye: !c.paye } : c));
  }, []);

  return (
    <CreditsContext.Provider value={{ credits, addCredit, updateCredit, deleteCredit, togglePaye, loaded }}>
      {children}
    </CreditsContext.Provider>
  );
}

export function useCredits() {
  return useContext(CreditsContext);
}
