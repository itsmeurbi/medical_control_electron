import { Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useRef } from 'react';
import Home from './pages/Home';
import NewPatient from './pages/NewPatient';
import EditPatient from './pages/EditPatient';
import AdvanceSearch from './pages/AdvanceSearch';

// Component to log navigation changes
function NavigationLogger() {
  const location = useLocation();
  const prevLocation = useRef<string | null>(null);

  useEffect(() => {
    const currentPath = location.pathname + location.search;
    if (prevLocation.current !== null && prevLocation.current !== currentPath) {
      // Log navigation to main process via IPC
      if (window.electronAPI) {
        window.electronAPI.logNavigation?.(prevLocation.current, currentPath);
      }
    }
    prevLocation.current = currentPath;
  }, [location]);

  return null;
}

export default function App() {
  return (
    <>
      <NavigationLogger />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/patients/new" element={<NewPatient />} />
        <Route path="/patients/:id/edit" element={<EditPatient />} />
        <Route path="/advance-search" element={<AdvanceSearch />} />
      </Routes>
    </>
  );
}
