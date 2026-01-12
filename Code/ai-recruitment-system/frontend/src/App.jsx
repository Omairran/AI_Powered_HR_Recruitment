import React, { useState } from 'react';
import CandidateApplicationForm from './components/CandidateApplicationForm';
import JobListings from './components/Jobs/JobListings';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState('jobs');

  return (
    <div className="App">
      <nav className="main-nav">
        <div className="nav-container">
          <h2>🚀 AI Recruitment System</h2>
          <div className="nav-links">
            <button 
              onClick={() => setCurrentPage('jobs')}
              className={currentPage === 'jobs' ? 'active' : ''}
            >
              Browse Jobs
            </button>
            <button 
              onClick={() => setCurrentPage('apply')}
              className={currentPage === 'apply' ? 'active' : ''}
            >
              Apply as Candidate
            </button>
          </div>
        </div>
      </nav>

      {currentPage === 'jobs' ? <JobListings /> : <CandidateApplicationForm />}
    </div>
  );
}

export default App;