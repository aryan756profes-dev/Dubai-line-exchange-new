/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { GameProvider } from './contexts/GameContext';
import { NotificationProvider } from './contexts/NotificationContext';

import Home from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Layout from './components/Layout';
import AutoSettler from './components/AutoSettler';
import FloatingSupport from './components/FloatingSupport';
import AdminLayout from './components/AdminLayout';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const NumberGame = lazy(() => import('./pages/NumberGame'));
const ColorGame = lazy(() => import('./pages/ColorGame'));
const Activity = lazy(() => import('./pages/Activity'));
const Reviews = lazy(() => import('./pages/Reviews'));
const Guide = lazy(() => import('./pages/Guide'));
const Terms = lazy(() => import('./pages/Terms'));
const Support = lazy(() => import('./pages/Support'));
const Profile = lazy(() => import('./pages/Profile'));
const AddFunds = lazy(() => import('./pages/AddFunds'));
const Withdraw = lazy(() => import('./pages/Withdraw'));

const AdminDashboard = lazy(() => import('./pages/admin/AdminDashboard'));
const AdminUsers = lazy(() => import('./pages/admin/AdminUsers'));
const AdminDeposits = lazy(() => import('./pages/admin/AdminDeposits'));
const AdminWithdrawals = lazy(() => import('./pages/admin/AdminWithdrawals'));
const AdminGameControl = lazy(() => import('./pages/admin/AdminGameControl'));
const AdminLogin = lazy(() => import('./pages/admin/AdminLogin'));
const AdminBets = lazy(() => import('./pages/admin/AdminBets'));
const AdminBonusCodes = lazy(() => import('./pages/admin/AdminBonusCodes'));

const Loader = () => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
    <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
    <div className="text-cyan-400 font-bold tracking-widest text-[10px] animate-pulse">LOADING...</div>
  </div>
);

function PrivateRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, profile, loading, isAdmin } = useAuth();
  
  if (loading) return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
      <div className="w-12 h-12 border-2 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
      <div className="text-cyan-400 font-bold tracking-widest text-[10px] animate-pulse">SYNCHRONIZING EXCHANGE...</div>
    </div>
  );
  if (!user) return <Navigate to={adminOnly ? "/admin/login" : "/login"} />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;
  if (profile?.isBlocked) return <div className="min-h-screen bg-slate-950 flex items-center justify-center text-red-500">Your account is blocked. Contact support.</div>;
  
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <NotificationProvider>
          <AutoSettler />
          <FloatingSupport />
          <Router>
            <Suspense fallback={<Loader />}>
              <Routes>
                <Route path="/" element={<Layout><Home /></Layout>} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route path="/dashboard" element={<PrivateRoute><Layout><Dashboard /></Layout></PrivateRoute>} />
                <Route path="/game/number" element={<PrivateRoute><Layout><NumberGame /></Layout></PrivateRoute>} />
                <Route path="/game/color" element={<PrivateRoute><Layout><ColorGame /></Layout></PrivateRoute>} />
                <Route path="/activity" element={<PrivateRoute><Layout><Activity /></Layout></PrivateRoute>} />
                <Route path="/reviews" element={<Layout><Reviews /></Layout>} />
                <Route path="/guide" element={<Layout><Guide /></Layout>} />
                <Route path="/terms" element={<Layout><Terms /></Layout>} />
                <Route path="/support" element={<Layout><Support /></Layout>} />
                <Route path="/profile" element={<PrivateRoute><Layout><Profile /></Layout></PrivateRoute>} />
                <Route path="/add-funds" element={<PrivateRoute><Layout><AddFunds /></Layout></PrivateRoute>} />
                <Route path="/withdraw" element={<PrivateRoute><Layout><Withdraw /></Layout></PrivateRoute>} />
                
                {/* Admin Routes */}
                <Route path="/admin" element={<PrivateRoute adminOnly><AdminLayout><AdminDashboard /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/users" element={<PrivateRoute adminOnly><AdminLayout><AdminUsers /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/deposits" element={<PrivateRoute adminOnly><AdminLayout><AdminDeposits /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/withdrawals" element={<PrivateRoute adminOnly><AdminLayout><AdminWithdrawals /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/games" element={<PrivateRoute adminOnly><AdminLayout><AdminGameControl /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/bonuses" element={<PrivateRoute adminOnly><AdminLayout><AdminBonusCodes /></AdminLayout></PrivateRoute>} />
                <Route path="/admin/bets" element={<PrivateRoute adminOnly><AdminLayout><AdminBets /></AdminLayout></PrivateRoute>} />
              </Routes>
            </Suspense>
          </Router>
        </NotificationProvider>
      </GameProvider>
    </AuthProvider>
  );
}
