import React, { useState, useEffect } from 'react';
import { HomePage } from './pages/HomePage';
import { DispatcherApp } from './pages/DispatcherApp';
import { DocsPage } from './pages/DocsPage';
import { ThemeProvider } from './context/ThemeContext';

const AppContent: React.FC = () => {
  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname;
  });

  useEffect(() => {
    const handleLocationChange = () => {
      setCurrentPath(window.location.pathname);
    };

    window.addEventListener('popstate', handleLocationChange);
    return () => window.removeEventListener('popstate', handleLocationChange);
  }, []);

  // Keyboard shortcut (Ctrl + Shift + D) to jump directly into /app console
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        const nextPath = currentPath === '/app' ? '/' : '/app';
        window.history.pushState({}, '', nextPath);
        setCurrentPath(nextPath);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentPath]);

  // Route evaluation
  if (currentPath === '/docs' || currentPath.startsWith('/docs') || window.location.hash === '#docs-page') {
    return <DocsPage />;
  }

  const isAppRoute = currentPath === '/app' || currentPath.startsWith('/app') || window.location.hash === '#app';
  if (isAppRoute) {
    return <DispatcherApp />;
  }

  return <HomePage />;
};

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
};

export default App;
