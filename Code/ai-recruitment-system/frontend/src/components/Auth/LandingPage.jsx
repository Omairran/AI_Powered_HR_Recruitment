import React from 'react';
import './LandingPage.css';

const LandingPage = ({ onNavigate }) => {
  return (
    <div className="landing-page">
      <div className="landing-container">
        {/* Header */}
        <header className="landing-header">
          <h1 className="landing-title">
            AI-Powered Recruitment
          </h1>
          <p className="landing-subtitle">
            The intelligent way to hire and get hired.
          </p>
        </header>

        {/* CTA Section - The Main Entry Points */}
        <section className="cta-section">

          {/* Candidate Card */}
          <div className="cta-card candidate-card">
            <div className="cta-icon">🚀</div>
            <h2>For Candidates</h2>
            <p>
              Upload your resume, get instant AI feedback, and match with your dream jobs automatically.
            </p>
            <div className="cta-buttons">
              <button
                className="btn-primary"
                onClick={() => onNavigate('login', 'candidate')}
              >
                Login
              </button>
              <button
                className="btn-secondary"
                onClick={() => onNavigate('register', 'candidate')}
              >
                Create Account
              </button>
            </div>
          </div>

          <div className="divider">OR</div>

          {/* Recruiter Card */}
          <div className="cta-card recruiter-card">
            <div className="cta-icon">💎</div>
            <h2>For Recruiters</h2>
            <p>
              Post jobs, parse resumes in bulk, and let AI rank the best talent for your company.
            </p>
            <div className="cta-buttons">
              <button
                className="btn-primary"
                onClick={() => onNavigate('login', 'hr')}
              >
                Login
              </button>
              <button
                className="btn-secondary"
                onClick={() => onNavigate('register', 'hr')}
              >
                Post a Job
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default LandingPage;