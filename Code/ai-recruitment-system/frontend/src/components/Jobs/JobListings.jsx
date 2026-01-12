import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './JobListings.css';

const JobListings = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    search: '',
    employment_type: '',
    is_remote: '',
    location: '',
    status: 'active'
  });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchJobs();
  }, [filters]);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      
      // Build query parameters
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          params.append(key, filters[key]);
        }
      });
      
      const response = await axios.get(`${API_URL}/jobs/?${params.toString()}`);
      setJobs(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching jobs:', err);
      setError('Failed to load jobs. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      employment_type: '',
      is_remote: '',
      location: '',
      status: 'active'
    });
  };

  const viewJobDetails = async (jobId) => {
    try {
      const response = await axios.get(`${API_URL}/jobs/${jobId}/`);
      setSelectedJob(response.data);
    } catch (err) {
      console.error('Error fetching job details:', err);
      alert('Failed to load job details');
    }
  };

  const applyToJob = (job) => {
    setSelectedJob(job);
    setShowApplicationModal(true);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'No deadline';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading) {
    return (
      <div className="job-listings-container">
        <div className="loading">
          <div className="spinner"></div>
          <p>Loading jobs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="job-listings-container">
      <header className="listings-header">
        <h1>🚀 Available Positions</h1>
        <p>Find your dream job from {jobs.length} available positions</p>
      </header>

      {/* Filters Section */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            name="search"
            placeholder="Search jobs, companies..."
            value={filters.search}
            onChange={handleFilterChange}
            className="filter-input search-input"
          />
        </div>

        <div className="filter-group">
          <select
            name="employment_type"
            value={filters.employment_type}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Types</option>
            <option value="full_time">Full-time</option>
            <option value="part_time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
            <option value="temporary">Temporary</option>
          </select>
        </div>

        <div className="filter-group">
          <select
            name="is_remote"
            value={filters.is_remote}
            onChange={handleFilterChange}
            className="filter-select"
          >
            <option value="">All Locations</option>
            <option value="true">Remote Only</option>
            <option value="false">On-site Only</option>
          </select>
        </div>

        <div className="filter-group">
          <input
            type="text"
            name="location"
            placeholder="Location..."
            value={filters.location}
            onChange={handleFilterChange}
            className="filter-input"
          />
        </div>

        <button onClick={clearFilters} className="clear-filters-btn">
          Clear Filters
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          {error}
        </div>
      )}

      {/* Jobs Grid */}
      <div className="jobs-grid">
        {jobs.length === 0 ? (
          <div className="no-jobs">
            <h3>No jobs found</h3>
            <p>Try adjusting your filters or check back later!</p>
          </div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="job-card">
              <div className="job-card-header">
                <div className="job-title-section">
                  <h3>{job.title}</h3>
                  <p className="company-name">{job.company_name}</p>
                </div>
                <div className="job-badges">
                  {job.is_remote && (
                    <span className="badge badge-remote">🌍 Remote</span>
                  )}
                  <span className="badge badge-type">
                    {job.employment_type.replace('_', ' ')}
                  </span>
                </div>
              </div>

              <div className="job-meta">
                <div className="meta-item">
                  <span className="meta-icon">📍</span>
                  <span>{job.location}</span>
                </div>
                <div className="meta-item">
                  <span className="meta-icon">💼</span>
                  <span>{job.experience_range_display}</span>
                </div>
                {job.salary_range_display !== 'Not specified' && (
                  <div className="meta-item">
                    <span className="meta-icon">💰</span>
                    <span>{job.salary_range_display}</span>
                  </div>
                )}
              </div>

              <div className="job-stats">
                <span className="stat-item">
                  👁️ {job.view_count} views
                </span>
                <span className="stat-item">
                  📝 {job.application_count} applicants
                </span>
              </div>

              {job.application_deadline && (
                <div className="deadline">
                  ⏰ Deadline: {formatDate(job.application_deadline)}
                </div>
              )}

              <div className="job-actions">
                <button 
                  onClick={() => viewJobDetails(job.id)}
                  className="btn-secondary"
                >
                  View Details
                </button>
                <button 
                  onClick={() => applyToJob(job)}
                  className="btn-primary"
                  disabled={!job.is_active}
                >
                  {job.is_active ? 'Apply Now' : 'Position Closed'}
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Job Details Modal */}
      {selectedJob && !showApplicationModal && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedJob(null)}>
              ×
            </button>
            
            <div className="job-details">
              <h2>{selectedJob.title}</h2>
              <h3>{selectedJob.company_name}</h3>
              
              <div className="job-details-meta">
                <span>📍 {selectedJob.location}</span>
                <span>💼 {selectedJob.experience_range_display}</span>
                <span>🏢 {selectedJob.employment_type.replace('_', ' ')}</span>
                {selectedJob.is_remote && <span>🌍 Remote</span>}
              </div>

              {selectedJob.salary_range_display !== 'Not specified' && (
                <div className="salary-info">
                  <strong>💰 Salary:</strong> {selectedJob.salary_range_display}
                </div>
              )}

              <div className="job-section">
                <h4>Job Description</h4>
                <p>{selectedJob.description}</p>
              </div>

              {selectedJob.parsed_required_skills && selectedJob.parsed_required_skills.length > 0 && (
                <div className="job-section">
                  <h4>Required Skills</h4>
                  <div className="skills-tags">
                    {selectedJob.parsed_required_skills.map((skill, idx) => (
                      <span key={idx} className="skill-tag">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.parsed_preferred_skills && selectedJob.parsed_preferred_skills.length > 0 && (
                <div className="job-section">
                  <h4>Preferred Skills</h4>
                  <div className="skills-tags">
                    {selectedJob.parsed_preferred_skills.map((skill, idx) => (
                      <span key={idx} className="skill-tag skill-tag-preferred">{skill}</span>
                    ))}
                  </div>
                </div>
              )}

              {selectedJob.parsed_responsibilities && selectedJob.parsed_responsibilities.length > 0 && (
                <div className="job-section">
                  <h4>Responsibilities</h4>
                  <ul>
                    {selectedJob.parsed_responsibilities.map((resp, idx) => (
                      <li key={idx}>{resp}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedJob.parsed_qualifications && selectedJob.parsed_qualifications.length > 0 && (
                <div className="job-section">
                  <h4>Qualifications</h4>
                  <ul>
                    {selectedJob.parsed_qualifications.map((qual, idx) => (
                      <li key={idx}>{qual}</li>
                    ))}
                  </ul>
                </div>
              )}

              {selectedJob.parsed_benefits && selectedJob.parsed_benefits.length > 0 && (
                <div className="job-section">
                  <h4>Benefits</h4>
                  <div className="benefits-tags">
                    {selectedJob.parsed_benefits.map((benefit, idx) => (
                      <span key={idx} className="benefit-tag">{benefit}</span>
                    ))}
                  </div>
                </div>
              )}

              <div className="modal-actions">
                <button 
                  onClick={() => {
                    setShowApplicationModal(true);
                  }}
                  className="btn-primary btn-large"
                  disabled={!selectedJob.is_active}
                >
                  {selectedJob.is_active ? 'Apply for this Position' : 'Position Closed'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Application Modal */}
      {showApplicationModal && (
        <div className="modal-overlay" onClick={() => setShowApplicationModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowApplicationModal(false)}>
              ×
            </button>
            
            <div className="application-info">
              <h2>Apply to {selectedJob.title}</h2>
              <p>To complete your application, please:</p>
              <ol>
                <li>Go to the Candidate Application page</li>
                <li>Submit your resume and details</li>
                <li>Your profile will be automatically matched with this position</li>
              </ol>
              
              <div className="info-note">
                <strong>Note:</strong> Module 3 (AI Matching) will automatically calculate 
                your compatibility score with this position once you submit your application.
              </div>

              <button 
                onClick={() => window.location.href = '/apply'}
                className="btn-primary btn-large"
              >
                Go to Application Page
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobListings;