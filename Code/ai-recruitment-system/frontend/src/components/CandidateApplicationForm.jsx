import React, { useState } from 'react';
import axios from 'axios';
import './CandidateApplicationForm.css';

const CandidateApplicationForm = () => {
  // Step 1: Initial form
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
    resume: null,
  });

  // Step 2: Parsed data for review/edit
  const [parsedData, setParsedData] = useState(null);
  const [editableData, setEditableData] = useState(null);

  // UI state
  const [step, setStep] = useState(1); // 1: Upload, 2: Review/Edit, 3: Success
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [fileName, setFileName] = useState('');
  const [candidateId, setCandidateId] = useState(null);
  const [finalData, setFinalData] = useState(null);
  const [isUpdating, setIsUpdating] = useState(false);

  const API_BASE_URL = 'http://localhost:8000/api/candidates';

  // Step 1: Initial form handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (error) setError(null);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    
    if (file) {
      const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'application/msword', 'text/plain'];
      const allowedExtensions = ['pdf', 'docx', 'doc', 'txt'];
      const fileExtension = file.name.split('.').pop().toLowerCase();
      
      if (!allowedTypes.includes(file.type) && !allowedExtensions.includes(fileExtension)) {
        setError('Please upload a PDF, DOCX, DOC, or TXT file.');
        e.target.value = '';
        return;
      }

      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setError('File size must be less than 10MB.');
        e.target.value = '';
        return;
      }

      setFormData({ ...formData, resume: file });
      setFileName(file.name);
      if (error) setError(null);
    }
  };

  const handleInitialSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!formData.full_name || !formData.email || !formData.resume) {
      setError('Please fill in all required fields.');
      setLoading(false);
      return;
    }

    const submitData = new FormData();
    submitData.append('full_name', formData.full_name);
    submitData.append('email', formData.email);
    if (formData.phone) {
      submitData.append('phone', formData.phone);
    }
    submitData.append('resume', formData.resume);

    try {
      const response = await axios.post(`${API_BASE_URL}/apply/`, submitData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const candidate = response.data.candidate;
      const isUpdate = response.data.is_update;
      
      if (isUpdate) {
        console.log('✓ Updated existing application');
        setIsUpdating(true);
      } else {
        console.log('✓ Created new application');
        setIsUpdating(false);
      }
      
      setParsedData(candidate);
      setCandidateId(candidate.id);
      
      // Initialize editable data with parsed values
      setEditableData({
        full_name: candidate.parsed_name || candidate.full_name,
        email: candidate.parsed_email || candidate.email,
        phone: candidate.parsed_phone || candidate.phone || '',
        location: candidate.parsed_location || '',
        linkedin: candidate.parsed_linkedin || '',
        github: candidate.parsed_github || '',
        portfolio: candidate.parsed_portfolio || '',
        current_position: candidate.parsed_current_position || '',
        current_company: candidate.parsed_current_company || '',
        total_experience_years: candidate.parsed_total_experience_years || '',
        highest_degree: candidate.parsed_highest_degree || '',
        university: candidate.parsed_university || '',
        skills: (candidate.parsed_skills || []).join(', '),
        summary: candidate.parsed_summary || '',
      });

      setStep(2); // Move to review step

    } catch (err) {
      if (err.response && err.response.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          const errorMessages = Object.entries(errors)
            .map(([field, messages]) => {
              if (Array.isArray(messages)) {
                return `${field}: ${messages.join(', ')}`;
              }
              return `${field}: ${messages}`;
            })
            .join('\n');
          setError(errorMessages);
        } else {
          setError('An error occurred while submitting your application.');
        }
      } else if (err.request) {
        setError('Unable to connect to the server. Please check your internet connection.');
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Review/Edit handlers
  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditableData({ ...editableData, [name]: value });
  };

  const handleFinalSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Prepare update data with ALL fields
      const updateData = {
        full_name: editableData.full_name,
        email: editableData.email,
        phone: editableData.phone || '',
        parsed_location: editableData.location || '',
        parsed_linkedin: editableData.linkedin || '',
        parsed_github: editableData.github || '',
        parsed_portfolio: editableData.portfolio || '',
        parsed_current_position: editableData.current_position || '',
        parsed_current_company: editableData.current_company || '',
        parsed_total_experience_years: editableData.total_experience_years ? parseFloat(editableData.total_experience_years) : null,
        parsed_highest_degree: editableData.highest_degree || '',
        parsed_university: editableData.university || '',
        parsed_skills: editableData.skills ? editableData.skills.split(',').map(s => s.trim()).filter(Boolean) : [],
        parsed_summary: editableData.summary || '',
      };

      console.log('=== SUBMITTING UPDATE ===');
      console.log('Candidate ID:', candidateId);
      console.log('Update Data:', updateData);

      // Send PATCH request
      const response = await axios.patch(
        `${API_BASE_URL}/${candidateId}/update/`,
        updateData,
        { headers: { 'Content-Type': 'application/json' } }
      );

      console.log('=== UPDATE RESPONSE ===');
      console.log('Response data:', response.data);

      // Wait a moment for database to commit
      await new Promise(resolve => setTimeout(resolve, 500));

      // Fetch fresh data from server
      console.log('=== FETCHING LATEST DATA ===');
      const latestResponse = await axios.get(`${API_BASE_URL}/${candidateId}/`);
      
      console.log('=== LATEST DATA FROM SERVER ===');
      console.log('Full name:', latestResponse.data.full_name);
      console.log('Email:', latestResponse.data.email);
      console.log('Skills:', latestResponse.data.parsed_skills);
      console.log('Location:', latestResponse.data.parsed_location);
      console.log('Complete data:', latestResponse.data);
      
      // Store final data for display
      setFinalData(latestResponse.data);
      setStep(3);

    } catch (err) {
      console.error('=== UPDATE ERROR ===');
      console.error('Error:', err);
      console.error('Error response:', err.response?.data);
      
      let errorMessage = 'Failed to save your changes. ';
      if (err.response?.data) {
        const errors = err.response.data;
        if (typeof errors === 'object') {
          errorMessage += Object.entries(errors)
            .map(([field, msgs]) => `${field}: ${Array.isArray(msgs) ? msgs.join(', ') : msgs}`)
            .join(' | ');
        } else {
          errorMessage += errors;
        }
      } else {
        errorMessage += 'Please check your connection and try again.';
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setStep(1);
    setParsedData(null);
    setEditableData(null);
    setCandidateId(null);
    setFinalData(null);
    setIsUpdating(false);
    setFormData({
      full_name: '',
      email: '',
      phone: '',
      resume: null,
    });
    setFileName('');
    setError(null);
    
    const fileInput = document.querySelector('input[type="file"]');
    if (fileInput) fileInput.value = '';
  };

  return (
    <div className="application-container-fullscreen">
      <div className="application-card-fullscreen">
        {/* Progress Indicator */}
        <div className="progress-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <div className="step-label">Upload</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <div className="step-label">Review</div>
          </div>
          <div className="step-line"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <div className="step-label">Done</div>
          </div>
        </div>

        {/* Step 1: Upload Resume */}
        {step === 1 && (
          <>
            <h1 className="application-title">Job Application</h1>
            <p className="application-subtitle">Upload your resume and we'll extract your information</p>

            {error && (
              <div className="alert alert-error">
                <strong>Error:</strong>
                <pre>{error}</pre>
              </div>
            )}

            <form onSubmit={handleInitialSubmit} className="application-form">
              <div className="form-group">
                <label htmlFor="full_name" className="form-label">
                  Full Name <span className="required">*</span>
                </label>
                <input
                  type="text"
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="John Doe"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="email" className="form-label">
                  Email Address <span className="required">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="john.doe@example.com"
                  required
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="phone" className="form-label">
                  Phone Number <span className="optional">(Optional)</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="form-input"
                  placeholder="+1 (555) 123-4567"
                  disabled={loading}
                />
              </div>

              <div className="form-group">
                <label htmlFor="resume" className="form-label">
                  Resume <span className="required">*</span>
                </label>
                <div className="file-input-wrapper">
                  <input
                    type="file"
                    id="resume"
                    name="resume"
                    onChange={handleFileChange}
                    className="form-input-file"
                    accept=".pdf,.docx,.doc,.txt"
                    required
                    disabled={loading}
                  />
                  <label htmlFor="resume" className="file-input-label">
                    {fileName || 'Choose file...'}
                  </label>
                </div>
                <small className="form-help">
                  Accepted formats: PDF, DOCX, DOC, TXT (Max 10MB)
                </small>
              </div>

              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner"></span>
                    Processing Resume...
                  </>
                ) : (
                  'Continue →'
                )}
              </button>
            </form>
          </>
        )}

        {/* Step 2: Review and Edit */}
        {step === 2 && editableData && (
          <>
            <h1 className="application-title">Review Your Information</h1>
            <p className="application-subtitle">
              Please review and correct any information extracted from your resume
            </p>

            {isUpdating && (
              <div className="alert alert-info">
                <strong>📝 Updating Existing Application:</strong> We found your previous application. 
                You can update your information below.
              </div>
            )}

            {parsedData.parsing_status !== 'success' && (
              <div className="alert alert-warning">
                <strong>⚠ Partial Extraction:</strong> Some information couldn't be extracted automatically. 
                Please fill in any missing fields below.
              </div>
            )}

            {error && (
              <div className="alert alert-error">
                <strong>Error:</strong> {error}
              </div>
            )}

            <form onSubmit={handleFinalSubmit} className="edit-form">
              <div className="form-section">
                <h3 className="section-heading">📋 Personal Information</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Full Name *</label>
                    <input
                      type="text"
                      name="full_name"
                      value={editableData.full_name}
                      onChange={handleEditChange}
                      className="form-input"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Email *</label>
                    <input
                      type="email"
                      name="email"
                      value={editableData.email}
                      onChange={handleEditChange}
                      className="form-input"
                      required
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      value={editableData.phone}
                      onChange={handleEditChange}
                      className="form-input"
                      placeholder="+1 (555) 123-4567"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Location</label>
                    <input
                      type="text"
                      name="location"
                      value={editableData.location}
                      onChange={handleEditChange}
                      className="form-input"
                      placeholder="San Francisco, CA"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-heading">🔗 Professional Links</h3>
                
                <div className="form-group">
                  <label className="form-label">LinkedIn Profile</label>
                  <input
                    type="url"
                    name="linkedin"
                    value={editableData.linkedin}
                    onChange={handleEditChange}
                    className="form-input"
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">GitHub Profile</label>
                    <input
                      type="url"
                      name="github"
                      value={editableData.github}
                      onChange={handleEditChange}
                      className="form-input"
                      placeholder="https://github.com/yourusername"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Portfolio Website</label>
                    <input
                      type="url"
                      name="portfolio"
                      value={editableData.portfolio}
                      onChange={handleEditChange}
                      className="form-input"
                      placeholder="https://yourportfolio.com"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-heading">💼 Current Position</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Job Title</label>
                    <input
                      type="text"
                      name="current_position"
                      value={editableData.current_position}
                      onChange={handleEditChange}
                      className="form-input"
                      placeholder="Senior Software Engineer"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Company</label>
                    <input
                      type="text"
                      name="current_company"
                      value={editableData.current_company}
                      onChange={handleEditChange}
                      className="form-input"
                      placeholder="Tech Company Inc."
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Total Years of Experience</label>
                  <input
                    type="number"
                    step="0.5"
                    name="total_experience_years"
                    value={editableData.total_experience_years}
                    onChange={handleEditChange}
                    className="form-input"
                    placeholder="5.0"
                  />
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-heading">🎓 Education</h3>
                
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Highest Degree</label>
                    <input
                      type="text"
                      name="highest_degree"
                      value={editableData.highest_degree}
                      onChange={handleEditChange}
                      className="form-input"
                      placeholder="Bachelor of Science in Computer Science"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">University/Institution</label>
                    <input
                      type="text"
                      name="university"
                      value={editableData.university}
                      onChange={handleEditChange}
                      className="form-input"
                      placeholder="Stanford University"
                    />
                  </div>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-heading">🛠 Skills</h3>
                
                <div className="form-group">
                  <label className="form-label">Technical Skills (comma-separated)</label>
                  <textarea
                    name="skills"
                    value={editableData.skills}
                    onChange={handleEditChange}
                    className="form-textarea"
                    rows="3"
                    placeholder="Python, JavaScript, React, Django, AWS, Docker"
                  />
                  <small className="form-help">
                    Separate skills with commas
                  </small>
                </div>
              </div>

              <div className="form-section">
                <h3 className="section-heading">📝 Professional Summary</h3>
                
                <div className="form-group">
                  <label className="form-label">Brief Summary (Optional)</label>
                  <textarea
                    name="summary"
                    value={editableData.summary}
                    onChange={handleEditChange}
                    className="form-textarea"
                    rows="4"
                    placeholder="Experienced software engineer with expertise in..."
                  />
                </div>
              </div>

              <div className="form-actions">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                  disabled={loading}
                >
                  ← Back
                </button>
                
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner"></span>
                      Saving...
                    </>
                  ) : (
                    'Submit Application ✓'
                  )}
                </button>
              </div>
            </form>
          </>
        )}

        {/* Step 3: Success with Complete Data Display */}
        {step === 3 && finalData && (
          <div className="success-screen-fullwidth">
            <div className="success-header">
              <div className="success-icon">✓</div>
              <h1 className="success-title">Application Submitted Successfully!</h1>
              <p className="success-message">
                Thank you for applying! Your application has been received and verified.
              </p>
            </div>

            <div className="submission-details">
              <div className="details-grid">
                {/* Application Info */}
                <div className="detail-card highlight">
                  <h3>📋 Application Details</h3>
                  <div className="detail-item">
                    <span className="detail-label">Application ID:</span>
                    <span className="detail-value">#{finalData.id}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Status:</span>
                    <span className="status-badge">{finalData.application_status}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Submitted:</span>
                    <span className="detail-value">{new Date(finalData.created_at).toLocaleString()}</span>
                  </div>
                </div>

                {/* Personal Information */}
                <div className="detail-card">
                  <h3>👤 Personal Information</h3>
                  <div className="detail-item">
                    <span className="detail-label">Name:</span>
                    <span className="detail-value">{finalData.full_name}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Email:</span>
                    <span className="detail-value">{finalData.email}</span>
                  </div>
                  {finalData.phone && (
                    <div className="detail-item">
                      <span className="detail-label">Phone:</span>
                      <span className="detail-value">{finalData.phone}</span>
                    </div>
                  )}
                  {finalData.parsed_location && (
                    <div className="detail-item">
                      <span className="detail-label">Location:</span>
                      <span className="detail-value">{finalData.parsed_location}</span>
                    </div>
                  )}
                </div>

                {/* Professional Links */}
                {(finalData.parsed_linkedin || finalData.parsed_github || finalData.parsed_portfolio) && (
                  <div className="detail-card">
                    <h3>🔗 Professional Links</h3>
                    {finalData.parsed_linkedin && (
                      <div className="detail-item">
                        <span className="detail-label">LinkedIn:</span>
                        <a href={finalData.parsed_linkedin} target="_blank" rel="noopener noreferrer" className="detail-link">
                          View Profile →
                        </a>
                      </div>
                    )}
                    {finalData.parsed_github && (
                      <div className="detail-item">
                        <span className="detail-label">GitHub:</span>
                        <a href={finalData.parsed_github} target="_blank" rel="noopener noreferrer" className="detail-link">
                          View Profile →
                        </a>
                      </div>
                    )}
                    {finalData.parsed_portfolio && (
                      <div className="detail-item">
                        <span className="detail-label">Portfolio:</span>
                        <a href={finalData.parsed_portfolio} target="_blank" rel="noopener noreferrer" className="detail-link">
                          Visit Website →
                        </a>
                      </div>
                    )}
                  </div>
                )}

                {/* Current Position */}
                {(finalData.parsed_current_position || finalData.parsed_current_company) && (
                  <div className="detail-card">
                    <h3>💼 Current Position</h3>
                    {finalData.parsed_current_position && (
                      <div className="detail-item">
                        <span className="detail-label">Title:</span>
                        <span className="detail-value">{finalData.parsed_current_position}</span>
                      </div>
                    )}
                    {finalData.parsed_current_company && (
                      <div className="detail-item">
                        <span className="detail-label">Company:</span>
                        <span className="detail-value">{finalData.parsed_current_company}</span>
                      </div>
                    )}
                    {finalData.parsed_total_experience_years && (
                      <div className="detail-item">
                        <span className="detail-label">Experience:</span>
                        <span className="detail-value">{finalData.parsed_total_experience_years} years</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Education */}
                {(finalData.parsed_highest_degree || finalData.parsed_university) && (
                  <div className="detail-card">
                    <h3>🎓 Education</h3>
                    {finalData.parsed_highest_degree && (
                      <div className="detail-item">
                        <span className="detail-label">Degree:</span>
                        <span className="detail-value">{finalData.parsed_highest_degree}</span>
                      </div>
                    )}
                    {finalData.parsed_university && (
                      <div className="detail-item">
                        <span className="detail-label">Institution:</span>
                        <span className="detail-value">{finalData.parsed_university}</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Skills */}
                {finalData.parsed_skills && finalData.parsed_skills.length > 0 && (
                  <div className="detail-card full-width">
                    <h3>🛠 Technical Skills</h3>
                    <div className="skills-display">
                      {finalData.parsed_skills.map((skill, idx) => (
                        <span key={idx} className="skill-badge">{skill}</span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Summary */}
                {finalData.parsed_summary && (
                  <div className="detail-card full-width">
                    <h3>📝 Professional Summary</h3>
                    <p className="summary-display">{finalData.parsed_summary}</p>
                  </div>
                )}

                {/* Resume File */}
                <div className="detail-card full-width">
                  <h3>📄 Uploaded Resume</h3>
                  <div className="detail-item">
                    <span className="detail-label">Filename:</span>
                    <span className="detail-value">{finalData.resume_filename}</span>
                  </div>
                  <div className="detail-item">
                    <span className="detail-label">Parsing Status:</span>
                    <span className={`parsing-badge ${finalData.parsing_status}`}>
                      {finalData.parsing_status === 'success' && '✓ Successfully Parsed'}
                      {finalData.parsing_status === 'partial' && '⚠ Partially Parsed'}
                      {finalData.parsing_status === 'failed' && '✗ Parsing Failed'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="success-actions">
              <p className="next-steps">
                <strong>What's Next?</strong> Our HR team will review your application and contact you within 3-5 business days.
              </p>
              <button onClick={handleReset} className="btn btn-primary">
                Submit Another Application
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CandidateApplicationForm;