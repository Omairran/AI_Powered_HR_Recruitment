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
  const [statistics, setStatistics] = useState({ total_candidates: 0, total_matches: 0 });

  // Define functions before useEffect
  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/');
      setJobs(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      // Don't crash, just show empty
      setJobs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const response = await api.get('/matching/statistics/');
      setStatistics(response.data || { total_candidates: 0, total_matches: 0 });
    } catch (error) {
      console.error('Error fetching statistics:', error);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchStatistics();
  }, []);

  const fetchApplications = async (jobId) => {
    setLoadingApplications(true);
    try {
      const response = await api.get(
        `/matching/top-candidates/${jobId}/?min_score=0&limit=100`
      );
      setApplications(response.data.candidates || []);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  const handleJobSelect = (job) => {
    setSelectedJob(job);
    fetchApplications(job.id);
  };

  const handleBackToJobs = () => {
    setSelectedJob(null);
    setApplications([]);
  };

  const handleViewMatch = (application) => {
    setSelectedMatch({
      matchData: application.match_details,
      candidate: application.candidate,
      job: selectedJob,
      applicationId: application.application_id
    });
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

  const getMatchBadgeClass = (score) => {
    if (score >= 90) return 'badge-excellent';
    if (score >= 75) return 'badge-great';
    if (score >= 60) return 'badge-good';
    if (score >= 45) return 'badge-fair';
    return 'badge-poor';
  };

  // Helper: Ensure skills is always an array
  const parseSkills = (skills) => {
    if (!skills) return [];
    if (Array.isArray(skills)) return skills;
    if (typeof skills === 'string') {
      // Try to parse JSON if it looks like a list
      try {
        if (skills.startsWith('[')) return JSON.parse(skills);
      } catch (e) { /* ignore */ }
      // Fallback: split by comma
      return skills.split(',').map(s => s.trim());
    }
    return [];
  };

  // Add a safety check for rendering
  if (loading) {
    return (
      <div className="hr-dashboard-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loading-state">
          <div className="spinner"></div>
          <p style={{ marginTop: '15px' }}>Loading Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="hr-dashboard-container">
      {/* Header */}
      <div className="dashboard-header">
        <div className="header-left">
          <h2>
            <span className="icon">💼</span>
            {selectedJob ? `${selectedJob.title} Candidates` : 'Recruitment Dashboard'}
          </h2>
          <p>
            {selectedJob
              ? 'Review and manage applications for this role'
              : `Welcome back! Manage your hiring pipeline.`}
          </p>
        </div>

        {selectedJob && (
          <button className="btn-secondary" onClick={handleBackToJobs}>
            ← Back to All Jobs
          </button>
        )}
      </div>

      {selectedMatch && (
        <MatchResults
          matchData={selectedMatch.matchData}
          candidate={selectedMatch.candidate}
          job={selectedMatch.job}
          onClose={() => setSelectedMatch(null)}
          onStatusUpdate={async (newStatus) => {
            try {
              await api.patch(`/job-applications/${selectedMatch.applicationId}/update_status/`, {
                status: newStatus
              });
              // Refresh applications
              fetchApplications(selectedJob.id);
              // Close modal or show success? Let's close for now
              setSelectedMatch(null);
              // Refresh stats too
              fetchStatistics();
            } catch (error) {
              console.error("Failed to update status:", error);
              alert("Failed to update status");
            }
          }}
        />
      )}

      {/* Main Content */}
      <div className="dashboard-main fade-in">

        {/* VIEW 1: JOB GRID */}
        {!selectedJob && (
          <>
            {/* Stats Overview */}
            <div className="stats-overview">
              <div className="stat-card">
                <div className="stat-icon">📊</div>
                <div className="stat-info">
                  <h3>Total Jobs</h3>
                  <p>{jobs.length}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-info">
                  <h3>Total Candidates</h3>
                  <p>{statistics?.total_candidates || 0}</p>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⚡</div>
                <div className="stat-info">
                  <h3>Active Matches</h3>
                  <p>{statistics?.total_matches || 0}</p>
                </div>
              </div>
            </div>

            <div className="jobs-section">
              <div className="section-header">
                <h3>Active Job Openings</h3>
              </div>

              <div className="jobs-grid">
                {jobs.length > 0 ? (
                  jobs.map(job => {
                    const skills = parseSkills(job.skills_required);
                    return (
                      <div className="job-card" key={job.id} onClick={() => handleJobSelect(job)}>
                        <div className="job-card-header">
                          <h4>{job.title}</h4>
                          <span className="job-type">{job.employment_type || 'Full Time'}</span>
                        </div>
                        <div className="job-card-body">
                          <p className="job-company">{job.company || 'Tech Inc.'}</p>
                          <p className="job-location">📍 {job.location || 'Remote'}</p>
                          <div className="job-tags">
                            {skills.slice(0, 3).map((skill, i) => (
                              <span key={i} className="job-tag">{skill}</span>
                            ))}
                            {(skills.length > 3) && <span className="job-tag">+{skills.length - 3}</span>}
                          </div>
                        </div>
                        <div className="job-card-footer">
                          <span>📅 Posted {new Date(job.created_at).toLocaleDateString()}</span>
                          <span className="view-link">View Candidates →</span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="empty-state">
                    <p>No active jobs found. Post a job to get started!</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* VIEW 2: CANDIDATE TABLE (Full Width) */}
        {selectedJob && (
          <div className="candidates-section fade-in">
            <div className="filters-bar">
              <div className="filter-group">
                <label>Filter by Match Score:</label>
                <select
                  value={filterScore}
                  onChange={(e) => setFilterScore(e.target.value)}
                  className="filter-select"
                >
                  <option value="all">All Candidates</option>
                  <option value="excellent">Excellent (90-100%)</option>
                  <option value="great">Great (75-89%)</option>
                  <option value="good">Good (60-74%)</option>
                  <option value="fair">Fair (45-59%)</option>
                  <option value="poor">Poor (0-44%)</option>
                </select>
              </div>
              <div className="results-count">
                Showing {getFilteredApplications().length} candidates
              </div>
            </div>

            {loadingApplications ? (
              <div className="loading-state">
                <div className="spinner"></div> Creating AI Matches...
              </div>
            ) : (
              <div className="candidates-table-container">
                <table className="candidates-table">
                  <thead>
                    <tr>
                      <th>Candidate</th>
                      <th>Experience</th>
                      <th>Match Score</th>
                      <th>Top Skills</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredApplications().map((app) => (
                      <tr key={app.application_id}>
                        <td>
                          <div className="candidate-cell">
                            <div className="avatar">
                              {app.candidate.name.charAt(0)}
                            </div>
                            <div className="candidate-info">
                              <span className="name">{app.candidate.name}</span>
                              <span className="email">{app.candidate.email}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {app.candidate.parsed_experience_years ?
                            `${app.candidate.parsed_experience_years} Years` : 'N/A'}
                        </td>
                        <td>
                          <div className={`match-badge ${getMatchBadgeClass(app.match_score)}`}>
                            {app.match_score.toFixed(1)}%
                          </div>
                        </td>
                        <td>
                          <div className="skills-cell">
                            {app.match_details?.matched_skills?.slice(0, 2).map((skill, i) => (
                              <span key={i} className="mini-tag">{skill}</span>
                            ))}
                            {(app.match_details?.matched_skills?.length > 2) && (
                              <span className="mini-tag count">+{app.match_details.matched_skills.length - 2}</span>
                            )}
                          </div>
                        </td>
                        <td>
                          <span className={`status-badge ${app.status?.toLowerCase() || 'pending'}`}>
                            {app.status || 'Pending'}
                          </span>
                        </td>
                        <td>
                          <button
                            className="btn-view-match"
                            onClick={() => handleViewMatch(app)}
                          >
                            📊 View Analysis
                          </button>
                        </td>
                      </tr>
                    ))}
                    {getFilteredApplications().length === 0 && (
                      <tr>
                        <td colSpan="6" className="empty-state">
                          No candidates found matching criteria.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default HRDashboard;