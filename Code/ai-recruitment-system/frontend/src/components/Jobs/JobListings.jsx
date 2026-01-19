import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './JobListings.css';

const JobListings = ({ onApply }) => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState(null);
  const [filters, setFilters] = useState({
    job_type: '',
    experience_level: '',
    location: '',
    search: ''
  });

  const fetchJobs = async () => {
    try {
      const response = await api.get('/jobs/');
      setJobs(Array.isArray(response.data) ? response.data.filter(job => job.status === 'active') : []);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value
    });
  };

  const filteredJobs = jobs.filter(job => {
    const matchesType = !filters.job_type || job.job_type === filters.job_type;
    const matchesLevel = !filters.experience_level || job.experience_level === filters.experience_level;
    const matchesLocation = !filters.location || job.location.toLowerCase().includes(filters.location.toLowerCase());
    const matchesSearch = !filters.search ||
      job.title.toLowerCase().includes(filters.search.toLowerCase()) ||
      job.company.toLowerCase().includes(filters.search.toLowerCase());

    return matchesType && matchesLevel && matchesLocation && matchesSearch;
  });

  const formatSalary = (min, max) => {
    if (!min && !max) return 'Competitive';
    if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()}`;
    if (min) return `$${min.toLocaleString()}+`;
    return 'Negotiable';
  };

  const getExperienceLabel = (level) => {
    const labels = {
      'entry': 'Entry Level',
      'mid': 'Mid Level',
      'senior': 'Senior Level',
      'lead': 'Lead/Principal'
    };
    return labels[level] || level;
  };

  const getJobTypeLabel = (type) => {
    const labels = {
      'full-time': 'Full-time',
      'part-time': 'Part-time',
      'contract': 'Contract',
      'internship': 'Internship'
    };
    return labels[type] || type;
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

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading jobs...</p>
      </div>
    );
  }

  return (
    <div className="job-listings-container">
      <div className="listings-header">
        <h2>🔍 Browse Available Jobs</h2>
        <p>Find your perfect match from {jobs.length} active positions</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="search-box">
          <input
            type="text"
            name="search"
            placeholder="🔎 Search by job title or company..."
            value={filters.search}
            onChange={handleFilterChange}
          />
        </div>

        <div className="filter-row">
          <select name="job_type" value={filters.job_type} onChange={handleFilterChange}>
            <option value="">All Job Types</option>
            <option value="full-time">Full-time</option>
            <option value="part-time">Part-time</option>
            <option value="contract">Contract</option>
            <option value="internship">Internship</option>
          </select>

          <select name="experience_level" value={filters.experience_level} onChange={handleFilterChange}>
            <option value="">All Experience Levels</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="lead">Lead/Principal</option>
          </select>

          <input
            type="text"
            name="location"
            placeholder="Location"
            value={filters.location}
            onChange={handleFilterChange}
          />
        </div>

        {(filters.job_type || filters.experience_level || filters.location || filters.search) && (
          <button
            className="clear-filters"
            onClick={() => setFilters({ job_type: '', experience_level: '', location: '', search: '' })}
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Results Count */}
      <div className="results-info">
        Showing {filteredJobs.length} of {jobs.length} jobs
      </div>

      {/* Job Cards */}
      <div className="jobs-grid">
        {filteredJobs.map(job => {
          const parsedSkills = parseSkills(job.parsed_required_skills || job.skills_required);
          return (
            <div key={job.id} className="job-card" onClick={() => setSelectedJob(job)}>
              <div className="job-card-header">
                <div>
                  <h3>{job.title}</h3>
                  <p className="company">{job.company}</p>
                </div>
                {job.is_remote && <span className="remote-badge">🌐 Remote</span>}
              </div>

              <div className="job-meta">
                <span className="meta-item">
                  📍 {job.location}
                </span>
                <span className="meta-item">
                  💼 {getJobTypeLabel(job.job_type)}
                </span>
                <span className="meta-item">
                  📊 {getExperienceLabel(job.experience_level)}
                </span>
              </div>

              <div className="job-salary">
                💰 {formatSalary(job.salary_min, job.salary_max)}
              </div>

              <div className="job-skills">
                {parsedSkills.slice(0, 5).map((skill, idx) => (
                  <span key={idx} className="skill-tag">{skill}</span>
                ))}
                {parsedSkills.length > 5 && (
                  <span className="skill-tag more">+{parsedSkills.length - 5} more</span>
                )}
              </div>

              <button
                className="view-details-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  onApply(job.id);
                }}
              >
                Apply Now →
              </button>
            </div>
          );
        })}
      </div>

      {filteredJobs.length === 0 && (
        <div className="no-results">
          <p>😔 No jobs found matching your criteria</p>
          <button onClick={() => setFilters({ job_type: '', experience_level: '', location: '', search: '' })}>
            Clear Filters
          </button>
        </div>
      )}

      {/* Job Details Modal */}
      {selectedJob && (
        <div className="modal-overlay" onClick={() => setSelectedJob(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-modal" onClick={() => setSelectedJob(null)}>
              ✕
            </button>

            <div className="modal-header">
              <h2>{selectedJob.title}</h2>
              <p className="modal-company">{selectedJob.company}</p>
            </div>

            <div className="modal-meta">
              <span>📍 {selectedJob.location}</span>
              <span>💼 {getJobTypeLabel(selectedJob.job_type)}</span>
              <span>📊 {getExperienceLabel(selectedJob.experience_level)}</span>
              {selectedJob.is_remote && <span>🌐 Remote</span>}
            </div>

            <div className="modal-salary">
              <strong>Salary:</strong> {formatSalary(selectedJob.salary_min, selectedJob.salary_max)}
            </div>

            <div className="modal-section">
              <h3>📝 Description</h3>
              <p>{selectedJob.description}</p>
            </div>

            {selectedJob.parsed_required_skills && selectedJob.parsed_required_skills.length > 0 && (
              <div className="modal-section">
                <h3>🔧 Required Skills</h3>
                <div className="skills-list">
                  {parseSkills(selectedJob.parsed_required_skills).map((skill, idx) => (
                    <span key={idx} className="skill-tag-large">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedJob.parsed_preferred_skills && selectedJob.parsed_preferred_skills.length > 0 && (
              <div className="modal-section">
                <h3>⭐ Preferred Skills</h3>
                <div className="skills-list">
                  {parseSkills(selectedJob.parsed_preferred_skills).map((skill, idx) => (
                    <span key={idx} className="skill-tag-large preferred">{skill}</span>
                  ))}
                </div>
              </div>
            )}

            {selectedJob.requirements && (
              <div className="modal-section">
                <h3>📋 Requirements</h3>
                <p className="preserve-whitespace">{selectedJob.requirements}</p>
              </div>
            )}

            {selectedJob.responsibilities && (
              <div className="modal-section">
                <h3>💼 Responsibilities</h3>
                <p className="preserve-whitespace">{selectedJob.responsibilities}</p>
              </div>
            )}

            {selectedJob.benefits && (
              <div className="modal-section">
                <h3>🎁 Benefits</h3>
                <p className="preserve-whitespace">{selectedJob.benefits}</p>
              </div>
            )}

            <div className="modal-actions">
              <button
                className="apply-btn"
                onClick={() => onApply(selectedJob.id)}
              >
                Apply for this Position
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobListings;