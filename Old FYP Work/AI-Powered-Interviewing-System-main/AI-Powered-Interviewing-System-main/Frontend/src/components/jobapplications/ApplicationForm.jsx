import React, { useState } from "react";
import "../../styles/ApplicationForm.css";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUser, faEnvelope, faGraduationCap, faFileUpload, faFilePdf } from "@fortawesome/free-solid-svg-icons";
import { useLocation, useNavigate } from 'react-router-dom';
import CustomAlert from '../alerts/CustomAlert';

function ApplicationForm() {
  const { state } = useLocation();
  const { jobData } = state;
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    qualification: "",
    marks: "",
  });
  const [resumeFile, setResumeFile] = useState(null);
  const navigate = useNavigate();
  
  // Error state
  const [error, setError] = useState({
    show: false,
    message: "",
    type: "" // 'error' or 'success'
  });

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file && (file.type === "application/pdf" || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document")) {
      setResumeFile(file);
      setError({ show: false, message: "", type: "" });
    } else {
      setError({
        show: true,
        message: "Please upload a valid PDF or DOCX file.",
        type: "error"
      });
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
    setError({ show: false, message: "", type: "" }); // Clear error on input change
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.qualification || !resumeFile) {
      setError({
        show: true,
        message: "Please fill out all required fields.",
        type: "error"
      });
      return;
    }

    const form = new FormData();
    form.append("job_id", jobData.id);
    form.append("full_name", formData.fullName);
    form.append("email", formData.email);
    form.append("qualification", formData.qualification);
    form.append("marks", formData.marks || 0);
    form.append("resume", resumeFile);

    const accessToken = localStorage.getItem("access");

    try {
      const response = await fetch("http://localhost:8000/api/job_posting/apply/", {
        method: "POST",
        body: form,
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      });

      if (response.ok) {
        setError({
          show: true,
          message: "Application submitted successfully!",
          type: "success"
        });
        setTimeout(() => {
          navigate("/publicposts");
        }, 2000);
      } else {
        const errorData = await response.json();
        setError({
          show: true,
          message: "You can't apply more than one time for a single job" || "An error occurred while submitting the application.",
          type: "error"
        });
      }
    } catch (error) {
      setError({
        show: true,
        message: "An error occurred while submitting the application.",
        type: "error"
      });
    }
  };

  return (
    <div className="screenBackground">
      <div className="app">
        <div className="form-container">
          <h1 className="form-title">Application Form</h1>
          <form className="form-grid" onSubmit={handleSubmit}>
            {/* Full Name */}
            <div className="form-field">
              <label htmlFor="fullName">Full Name</label>
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faUser} className="icon" />
                <input
                  type="text"
                  id="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Write your full name"
                />
              </div>
            </div>

            {/* Email Address */}
            <div className="form-field">
              <label htmlFor="email">Email Address</label>
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faEnvelope} className="icon" />
                <input
                  type="email"
                  id="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Write your Email Address"
                />
              </div>
            </div>

            {/* Highest Qualification */}
            <div className="highest-qualification-field">
              <label htmlFor="qualification">Highest Qualification</label>
              <div className="input-wrapper">
                <FontAwesomeIcon icon={faGraduationCap} className="icon" />
                <select id="qualification" value={formData.qualification} onChange={handleChange}>
                  <option value="">Select your highest qualification</option>
                  <option value="bachelors">Bachelors</option>
                  <option value="masters">Masters</option>
                  <option value="phd">Ph.D.</option>
                </select>
              </div>
            </div>

            {/* Resume Upload */}
            <div className="form-field">
              <label htmlFor="resume">Resume CV</label>
              <div className="upload-wrapper">
                <FontAwesomeIcon icon={faFilePdf} className="icon pdf-upload-icon" />
                <input
                  type="file"
                  id="resume"
                  onChange={handleFileUpload}
                  accept=".pdf,.docx"
                  hidden
                />
                <label htmlFor="resume" className="upload-label">
                  <FontAwesomeIcon icon={faFileUpload} className="icon" />
                  <p>Click to upload your resume</p>
                  <p className="small-text">Upload PDF or DOCX files up to 500MB</p>
                </label>
              </div>
              {resumeFile && <p className="file-name">{resumeFile.name}</p>}
            </div>

            {/* Buttons and Error/Success Message */}
            <div className="form-footer">
              <div className="form-buttons">
                <button type="button" className="cancel-button">Cancel</button>
                <button type="submit" className="apply-button">Apply Now</button>
              </div>
              
              {error.show && (
                <div className={`message-container ${error.type}`}>
                  {error.message}
                </div>
              )}
            </div>

            {/* Warning */}
            <div className="warning-box">
              <p>Ensure all the provided information and your resume highlight your skills and experience.</p>
            </div>
          </form>

          <style jsx>{`
            .form-footer {
              display: flex;
              flex-direction: column;
              gap: 1rem;
              width: 100%;
            }

            .message-container {
              padding: 12px;
              border-radius: 4px;
              text-align: center;
              font-size: 14px;
              margin-top: 8px;
              animation: slideIn 0.2s ease-out;
            }

            .message-container.error {
              background-color: #fef2f2;
              color: #dc2626;
              border: 1px solid #fecaca;
            }

            .message-container.success {
              background-color: #f0fdf4;
              color: #16a34a;
              border: 1px solid #bbf7d0;
            }

            @keyframes slideIn {
              from {
                transform: translateY(-10px);
                opacity: 0;
              }
              to {
                transform: translateY(0);
                opacity: 1;
              }
            }
          `}</style>
        </div>
      </div>
    </div>
  );
}

export default ApplicationForm;