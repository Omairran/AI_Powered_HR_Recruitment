import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import CustomAlert from '../alerts/CustomAlert';

const JobPostingPage = () => {
  const [jobTitle, setJobTitle] = useState('');
  const [jobDescription, setJobDescription] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [experienceLevel, setExperienceLevel] = useState('');
  const [location, setLocation] = useState('');
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  
  const navigate = useNavigate();

  const handleSkillSelect = (skill) => {
    if (selectedSkills.includes(skill)) {
      setSelectedSkills(selectedSkills.filter((s) => s !== skill));
    } else {
      setSelectedSkills([...selectedSkills, skill]);
    }
  };

  const handleAddCustomSkill = (e) => {
    e.preventDefault();
    if (newSkill.trim() && !selectedSkills.includes(newSkill.trim())) {
      setSelectedSkills([...selectedSkills, newSkill.trim()]);
      setNewSkill('');
    }
  };

  const handleExperienceSelect = (level) => {
    setExperienceLevel(level);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', text: '' }); // Clear previous messages
    
    const jobData = {
      title: jobTitle,
      description: jobDescription,
      skills: selectedSkills,
      experience_level: experienceLevel,
      location: location
    };
    
    try {
      const accessToken = localStorage.getItem('access');
      await axios.post('http://127.0.0.1:8000/api/job_posting/job_posting/', jobData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });
      setMessage({ type: 'success', text: 'Job posted successfully!' });
      setTimeout(() => {
        navigate('/view-job', { state: { jobData } });
      }, 1000);
    } catch (error) {
      console.error('Error posting job:', error);
      setMessage({ type: 'error', text: 'Failed to post job. Please fill all fields.' });
    }
  };

  const handleBack = () => {
    navigate('/interview');
  };

  return (
    <div className="jp-screen">
      {/* <CustomAlert
        open={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        onConfirm={() => setShowErrorDialog(false)}
        title="Error"
        description="Failed to post job. Please check all fields."
      /> */}
      
      <div className="jp-container">
        <div className="jp-form-container">
          <button className="jp-back-button" onClick={handleBack}>
            <span className="jp-arrow">←</span>
          </button>

          <h1 className="jp-heading">Post a New Job</h1>

          <form onSubmit={handleSubmit} className="jp-form">
            <div className="jp-form-group">
              <label className="jp-label">Job Title*</label>
              <input
                type="text"
                value={jobTitle}
                onChange={(e) => setJobTitle(e.target.value)}
                placeholder="e.g Senior Software Engineer"
                className="jp-input"
              />
            </div>

            <div className="jp-form-group">
              <label className="jp-label">Job Location*</label>
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="e.g Lahore"
                className="jp-input"
              />
            </div>

            <div className="jp-form-group">
              <label className="jp-label">Job Description*</label>
              <textarea
                value={jobDescription}
                onChange={(e) => setJobDescription(e.target.value)}
                placeholder="Enter detailed job description..."
                className="jp-textarea"
              />
            </div>

            <div className="jp-form-group">
              <label className="jp-label">Required Skills*</label>
              <div className="jp-skills-section">
                <div className="jp-skills-container">
                  {['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'Machine Learning', 'SQL', 'Git', 'C++'].map((skill) => (
                    <button
                      type="button"
                      key={skill}
                      onClick={() => handleSkillSelect(skill)}
                      className={`jp-skill-button ${selectedSkills.includes(skill) ? 'jp-selected' : ''}`}
                    >
                      {skill}
                    </button>
                  ))}
                </div>
                <div className="jp-custom-skill">
                  <input
                    type="text"
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    placeholder="Add custom skill"
                    className="jp-skill-input"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSkill}
                    className="jp-add-skill"
                    disabled={!newSkill.trim()}
                  >
                    Add
                  </button>
                </div>
                {selectedSkills.length > 0 && (
                  <div className="jp-selected-skills">
                    <p className="jp-skills-label">Selected Skills:</p>
                    <div className="jp-skills-list">
                      {selectedSkills.map((skill) => (
                        <span key={skill} className="jp-skill-tag">
                          {skill}
                          <button
                            type="button"
                            onClick={() => handleSkillSelect(skill)}
                            className="jp-remove-skill"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="jp-form-group">
              <label className="jp-label">Experience Required*</label>
              <select
                value={experienceLevel}
                onChange={(e) => handleExperienceSelect(e.target.value)}
                className="jp-select"
              >
                <option value="">Select experience level</option>
                <option value="Basic">Basic</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div className="jp-button-group">
              <button type="button" className="jp-cancel" onClick={() => navigate(-1)}>
                Cancel
              </button>
              <button type="submit" className="jp-submit">
                Post Job
              </button>
            </div>

            {message.text && (
              <div className={`jp-message ${message.type === 'success' ? 'jp-success' : 'jp-error'}`}>
                {message.text}
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};

const styles = `
  .jp-screen {
    min-height: 100vh;
    background-color: #f8fafc;
    padding: 3rem 1rem;
    display: flex;
    align-items: flex-start;
    justify-content: center;
  }

  .jp-container {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
  }

  .jp-form-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
    padding: 2.5rem;
    position: relative;
    margin: 2rem auto;
  }

  .jp-back-button {
    position: absolute;
    top: 1.5rem;
    left: 1.5rem;
    display: flex;
    align-items: center;
    background: none;
    border: none;
    color: #2563eb;
    font-size: 1rem;
    cursor: pointer;
    padding: 0.5rem;
  }

  .jp-arrow {
    margin-right: 0.5rem;
    font-size: 1.25rem;
  }

  .jp-heading {
    text-align: center;
    font-size: 1.875rem;
    font-weight: 700;
    color: #1f2937;
    margin-bottom: 2rem;
    margin-top: 1rem;
  }

  .jp-form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .jp-form-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .jp-label {
    font-size: 0.875rem;
    font-weight: 600;
    color: #374151;
  }

  .jp-input,
  .jp-select,
  .jp-textarea {
    padding: 0.75rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    background-color: white;
  }

  .jp-input:focus,
  .jp-select:focus,
  .jp-textarea:focus {
    outline: none;
    border-color: #2563eb;
    box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
  }

  .jp-textarea {
    min-height: 200px;
    resize: vertical;
  }

  .jp-skills-section {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .jp-skills-container {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
  }

  .jp-skill-button {
    padding: 0.5rem 1rem;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    border: 1px solid #d1d5db;
    background-color: #f3f4f6;
    color: #374151;
    cursor: pointer;
  }

  .jp-skill-button:hover {
    background-color: #e5e7eb;
  }

  .jp-skill-button.jp-selected {
    background-color: #dbeafe;
    border-color: #2563eb;
    color: #1d4ed8;
  }

  .jp-custom-skill {
    display: flex;
    gap: 0.5rem;
    margin-top: 0.5rem;
  }

  .jp-skill-input {
    flex: 1;
    padding: 0.5rem 1rem;
    border: 1px solid #d1d5db;
    border-radius: 6px;
    font-size: 0.875rem;
  }

  .jp-add-skill {
    padding: 0.5rem 1rem;
    background-color: #2563eb;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
  }

  .jp-add-skill:disabled {
    background-color: #93c5fd;
    cursor: not-allowed;
  }

  .jp-selected-skills {
    margin-top: 1rem;
  }

  .jp-skills-label {
    font-size: 0.875rem;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
  }

  .jp-skills-list {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .jp-skill-tag {
    display: inline-flex;
    align-items: center;
    gap: 0.25rem;
    padding: 0.25rem 0.75rem;
    background-color: #dbeafe;
    color: #1d4ed8;
    border-radius: 9999px;
    font-size: 0.875rem;
  }

  .jp-remove-skill {
    background: none;
    border: none;
    color: #1d4ed8;
    cursor: pointer;
    font-size: 1.25rem;
    padding: 0 0.25rem;
  }

  .jp-button-group {
    display: flex;
    justify-content: center;
    gap: 1rem;
    margin-top: 1rem;
  }

  .jp-cancel,
  .jp-submit {
    padding: 0.75rem 2rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    min-width: 120px;
  }

  .jp-cancel {
    background-color: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }


  .jp-submit {
    background-color: #2563eb;
    color: white;
    border: none;
  }

  .jp-message {
    margin-top: 1rem;
    padding: 0.75rem 1rem;
    border-radius: 0.5rem;
    text-align: center;
    font-size: 0.875rem;
  }

  .jp-success {
    background-color: #f0fdf4;
    border: 1px solid #22c55e;
    color: #15803d;
  }

  .jp-error {
    background-color: #fef2f2;
    border: 1px solid #ef4444;
    color: #b91c1c;
  }
  @media (max-width: 640px) {
    .jp-screen {
      padding: 1rem;
    }

    .jp-form-container {
      padding: 1.5rem;
      margin: 0;
    }

    .jp-heading {
      font-size: 1.5rem;
    }

    .jp-button-group {
      flex-direction: column;
    }

    .jp-cancel,
    .jp-submit {
      width: 100%;
    }
  }
`;

const styleId = 'job-posting-styles';
if (!document.getElementById(styleId)) {
  const styleSheet = document.createElement("style");
  styleSheet.id = styleId;
  styleSheet.innerText = styles;
  document.head.appendChild(styleSheet);
}

export default JobPostingPage;