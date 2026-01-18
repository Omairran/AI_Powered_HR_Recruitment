import React, { useState, useEffect } from 'react';
import candidateAPI from '../services/api';
import './CandidateApplicationForm.css';

const CandidateApplicationForm = () => {
  const [step, setStep] = useState(1); // 1: Upload, 2: Review, 3: Success
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Form Data
  const [basicInfo, setBasicInfo] = useState({
    name: '',
    email: '',
    phone: '',
    job_id: ''
  });

  const [resumeFile, setResumeFile] = useState(null);

  // Parsed/Review Data
  const [reviewData, setReviewData] = useState({
    parsed_skills: [],
    parsed_experience_years: 0,
    parsed_education_level: '',
    parsed_location: '',
    parsed_summary: '',
    parsed_linkedin: '',
    parsed_github: '',
    parsed_portfolio: ''
  });

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = async () => {
    try {
      // We can use direct axios here or add a method to api.js for public jobs
      // For now using the candidateAPI.getAll if it supports public access or direct fetch
      // Assuming public endpoint for jobs exists as per previous code
      const response = await fetch('http://localhost:8000/api/jobs/?status=active');
      const data = await response.json();
      setJobs(data);
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const handleBasicChange = (e) => {
    setBasicInfo({
      ...basicInfo,
      [e.target.name]: e.target.value
    });
    setMessage({ text: '', type: '' });
  };

  const handleReviewChange = (e) => {
    const { name, value } = e.target;
    setReviewData({
      ...reviewData,
      [name]: value
    });
  };

  const handleSkillsChange = (e) => {
    // Handle comma-separated input for skills
    setReviewData({
      ...reviewData,
      parsed_skills: e.target.value.split(',').map(s => s.trim()) // Store as array
    });
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ['application/pdf', 'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain'];

      if (!validTypes.includes(file.type)) {
        setMessage({
          text: 'Please upload a PDF, DOC, DOCX, or TXT file',
          type: 'error'
        });
        e.target.value = '';
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setMessage({
          text: 'File size must be less than 10MB',
          type: 'error'
        });
        e.target.value = '';
        return;
      }

      setResumeFile(file);
      setMessage({ text: '', type: '' });
    }
  };

  const handleNextStep = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    // Validate Step 1
    if (!basicInfo.name || !basicInfo.email) {
      setMessage({ text: 'Name and email are required', type: 'error' });
      setLoading(false);
      return;
    }
    if (!resumeFile) {
      setMessage({ text: 'Please upload your resume', type: 'error' });
      setLoading(false);
      return;
    }
    if (!basicInfo.job_id) {
      setMessage({ text: 'Please select a job', type: 'error' });
      setLoading(false);
      return;
    }

    try {
      // Parse resume
      const response = await candidateAPI.parseResume(resumeFile);
      const parsed = response.data;

      setReviewData({
        parsed_skills: parsed.parsed_skills || [],
        parsed_experience_years: parsed.parsed_experience_years || 0,
        parsed_education_level: parsed.parsed_education_level || '',
        parsed_location: parsed.parsed_location || '',
        parsed_summary: parsed.parsed_summary || '',
        parsed_linkedin: parsed.parsed_linkedin || '',
        parsed_github: parsed.parsed_github || '',
        parsed_portfolio: parsed.parsed_portfolio || ''
      });

      setStep(2); // Move to review step
    } catch (error) {
      console.error('Error parsing resume:', error);
      setMessage({
        text: 'Failed to parse resume. Please try again or use a different file.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ text: '', type: '' });

    try {
      const submitData = new FormData();
      submitData.append('name', basicInfo.name);
      submitData.append('email', basicInfo.email);
      submitData.append('phone', basicInfo.phone || '');
      submitData.append('job_id', basicInfo.job_id);
      submitData.append('resume', resumeFile);

      // Append reviewed data
      // API expects parsed_skills as a list or string. Let's send comma-separated string for simplicity with FormData
      // or duplicate keys for list.
      // Based on backend change: if we send a string "A, B", it splits it.
      submitData.append('parsed_skills', reviewData.parsed_skills.join(', '));
      submitData.append('parsed_experience_years', reviewData.parsed_experience_years);
      submitData.append('parsed_education_level', reviewData.parsed_education_level);
      submitData.append('parsed_location', reviewData.parsed_location);
      submitData.append('parsed_summary', reviewData.parsed_summary);

      // Append links
      submitData.append('parsed_linkedin', reviewData.parsed_linkedin || '');
      submitData.append('parsed_github', reviewData.parsed_github || '');
      submitData.append('parsed_portfolio', reviewData.parsed_portfolio || '');

      await candidateAPI.apply(submitData);

      setStep(3); // Success step
      setMessage({
        text: '✅ Application submitted successfully!',
        type: 'success'
      });

      // Reset form eventually if needed
    } catch (error) {
      console.error('Submit error:', error);
      setMessage({
        text: error.response?.data?.error || 'Failed to submit application',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setBasicInfo({ name: '', email: '', phone: '', job_id: '' });
    setResumeFile(null);
    setReviewData({
      parsed_skills: [],
      parsed_experience_years: 0,
      parsed_education_level: '',
      parsed_location: '',
      parsed_summary: ''
    });
    setMessage({ text: '', type: '' });
  };

  // Render Step 1: Upload
  const renderUploadStep = () => (
    <form onSubmit={handleNextStep} className="candidate-form">
      <h3>Step 1: Application Details</h3>

      <div className="form-section">
        <div className="form-group">
          <label>Full Name *</label>
          <input
            type="text"
            name="name"
            value={basicInfo.name}
            onChange={handleBasicChange}
            required
            placeholder="e.g. John Doe"
          />
        </div>
        <div className="form-group">
          <label>Email *</label>
          <input
            type="email"
            name="email"
            value={basicInfo.email}
            onChange={handleBasicChange}
            required
            placeholder="e.g. john@example.com"
          />
        </div>
        <div className="form-group">
          <label>Phone</label>
          <input
            type="tel"
            name="phone"
            value={basicInfo.phone}
            onChange={handleBasicChange}
            placeholder="e.g. +1 234 567 890"
          />
        </div>
      </div>

      <div className="form-section">
        <div className="form-group">
          <label>Select Job Position *</label>
          <select
            name="job_id"
            value={basicInfo.job_id}
            onChange={handleBasicChange}
            required
          >
            <option value="">-- Select a job --</option>
            {jobs.map(job => (
              <option key={job.id} value={job.id}>
                {job.title} at {job.company}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Upload Resume (PDF/DOCX) *</label>
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx,.txt"
            required
          />
          {resumeFile && (
            <div className="file-info">
              Selected: {resumeFile.name}
            </div>
          )}
        </div>
      </div>

      <div className="form-actions">
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Analyzing Resume...' : 'Next: Review Data ➡️'}
        </button>
      </div>
    </form>
  );

  // Render Step 2: Review
  const renderReviewStep = () => (
    <form onSubmit={handleFinalSubmit} className="candidate-form">
      <h3>Step 2: Review Extracted Data</h3>
      <p className="form-hint">
        Our AI extracted this information from your resume. Please review and edit if necessary to ensure the best match!
      </p>

      <div className="form-section">
        <div className="form-group">
          <label>Skills (Comma separated)</label>
          <textarea
            name="parsed_skills"
            value={reviewData.parsed_skills.join(', ')}
            onChange={handleSkillsChange}
            rows="3"
            placeholder="e.g. Python, React, Team Leadership"
          />
          <small>Add or remove skills to improve your match score</small>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label>Years of Experience</label>
            <input
              type="number"
              name="parsed_experience_years"
              value={reviewData.parsed_experience_years}
              onChange={handleReviewChange}
              step="0.5"
              min="0"
            />
          </div>
          <div className="form-group">
            <label>Education Level</label>
            <select
              name="parsed_education_level"
              value={reviewData.parsed_education_level}
              onChange={handleReviewChange}
            >
              <option value="">None Detected</option>
              <option value="High School">High School</option>
              <option value="Associate">Associate</option>
              <option value="Bachelor">Bachelor</option>
              <option value="Master">Master</option>
              <option value="PhD">PhD</option>
            </select>
          </div>
        </div>

        <div className="form-group">
          <label>Location</label>
          <input
            type="text"
            name="parsed_location"
            value={reviewData.parsed_location}
            onChange={handleReviewChange}
            placeholder="e.g. New York, NY"
          />
        </div>

        <div className="form-group">
          <label>Professional Summary</label>
          <textarea
            name="parsed_summary"
            value={reviewData.parsed_summary}
            onChange={handleReviewChange}
            rows="4"
          />
        </div>

        <div className="form-section">
          <h4>🔗 Professional Links</h4>
          <div className="form-group">
            <label>LinkedIn Profile</label>
            <input
              type="url"
              name="parsed_linkedin"
              value={reviewData.parsed_linkedin || ''}
              onChange={handleReviewChange}
              placeholder="https://linkedin.com/in/..."
            />
          </div>
          <div className="form-group">
            <label>GitHub Profile</label>
            <input
              type="url"
              name="parsed_github"
              value={reviewData.parsed_github || ''}
              onChange={handleReviewChange}
              placeholder="https://github.com/..."
            />
          </div>
          <div className="form-group">
            <label>Portfolio / Website</label>
            <input
              type="url"
              name="parsed_portfolio"
              value={reviewData.parsed_portfolio || ''}
              onChange={handleReviewChange}
              placeholder="https://myportfolio.com"
            />
          </div>
        </div>
      </div>

      <div className="form-actions">
        <button
          type="button"
          className="btn-secondary"
          onClick={() => setStep(1)}
          disabled={loading}
        >
          ⬅️ Back
        </button>
        <button type="submit" className="btn-submit" disabled={loading}>
          {loading ? 'Submitting...' : '✅ Confirm & Apply'}
        </button>
      </div>
    </form>
  );

  // Render Step 3: Success
  const renderSuccessStep = () => (
    <div className="success-container">
      <div className="success-icon">🎉</div>
      <h2>Application Submitted!</h2>
      <p>
        Your application for <strong>{jobs.find(j => j.id == basicInfo.job_id)?.title}</strong> has been received.
      </p>
      <div className="match-info">
        <p>Your profile has been matched against the job requirements based on the data you reviewed.</p>
      </div>
      <button className="btn-primary" onClick={handleReset}>
        Apply for another job
      </button>
    </div>
  );

  return (
    <div className="candidate-form-container">
      <div className="form-header">
        <h2>🚀 AI-Powered Application</h2>
        {step < 3 && (
          <div className="step-indicator">
            <span className={`step ${step === 1 ? 'active' : 'completed'}`}>1. Upload</span>
            <div className="step-line"></div>
            <span className={`step ${step === 2 ? 'active' : ''}`}>2. Review</span>
            <div className="step-line"></div>
            <span className="step">3. Done</span>
          </div>
        )}
      </div>

      {message.text && step !== 3 && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      {step === 1 && renderUploadStep()}
      {step === 2 && renderReviewStep()}
      {step === 3 && renderSuccessStep()}
    </div>
  );
};

export default CandidateApplicationForm;