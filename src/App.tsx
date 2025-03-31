import React, { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Navbar from './components/Navbar';
import { Notification } from './components/Notification';
import { AuthGuard } from './components/AuthGuard';
import HomePage from './pages/HomePage';

// Lazy load routes for better performance
const FindRidePage = lazy(() => import('./pages/FindRidePage'));
const OfferRidePage = lazy(() => import('./pages/OfferRidePage'));
const MyRidesPage = lazy(() => import('./pages/MyRidesPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const SignInPage = lazy(() => import('./pages/AuthPages').then(module => ({ default: module.SignInPage })));
const SignUpPage = lazy(() => import('./pages/AuthPages').then(module => ({ default: module.SignUpPage })));
const EmailVerificationPage = lazy(() => import('./pages/EmailVerificationPage'));
const EmailVerifiedPage = lazy(() => import('./pages/EmailVerifiedPage'));

// Loading fallback
const LoadingFallback = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
  </div>
);

function App() {
  return (
    <AuthProvider>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <Notification />
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route path="/verify-email" element={<EmailVerificationPage />} />
            <Route path="/email-verified" element={<EmailVerifiedPage />} />
            
            {/* Protected Routes */}
            <Route path="/find-ride" element={<AuthGuard><FindRidePage /></AuthGuard>} />
            <Route path="/offer-ride" element={<AuthGuard><OfferRidePage /></AuthGuard>} />
            <Route path="/my-rides" element={<AuthGuard><MyRidesPage /></AuthGuard>} />
            <Route path="/profile" element={<AuthGuard><ProfilePage /></AuthGuard>} />
          </Routes>
        </Suspense>
      </div>
    </AuthProvider>
  );
}

export default App;