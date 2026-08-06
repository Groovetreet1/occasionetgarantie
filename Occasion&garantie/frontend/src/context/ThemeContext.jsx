import { createContext, useContext, useState, useEffect } from 'react';

export const THEMES = [
  { id: 'light', label: 'Blanc', color: '#f8f9fc', card: '#ffffff', text: '#1e293b', accent: '#f59e0b' },
  { id: 'sable', label: 'Sable', color: '#faf6f0', card: '#fffdf9', text: '#3b3226', accent: '#f59e0b' },
  { id: 'mint', label: 'Menthe', color: '#f0f7f2', card: '#fbfffc', text: '#1e2f26', accent: '#f59e0b' },
  { id: 'sky', label: 'Brume', color: '#eff6fb', card: '#fbffff', text: '#1e2a3b', accent: '#f59e0b' },
  { id: 'rose', label: 'Rose', color: '#fbf2f4', card: '#fffdfe', text: '#3b2630', accent: '#f59e0b' },
  { id: 'lavender', label: 'Lavande', color: '#f4f1fb', card: '#fdfcff', text: '#2a263b', accent: '#f59e0b' },
  { id: 'dark', label: 'Sombre', color: '#0a0a0f', card: '#1a1a25', text: '#f1f5f9', accent: '#fbbf24' },
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
