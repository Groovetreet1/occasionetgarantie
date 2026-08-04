import { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  { id: 'light', label: 'Blanc', color: '#f8f9fc', text: '#1e293b' },
  { id: 'sable', label: 'Sable', color: '#faf6f0', text: '#3b3226' },
  { id: 'mint', label: 'Menthe', color: '#f0f7f2', text: '#1e2f26' },
  { id: 'sky', label: 'Brume', color: '#eff6fb', text: '#1e2a3b' },
  { id: 'rose', label: 'Rose', color: '#fbf2f4', text: '#3b2630' },
  { id: 'lavender', label: 'Lavande', color: '#f4f1fb', text: '#2a263b' },
  { id: 'dark', label: 'Sombre', color: '#0a0a0f', text: '#f1f5f9' },
];

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem('theme');
    return THEMES.some((t) => t.id === saved) ? saved : 'light';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
