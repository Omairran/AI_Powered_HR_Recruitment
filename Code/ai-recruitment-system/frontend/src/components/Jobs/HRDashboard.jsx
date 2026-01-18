import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import MatchResults from './MatchResults';
import './HRDashboard.css';

const HRDashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [filterScore, setFilterScore] = useState('all');
  const [statistics, setStatistics] = useState(null);

  useEffect(() => {
    fetchJobs();
    fetchStatistics();
  }, []);

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/');
      setJobs(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/matching/statistics/');
      setStatistics(response.data);
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  const fetchApplications = async (jobId) => {
    setLoadingApplications(true);
    try {
      const response = await api.get(
        `/matching/top-candidates/${jobId}/?min_score=0&limit=100`
      );
      setApplications(response.data.candidates || []);
      setLoadingApplications(false);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setLoadingApplications(false);
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    fetchApplications(job.id);
  };

  const handleViewMatch = (application) => {
    setSelectedMatch({
      matchData: application.match_details,
      candidate: application.candidate,
      job: selectedJob
    });
  };

  const updateApplicationStatus = async (applicationId, newStatus) => {
    try {
      await api.patch(
        `/job-applications/${applicationId}/`,
        { status: newStatus }
      );

      // Refresh applications
      if (selectedJob) {
        fetchApplications(selectedJob.id);
      }
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const getFilteredApplications = () => {
    if (filterScore === 'all') return applications;

    const ranges = {
      'excellent': [90, 100],
      'great': [75, 89],
      'good': [60, 74],
      'fair': [45, 59],
      'poor': [0, 44]
    };

    const [min, max] = ranges[filterScore];
    return applications.filter(app =>
      app.match_score >= min && app.match_score <= max
    );
  };

  const getMatchLevelBadge = (score) => {
    if (score >= 90) return { text: 'Excellent', class: 'excellent', emoji: '🌟' };
    if (score >= 75) return { text: 'Great', class: 'great', emoji: '⭐' };
    if (score >= 60) return { text: 'Good', class: 'good', emoji: '👍' };
    if (score >= 45) return { text: 'Fair', class: 'fair', emoji: '👌' };
    return { text: 'Poor', class: 'poor', emoji: '💡' };
  };

  const getStatusBadge = (status) => {
    const badges = {
      'applied': { text: 'Applied', class: 'status-applied' },
      'reviewing': { text: 'Reviewing', class: 'status-reviewing' },
      'shortlisted': { text: 'Shortlisted', class: 'status-shortlisted' },
      'interviewed': { text: 'Interviewed', class: 'status-interviewed' },
      'offered': { text: 'Offered', class: 'status-offered' },
      'hired': { text: 'Hired', class: 'status-hired' },
      'rejected': { text: 'Rejected', class: 'status-rejected' }
    };
    return badges[status] || { text: status, class: 'status-default' };
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="hr-dashboard-container">
      <div className="dashboard-header">
        <h2>🎯 HR Dashboard</h2>
        <p>Manage job postings and review candidate matches</p>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-icon">📊</div>
            <div className="stat-content">
              <h4>Total Applications</h4>
              <p className="stat-number">{statistics.total_applications}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">✅</div>
            <div className="stat-content">
              <h4>Matched</h4>
              <p className="stat-number">{statistics.matched_applications}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">🌟</div>
            <div className="stat-content">
              <h4>Excellent Matches</h4>
              <p className="stat-number">{statistics.match_distribution?.excellent || 0}</p>
            </div>
          </div>

          <div className="stat-card">
            <div className="stat-icon">⭐</div>
            <div className="stat-content">
              <h4>Great Matches</h4>
              <p className="stat-number">{statistics.match_distribution?.great || 0}</p>
            </div>
          </div>
        </div>
      )}

      <div className="dashboard-content">
        {/* Jobs List */}
        <div className="jobs-panel">
          <h3>📋 Your Job Postings ({jobs.length})</h3>

          <div className="jobs-list">
            {jobs.map(job => (
              <div
                key={job.id}
                className={`job-item ${selectedJob?.id === job.id ? 'active' : ''}`}
                onClick={() => handleJobSelect(job)}
              >
                <div className="job-item-header">
                  <h4>{job.title}</h4>
                  <span className={`status-badge status-${job.status}`}>
                    {job.status}
                  </span>
                </div>
                <p className="job-company">{job.company}</p>
                <p className="job-location">📍 {job.location}</p>
                <div className="job-meta">
                  <span>💼 {job.job_type}</span>
                  <span>📊 {job.experience_level}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Applications Panel */}
        <div className="applications-panel">
          {!selectedJob ? (
            <div className="empty-state">
              <p>👈 Select a job to view applications</p>
            </div>
          ) : (
            <>
              <div className="panel-header">
                <div>
                  <h3>👥 Candidates for: {selectedJob.title}</h3>
                  <p>{applications.length} applications</p>
                </div>

                <div className="filter-controls">
                  <select
                    value={filterScore}
                    onChange={(e) => setFilterScore(e.target.value)}
                    className="filter-select"
                  >
                    <option value="all">All Matches</option>
                    <option value="excellent">90%+ (Excellent)</option>
                    <option value="great">75%+ (Great)</option>
                    <option value="good">60%+ (Good)</option>
                    <option value="fair">45%+ (Fair)</option>
                    <option value="poor">Below 45% (Poor)</option>
                  </select>
                </div>
              </div>

              {loadingApplications ? (
                <div className="loading-container">
                  <div className="spinner"></div>
                  <p>Loading candidates...</p>
                </div>
              ) : (
                <div className="applications-list">
                  {getFilteredApplications().length === 0 ? (
                    <div className="empty-state">
                      <p>No applications found for this filter</p>
                    </div>
                  ) : (
                    getFilteredApplications().map(app => {
                      const matchBadge = getMatchLevelBadge(app.match_score);
                      const statusBadge = getStatusBadge(app.status);

                      return (
                        <div key={app.application_id} className="application-card">
                          <div className="app-header">
                            <div className="candidate-info">
                              <h4>{app.candidate.name}</h4>
                              <p>{app.candidate.email}</p>
                            </div>

                            <div className="match-score-badge" data-level={matchBadge.class}>
                              <span className="score-emoji">{matchBadge.emoji}</span>
                              <span className="score-text">{app.match_score?.toFixed(1)}%</span>
                            </div>
                          </div>

                          {app.match_details && (
                            <div className="quick-stats">
                              <div className="quick-stat">
                                <span className="stat-label">Skills</span>
                                <span className="stat-value">{app.match_details.skills_score?.toFixed(0)}%</span>
                              </div>
                              <div className="quick-stat">
                                <span className="stat-label">Experience</span>
                                <span className="stat-value">{app.match_details.experience_score?.toFixed(0)}%</span>
                              </div>
                              <div className="quick-stat">
                                <span className="stat-label">Education</span>
                                <span className="stat-value">{app.match_details.education_score?.toFixed(0)}%</span>
                              </div>
                            </div>
                          )}

                          <div className="app-meta">
                            <span className={`status-badge ${statusBadge.class}`}>
                              {statusBadge.text}
                            </span>
                            <span className="applied-date">
                              Applied: {new Date(app.applied_at).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="app-actions">
                            <button
                              className="btn-view-analysis"
                              onClick={() => handleViewMatch(app)}
                            >
                              📊 View Analysis
                            </button>

                            {app.status === 'applied' && (
                              <button
                                className="btn-shortlist"
                                onClick={() => updateApplicationStatus(app.application_id, 'shortlisted')}
                              >
                                ⭐ Shortlist
                              </button>
                            )}

                            {app.status === 'shortlisted' && (
                              <button
                                className="btn-interview"
                                onClick={() => updateApplicationStatus(app.application_id, 'interviewed')}
                              >
                                📅 Interview
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Match Results Modal */}
      {selectedMatch && (
        <MatchResults
          matchData={selectedMatch.matchData}
          candidate={selectedMatch.candidate}
          job={selectedMatch.job}
          onClose={() => setSelectedMatch(null)}
        />
      )}
    </div>
  );
};

export default HRDashboard;