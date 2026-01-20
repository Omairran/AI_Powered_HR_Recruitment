import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import './JobPostingForm.css';

const JobPostingForm = ({ onJobCreated, initialData = null, onCancel = null }) => {
  const [formData, setFormData] = useState({
    title: '',
    company: '',
    location: '',
    job_type: 'full-time',
    experience_level: 'mid',
    salary_min: '',
    salary_max: '',
    description: '',
    requirements: '',
    responsibilities: '',
    benefits: '',
    skills_required: '',
    skills_preferred: '',
    min_experience: '',
    max_experience: '',
    education_level: '',
    is_remote: false,
    application_deadline: '',
    status: 'active'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (initialData) {
      setFormData({
        ...initialData,
        // Ensure arrays handling if needed, though API returns strings for some
        salary_min: initialData.salary_min || '',
        salary_max: initialData.salary_max || '',
        min_experience: initialData.min_experience || '',
        max_experience: initialData.max_experience || '',
        application_deadline: initialData.application_deadline || '',
        skills_required: initialData.skills_required || '',
        skills_preferred: initialData.skills_preferred || '',
        status: initialData.status || 'active'
      });
    }
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e, forcedStatus = null) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    // Prepare payload with proper types
    const payload = { ...formData };

    if (forcedStatus) {
      payload.status = forcedStatus;
    }

    // Convert empty strings to null for numeric and optional date fields
    const nullableFields = ['salary_min', 'salary_max', 'min_experience', 'max_experience', 'application_deadline'];
    nullableFields.forEach(field => {
      if (payload[field] === '') {
        payload[field] = null;
      }
    });

    try {
      let response;
      if (initialData && initialData.id) {
        // Update existing job
        response = await api.put(`/jobs/${initialData.id}/`, payload);
        setMessage({
          text: '✅ Job updated successfully!',
          type: 'success'
        });
      } else {
        // Create new job
        response = await api.post('/jobs/', payload);
        setMessage({
          text: '✅ Job posted successfully!',
          type: 'success'
        });
      }

      if (!initialData) {
        // Reset form only if creating new
        setFormData({
          title: '',
          company: '',
          location: '',
          job_type: 'full-time',
          experience_level: 'mid',
          salary_min: '',
          salary_max: '',
          description: '',
          requirements: '',
          responsibilities: '',
          benefits: '',
          skills_required: '',
          skills_preferred: '',
          min_experience: '',
          max_experience: '',
          education_level: '',
          is_remote: false,
          application_deadline: '',
          status: 'active'
        });
      }

      if (onJobCreated) {
        onJobCreated(response.data);
      }

    } catch (error) {
      console.error('Error saving job:', error);
      const errorMessage = error.response?.data?.error ||
        error.response?.data?.message ||
        'Error saving job. Please try again.';

      setMessage({
        text: `❌ ${errorMessage}`,
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="job-posting-container">
      <div className="job-posting-header">
        <h2>{initialData ? '✏️ Edit Job' : '📋 Post a New Job'}</h2>
        <p>{initialData ? 'Update job details below' : 'Fill in the details below to create a job posting'}</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form className="job-posting-form">
        {/* Basic Information */}
        <div className="form-section">
          <h3>Basic Information</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Job Title *</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g., Senior Full Stack Developer"
                required
              />
            </div>

            <div className="form-group">
              <label>Company Name *</label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="e.g., Tech Corp Inc."
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Location *</label>
              <input
                type="text"
                name="location"
                value={formData.location}
                onChange={handleChange}
                placeholder="e.g., Lahore, Pakistan"
                required
              />
            </div>

            <div className="form-group">
              <label>Job Type *</label>
              <select
                name="job_type"
                value={formData.job_type}
                onChange={handleChange}
                required
              >
                <option value="full-time">Full-time</option>
                <option value="part-time">Part-time</option>
                <option value="contract">Contract</option>
                <option value="internship">Internship</option>
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Experience Level *</label>
              <select
                name="experience_level"
                value={formData.experience_level}
                onChange={handleChange}
                required
              >
                <option value="entry">Entry Level</option>
                <option value="mid">Mid Level</option>
                <option value="senior">Senior Level</option>
                <option value="lead">Lead/Principal</option>
              </select>
            </div>

            <div className="form-group checkbox-group">
              <label>
                <input
                  type="checkbox"
                  name="is_remote"
                  checked={formData.is_remote}
                  onChange={handleChange}
                />
                <span>Remote Position</span>
              </label>
            </div>
          </div>
        </div>

        {/* Salary Information */}
        <div className="form-section">
          <h3>Salary Range</h3>

          <div className="form-row">
            <div className="form-group">
              <label>Minimum Salary</label>
              <input
                type="number"
                name="salary_min"
                value={formData.salary_min}
                onChange={handleChange}
                placeholder="e.g., 50000"
              />
            </div>

            <div className="form-group">
              <label>Maximum Salary</label>
              <input
                type="number"
                name="salary_max"
                value={formData.salary_max}
                onChange={handleChange}
                placeholder="e.g., 80000"
              />
            </div>
          </div>
        </div>

        {/* Job Details */}
        <div className="form-section">
          <h3>Job Details</h3>

          <div className="form-group">
            <label>Job Description *</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Provide a detailed description of the position..."
              rows="5"
              required
            />
          </div>

          <div className="form-group">
            <label>Requirements *</label>
            <textarea
              name="requirements"
              value={formData.requirements}
              onChange={handleChange}
              placeholder="List the job requirements (one per line)..."
              rows="5"
              required
            />
          </div>

          <div className="form-group">
            <label>Responsibilities *</label>
            <textarea
              name="responsibilities"
              value={formData.responsibilities}
              onChange={handleChange}
              placeholder="List the key responsibilities (one per line)..."
              rows="5"
              required
            />
          </div>

          <div className="form-group">
            <label>Benefits</label>
            <textarea
              name="benefits"
              value={formData.benefits}
              onChange={handleChange}
              placeholder="List the benefits offered (one per line)..."
              rows="4"
            />
          </div>
        </div>

        {/* Skills & Requirements */}
        <div className="form-section">
          <h3>Skills & Qualifications</h3>

          <div className="form-group">
            <label>Required Skills *</label>
            <input
              type="text"
              name="skills_required"
              value={formData.skills_required}
              onChange={handleChange}
              placeholder="e.g., Python, Django, React, PostgreSQL (comma-separated)"
              required
            />
            <small>Separate skills with commas</small>
          </div>

          <div className="form-group">
            <label>Preferred Skills</label>
            <input
              type="text"
              name="skills_preferred"
              value={formData.skills_preferred}
              onChange={handleChange}
              placeholder="e.g., Docker, Kubernetes, AWS (comma-separated)"
            />
            <small>Separate skills with commas</small>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Minimum Experience (years) *</label>
              <input
                type="number"
                name="min_experience"
                value={formData.min_experience}
                onChange={handleChange}
                placeholder="e.g., 3"
                required
              />
            </div>

            <div className="form-group">
              <label>Maximum Experience (years)</label>
              <input
                type="number"
                name="max_experience"
                value={formData.max_experience}
                onChange={handleChange}
                placeholder="e.g., 7"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Education Level *</label>
            <select
              name="education_level"
              value={formData.education_level}
              onChange={handleChange}
              required
            >
              <option value="">Select education level</option>
              <option value="high school">High School</option>
              <option value="diploma">Diploma</option>
              <option value="bachelor">Bachelor's Degree</option>
              <option value="master">Master's Degree</option>
              <option value="phd">PhD/Doctorate</option>
            </select>
          </div>

          <div className="form-group">
            <label>Application Deadline</label>
            <input
              type="date"
              name="application_deadline"
              value={formData.application_deadline}
              onChange={handleChange}
            />
          </div>
        </div>

        {/* Submit Buttons */}
        <div className="form-actions" style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          {onCancel && (
            <button
              type="button"
              className="btn-secondary"
              onClick={onCancel}
              disabled={loading}
            >
              Cancel
            </button>
          )}

          <button
            type="button"
            className="btn-secondary"
            onClick={(e) => handleSubmit(e, 'draft')}
            disabled={loading}
          >
            💾 Save as Draft
          </button>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
            onClick={(e) => handleSubmit(e, 'active')}
          >
            {loading ? (initialData ? '⏳ Updating...' : '⏳ Posting...') : (initialData ? '✅ Update Job' : '✅ Post Job')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default JobPostingForm;