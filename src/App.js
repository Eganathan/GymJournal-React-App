import { HashRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import AuthGuard from './components/AuthGuard';
import Dashboard from './pages/Dashboard';
import Water from './pages/Water';
import Routines from './pages/Routines';
import RoutineNew from './pages/RoutineNew';
import RoutineDetail from './pages/RoutineDetail';
import AddExercise from './pages/AddExercise';
import Workouts from './pages/Workouts';
import WorkoutActive from './pages/WorkoutActive';
import Metrics from './pages/Metrics';
import MetricsLog from './pages/MetricsLog';
import MetricHistory from './pages/MetricHistory';

export default function App() {
  return (
    <HashRouter>
      <AuthGuard>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/water" element={<Water />} />
            <Route path="/workouts" element={<Workouts />} />
            <Route path="/workouts/:id" element={<WorkoutActive />} />
            <Route path="/routines" element={<Routines />} />
            <Route path="/routines/new" element={<RoutineNew />} />
            <Route path="/routines/:id" element={<RoutineDetail />} />
            <Route path="/routines/:id/add-exercise" element={<AddExercise />} />
            <Route path="/metrics" element={<Metrics />} />
            <Route path="/metrics/log" element={<MetricsLog />} />
            <Route path="/metrics/:metricType" element={<MetricHistory />} />
          </Route>
        </Routes>
      </AuthGuard>
    </HashRouter>
  );
}
