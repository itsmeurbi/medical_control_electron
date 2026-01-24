import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import NewPatient from './pages/NewPatient';
import EditPatient from './pages/EditPatient';
import AdvanceSearch from './pages/AdvanceSearch';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/patients/new" element={<NewPatient />} />
      <Route path="/patients/:id/edit" element={<EditPatient />} />
      <Route path="/advance-search" element={<AdvanceSearch />} />
    </Routes>
  );
}
