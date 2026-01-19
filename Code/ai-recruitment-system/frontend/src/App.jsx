import React, { useState, useEffect } from 'react';
import axios from 'axios';
import LandingPage from './components/Auth/LandingPage';
import Login from './components/Auth/Login';
import Register from './components/Auth/Register';
import CandidateApplicationForm from './components/CandidateApplicationForm';
import JobPostingForm from './components/Jobs/JobPostingForm';
import JobListings from './components/Jobs/JobListings';
import HRDashboard from './components/Jobs/HRDashboard';
import CandidateDashboard from './components/CandidateDashboard';
import './App.css';

function App() {
  const [authState, setAuthState] = useState('landing'); // landing, login, register, authenticated
  const [userType, setUserType] = useState(null); // candidate or hr
  const [currentUser, setCurrentUser] = useState(null);
  const [currentPage, setCurrentPage] = useState('jobs');

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');

    if (token && user) {
      const parsedUser = JSON.parse(user);
      setCurrentUser(parsedUser);
      setUserType(parsedUser.user_type);
      setAuthState('authenticated');

      // Set axios default authorization header
      axios.defaults.headers.common['Authorization'] = `Token ${token}`;
    }
  }, []);

  const handleNavigate = (page, type) => {
    setAuthState(page);
    setUserType(type);
  };

  const handleLoginSuccess = (data) => {
    setCurrentUser(data.user);
    setUserType(data.user.user_type);
    setAuthState('authenticated');

    // Set axios default authorization header
    axios.defaults.headers.common['Authorization'] = `Token ${data.token}`;

    // Set default page based on user type
    if (data.user.user_type === 'hr') {
      setCurrentPage('hr-dashboard');
    } else {
      setCurrentPage('jobs');
    }
  };

  const handleRegisterSuccess = (data) => {
    setCurrentUser(data.user);
    setUserType(data.user.user_type);
    setAuthState('authenticated');

    // Set axios default authorization header
    axios.defaults.headers.common['Authorization'] = `Token ${data.token}`;

    // Set default page based on user type
    if (data.user.user_type === 'hr') {
      setCurrentPage('post-job');
    } else {
      setCurrentPage('apply');
    }
  };

  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('candidate_profile');

    // Clear axios header
    delete axios.defaults.headers.common['Authorization'];

    // Reset state
    setAuthState('landing');
    setCurrentUser(null);
    setUserType(null);
    setCurrentPage('jobs');
  };

  const handleBack = (returnTo) => {
    if (returnTo === 'login') {
      setAuthState('login');
    } else if (returnTo === 'register') {
      setAuthState('register');
    } else {
      setAuthState('landing');
    }
  };

  // Show authentication screens
  if (authState === 'landing') {
    return <LandingPage onNavigate={handleNavigate} />;
  }

  if (authState === 'login') {
    return (
      <Login
        userType={userType}
        onLoginSuccess={handleLoginSuccess}
        onBack={handleBack}
      />
    );
  }

  if (authState === 'register') {
    return (
      <Register
        userType={userType}
        onRegisterSuccess={handleRegisterSuccess}
        onBack={handleBack}
      />
    );
  }

  // Show main application (authenticated)
  return (
    <div className="App">
      {/* Navigation */}
      <nav className="main-nav">
        <div className="nav-container">
          <div className="nav-brand">
            <h2>🚀 AI Recruitment System</h2>
            <p>Welcome, {currentUser?.first_name || currentUser?.username}!</p>
          </div>

          <div className="nav-links">
            {/* Candidate Navigation */}
            {userType === 'candidate' && (
              <>
                <button
                  onClick={() => setCurrentPage('jobs')}
                  className={`nav-btn ${currentPage === 'jobs' ? 'active' : ''}`}
                >
                  <span className="nav-icon">🔍</span>
                  Browse Jobs
                </button>

                <button
                  onClick={() => setCurrentPage('apply')}
                  className={`nav-btn ${currentPage === 'apply' ? 'active' : ''}`}
                >
                  <span className="nav-icon">📄</span>
                  My Applications
                </button>
              </>
            )}

            {/* HR Navigation */}
            {userType === 'hr' && (
              <>
                <button
                  onClick={() => setCurrentPage('post-job')}
                  className={`nav-btn ${currentPage === 'post-job' ? 'active' : ''}`}
                >
                  <span className="nav-icon">📋</span>
                  Post a Job
                </button>

                <button
                  onClick={() => setCurrentPage('hr-dashboard')}
                  className={`nav-btn ${currentPage === 'hr-dashboard' ? 'active' : ''}`}
                >
                  <span className="nav-icon">🎯</span>
                  Dashboard
                </button>

                <button
                  onClick={() => setCurrentPage('jobs')}
                  className={`nav-btn ${currentPage === 'jobs' ? 'active' : ''}`}
                >
                  <span className="nav-icon">📊</span>
                  All Jobs
                </button>
              </>
            )}

            {/* Logout Button */}
            <button
              onClick={handleLogout}
              className="nav-btn btn-logout"
            >
              <span className="nav-icon">🚪</span>
              Logout
            </button>
          </div>
        </div>
      </nav>

      {/* Page Content */}
      <main className="main-content">
        {currentPage === 'jobs' && (
          <JobListings
            onApply={(jobId) => {
              // Store job ID if needed or pass via state/context
              // For now, simpler to just switch page if the form allows selecting job.
              // But requirements say "redirect to job application form"
              localStorage.setItem('selected_job_id', jobId); // Simple way to pass data
              setCurrentPage('application-form');
            }}
          />
        )}
        {currentPage === 'dashboard' && userType === 'candidate' && (
          <CandidateDashboard onNavigate={setCurrentPage} />
        )}
        {currentPage === 'application-form' && userType === 'candidate' && (
          <CandidateApplicationForm />
        )}
        {currentPage === 'apply' && userType === 'candidate' && (
          // Deprecated: "My Applications" now goes to dashboard
          <CandidateDashboard onNavigate={setCurrentPage} />
        )}

        {currentPage === 'post-job' && userType === 'hr' && <JobPostingForm />}
        {currentPage === 'hr-dashboard' && userType === 'hr' && <HRDashboard />}
      </main>

      {/* Footer */}
      <footer className="main-footer">
        <p>© 2026 AI Recruitment System | BSCS Final Year Project</p>
        <p>Namal University, Mianwali</p>
      </footer>
    </div>
  );
}

export default App;