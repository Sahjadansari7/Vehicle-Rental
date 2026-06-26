import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const getPreferredTheme = () => {
  if (typeof window === 'undefined') return 'dark';
  const storedTheme = localStorage.getItem('theme');
  if (storedTheme) return storedTheme;
  if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    return 'dark';
  }
  return 'light';
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(getPreferredTheme);
  const [isSystemTheme, setIsSystemTheme] = useState(() => !localStorage.getItem('theme'));

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event) => {
      if (!localStorage.getItem('theme')) {
        setTheme(event.matches ? 'dark' : 'light');
        setIsSystemTheme(true);
      }
    };

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }

    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, []);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
    setIsSystemTheme(false);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, isSystemTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
