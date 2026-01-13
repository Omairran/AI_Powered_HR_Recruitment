
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import MatchResults from './MatchResults';
import './HRDashboard.css';

const HRDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [topCandidates, setTopCandidates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [stats, setStats] = useState(null);
  const [minScore, setMinScore] = useState(60);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchJobs();
    fetchStats();
  }, []);

  useEffect(() => {
    if (selectedJob) {
      fetchTopCandidates(selectedJob.id);
    }
  }, [selectedJob, minScore]);

  const fetchJobs = async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/?status=active`);
      setJobs(response.data);
      if (response.data.length > 0 && !selectedJob) {
        setSelectedJob(response.data[0]);
      }
    } catch (err) {
      console.error('Error fetching jobs:', err);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API_URL}/jobs/stats/`);
      setStats(response.data);
    } catch (err) {
      console.error('Error fetching stats:', err);
    }
  };

  const fetchTopCandidates = async (jobId) => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${API_URL}/matching/top-candidates/${jobId}/?min_score=${minScore}&limit=20`
      );
      setTopCandidates(response.data.top_candidates || []);
    } catch (err) {
      console.error('Error fetching candidates:', err);
      setTopCandidates([]);
    } finally {
      setLoading(false);
    }
  };

  const viewMatchDetails = (candidate) => {
    setSelectedMatch({
      candidateId: candidate.candidate_id,
      jobId: selectedJob.id
    });
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await axios.post(
        `${API_URL}/job-applications/${applicationId}/update_status/`,
        { status: newStatus }
      );
      
      // Refresh candidates
      fetchTopCandidates(selectedJob.id);
      alert('Status updated successfully!');
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const getScoreColor = (score) => {
    if (score >= 80) return '#4caf50';
    if (score >= 60) return '#2196f3';
    if (score >= 40) return '#ff9800';
    return '#f44336';
  };

  const getScoreBadge = (score) => {
    if (score >= 90) return '🌟 Excellent';
    if (score >= 75) return '⭐ Great';
    if (score >= 60) return '👍 Good';
    if (score >= 45) return '👌 Fair';
    return '💡 Below Average';
  };

  return (
    <div className="hr-dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-content">
          <h1>🎯 AI Matching Dashboard</h1>
          <p>Find the perfect candidates for your open positions</p>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-icon">💼</div>
            <div className="stat-content">
              <div className="stat-value">{stats.active_jobs}</div>
              <div className="stat-label">Active Jobs</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">👥</div>
            <div className="stat-content">
              <div className="stat-value">{stats.total_applications}</div>
              <div className="stat-label">Total Applications</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <div className="stat-value">{stats.avg_applications_per_job}</div>
              <div className="stat-label">Avg per Job</div>
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-icon">🔥</div>
            <div className="stat-content">
              <div className="stat-value">{topCandidates.length}</div>
              <div className="stat-label">Top Matches</div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Job Selector */}
        <div className="job-selector-section">
          <h2>Select Job Position</h2>
          <div className="job-selector">
            {jobs.map(job => (
              <div
                key={job.id}
                className={`job-card ${selectedJob?.id === job.id ? 'active' : ''}`}
                onClick={() => setSelectedJob(job)}
              >
                <div className="job-card-header">
                  <h3>{job.title}</h3>
                  <span className="application-count">
                    {job.application_count} applicants
                  </span>
                </div>
                <p className="job-company">{job.company_name}</p>
                <div className="job-meta">
                  <span>📍 {job.location}</span>
                  <span>💼 {job.employment_type.replace('_', ' ')}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Candidates List */}
        {selectedJob && (
          <div className="candidates-section">
            <div className="candidates-header">
              <h2>Top Candidates for {selectedJob.title}</h2>
              <div className="filter-controls">
                <label>
                  Min Match Score:
                  <select 
                    value={minScore} 
                    onChange={(e) => setMinScore(Number(e.target.value))}
                  >
                    <option value={90}>90%+ (Excellent)</option>
                    <option value={75}>75%+ (Great)</option>
                    <option value={60}>60%+ (Good)</option>
                    <option value={50}>50%+ (Fair)</option>
                    <option value={0}>All Scores</option>
                  </select>
                </label>
              </div>
            </div>

            {loading ? (
              <div className="loading-state">
                <div className="spinner"></div>
                <p>Loading candidates...</p>
              </div>
            ) : topCandidates.length === 0 ? (
              <div className="empty-state">
                <h3>No matching candidates found</h3>
                <p>Try lowering the minimum match score or wait for more applications.</p>
              </div>
            ) : (
              <div className="candidates-grid">
                {topCandidates.map((candidate, idx) => (
                  <div key={idx} className="candidate-card">
                    {/* Rank Badge */}
                    {idx < 3 && (
                      <div className={`rank-badge rank-${idx + 1}`}>
                        #{idx + 1}
                      </div>
                    )}

                    {/* Match Score Circle */}
                    <div className="candidate-score-section">
                      <div 
                        className="score-circle-small"
                        style={{
                          background: `conic-gradient(${getScoreColor(candidate.match_score)} ${candidate.match_score * 3.6}deg, #e0e0e0 0deg)`
                        }}
                      >
                        <div className="score-inner-small">
                          {candidate.match_score.toFixed(0)}%
                        </div>
                      </div>
                      <div className="score-badge">
                        {getScoreBadge(candidate.match_score)}
                      </div>
                    </div>

                    {/* Candidate Info */}
                    <div className="candidate-info">
                      <h3>{candidate.name}</h3>
                      <p className="candidate-email">{candidate.email}</p>
                      
                      <div className="candidate-details">
                        {candidate.location && (
                          <span>📍 {candidate.location}</span>
                        )}
                        {candidate.experience_years > 0 && (
                          <span>💼 {candidate.experience_years} years</span>
                        )}
                      </div>

                      {/* Top Skills */}
                      {candidate.skills && candidate.skills.length > 0 && (
                        <div className="candidate-skills">
                          {candidate.skills.slice(0, 5).map((skill, i) => (
                            <span key={i} className="skill-pill">{skill}</span>
                          ))}
                          {candidate.skills.length > 5 && (
                            <span className="skill-pill more">
                              +{candidate.skills.length - 5}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Application Status */}
                      <div className="application-status">
                        <span className={`status-badge status-${candidate.application_status}`}>
                          {candidate.application_status.replace('_', ' ')}
                        </span>
                        <span className="applied-date">
                          Applied {new Date(candidate.applied_at).toLocaleDateString()}
                        </span>
                      </div>

                      {/* Match Insights */}
                      {candidate.match_details && (
                        <div className="match-insights">
                          <div className="insight-item">
                            <span className="insight-label">Skills</span>
                            <span className="insight-value">
                              {candidate.match_details.skills_score?.toFixed(0)}%
                            </span>
                          </div>
                          <div className="insight-item">
                            <span className="insight-label">Experience</span>
                            <span className="insight-value">
                              {candidate.match_details.experience_score?.toFixed(0)}%
                            </span>
                          </div>
                          <div className="insight-item">
                            <span className="insight-label">Education</span>
                            <span className="insight-value">
                              {candidate.match_details.education_score?.toFixed(0)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="candidate-actions">
                      <button
                        className="action-btn view-match"
                        onClick={() => viewMatchDetails(candidate)}
                      >
                        📊 View Analysis
                      </button>
                      
                      {candidate.application_status === 'applied' && (
                        <button
                          className="action-btn shortlist"
                          onClick={() => updateApplicationStatus(
                            candidate.application_id, 
                            'shortlisted'
                          )}
                        >
                          ⭐ Shortlist
                        </button>
                      )}
                      
                      {candidate.application_status === 'shortlisted' && (
                        <button
                          className="action-btn schedule"
                          onClick={() => updateApplicationStatus(
                            candidate.application_id, 
                            'interview_scheduled'
                          )}
                        >
                          📅 Schedule Interview
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Match Details Modal */}
      {selectedMatch && (
        <div className="modal-overlay" onClick={() => setSelectedMatch(null)}>
          <div className="modal-content large" onClick={(e) => e.stopPropagation()}>
            <MatchResults
              candidateId={selectedMatch.candidateId}
              jobId={selectedMatch.jobId}
              onClose={() => setSelectedMatch(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default HRDashboard;