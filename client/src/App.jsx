import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Page Imports
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import CandidateHome from './pages/CandidateHome';
import AdminDashboard from './pages/AdminDashboard';
import CreateTaskWizard from './pages/CreateTaskWizard';
import CandidateLanding from './pages/CandidateLanding';
import CodingWorkspace from './pages/CodingWorkspace';
import WritingWorkspace from './pages/WritingWorkspace';
import LiveMonitoring from './pages/LiveMonitoring';
import SingleTaskMonitoring from './pages/SingleTaskMonitoring';
import FinalReview from './pages/FinalReview';
import SubmissionSuccess from './pages/SubmissionSuccess';
import ReportsAnalytics from './pages/ReportsAnalytics';
import TeamManagement from './pages/TeamManagement';
import SettingsPage from './pages/SettingsPage';
import ProfilePage from './pages/ProfilePage';

// Component/Route Guard Imports
import ProtectedRoute from './routes/ProtectedRoute';
import CommandPalette from './components/CommandPalette';

function App() {
  return (
    <Router>
      <Toaster
        position="top-right"
        toastOptions={{
          style: {
            background: '#18181b',
            color: '#f4f4f5',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderRadius: '16px',
            fontSize: '14px',
          },
        }}
      />
      <CommandPalette />
      
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        
        {/* Token-based link welcome (Candidate landing page from email, no account needed) */}
        <Route path="/invite/:token" element={<CandidateLanding />} />

        {/* Candidate Dashboard & Workspaces */}
        <Route
          path="/candidate/home"
          element={
            <ProtectedRoute allowedRole="candidate">
              <CandidateHome />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/workspace/:id"
          element={
            <ProtectedRoute allowedRole="candidate">
              {/* Swapping Editor will be handled inside the workspace router or page component */}
              <WorkspaceRoutingWrapper />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/success"
          element={
            <ProtectedRoute allowedRole="candidate">
              <SubmissionSuccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="/candidate/profile"
          element={
            <ProtectedRoute allowedRole="candidate">
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Admin Dashboard & Management */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRole="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/create-task"
          element={
            <ProtectedRoute allowedRole="admin">
              <CreateTaskWizard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/live"
          element={
            <ProtectedRoute allowedRole="admin">
              <LiveMonitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/live/:id"
          element={
            <ProtectedRoute allowedRole="admin">
              <SingleTaskMonitoring />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/review/:id"
          element={
            <ProtectedRoute allowedRole="admin">
              <FinalReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <ProtectedRoute allowedRole="admin">
              <ReportsAnalytics />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/team"
          element={
            <ProtectedRoute allowedRole="admin">
              <TeamManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/settings"
          element={
            <ProtectedRoute allowedRole="admin">
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/profile"
          element={
            <ProtectedRoute allowedRole="admin">
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        {/* Catch-all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

// Router Wrapper that loads the submission, checks type, and renders Monaco vs TipTap workspace
import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { WorkspaceSkeleton } from './components/Skeleton';

function WorkspaceRoutingWrapper() {
  const { id } = useParams();
  const [taskType, setTaskType] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkTaskType() {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get(`/api/tasks/submissions/${id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setTaskType(res.data.task.type);
      } catch (err) {
        console.error('Error fetching task type in workspace routing wrapper:', err);
      } finally {
        setLoading(false);
      }
    }
    checkTaskType();
  }, [id]);

  if (loading) return <WorkspaceSkeleton />;
  if (!taskType) return <div className="text-center py-20 text-zinc-500">Submission not found.</div>;

  return taskType === 'coding' ? <CodingWorkspace /> : <WritingWorkspace />;
}

export default App;
