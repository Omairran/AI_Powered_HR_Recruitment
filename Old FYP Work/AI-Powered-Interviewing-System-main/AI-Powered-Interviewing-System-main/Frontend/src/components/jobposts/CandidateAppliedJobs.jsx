import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Briefcase } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import InterviewAlert from '../alerts/InterviewAlert';

const CandidateAppliedJobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [candidateId, setCandidateId] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [showDialog, setShowDialog] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    fetchAppliedJobs();
    fetchCandidateId();
  }, []);

  const fetchCandidateId = async () => {
    try {
      const response = await axiosInstance.get('chat/current-candidate/');
      setCandidateId(response.data.id);
    } catch (err) {
      console.error('Error fetching candidate ID:', err);
    }
  };

  const fetchAppliedJobs = () => {
    axiosInstance.get('job_posting/candidate/applied-jobs/')
      .then((response) => {
        setJobs(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleSeeDetails = (job) => {
    navigate('/job-details', { state: { job } });
  };

  const handleStartInterview = (job) => {
    setSelectedJob(job);
    setShowDialog(true);
  };

  const handleProceed = () => {
    if (selectedJob) {
      navigate('/face-verification', {
        state: {
          jobId: selectedJob.id,
          candidateId: candidateId,
          jobTitle: selectedJob.title,
          candidateName: selectedJob.full_name
        }
      });
      setShowDialog(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="page-container">
        <div className="loading-container">
          <p className="loading-text">Loading your applications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="page-container">
        <div className="error-container">
          <p className="error-text">Error: {error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="page-header">
          <button 
            className="btn btn-secondary" 
            onClick={() => navigate('/candidate-dashboard')}
          >
            <ArrowLeft size={16} /> Back
          </button>
          <h2 className="page-title">Your Applied Jobs</h2>
        </div>

        <div className="grid-container">
          {jobs.length > 0 ? (
            jobs.map((job) => (
              <div
                key={job.id}
                className={`card ${hoveredId === job.id ? 'card-hovered' : ''}`}
                onMouseEnter={() => setHoveredId(job.id)}
                onMouseLeave={() => setHoveredId(null)}
                style={{
                  willChange: 'transform, box-shadow',
                  transform: 'translateZ(0)',
                  transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                }}
              >
                <div className="card-content">
                  <div className="card-header" style={{ position: 'relative' }}>
                    <div className="flex items-center gap-2">
                      <Briefcase className="text-gray-600" size={20} />
                      <h3 className="card-title">{job.title}</h3>
                    </div>
                    <div className="time-badge-aligned">
                      <Clock size={14} />
                      <span>{formatDate(job.application_date)}</span>
                    </div>
                  </div>

                  <div className="card-body">
                    <div className="info-section">
                      <h4 className="section-title">Description</h4>
                      <p className="description-text">{job.description}</p>
                    </div>

                    <div className="info-section">
                      <h4 className="section-title">Required Skills</h4>
                      <div className="tags-container">
                        {Array.isArray(job.skills) && job.skills.map((skill, index) => (
                          <span 
                            key={index} 
                            className="tag skill-tag"
                            style={{ display: 'inline-block' }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="info-section">
                      <h4 className="section-title">Experience Level</h4>
                      <p className="text">{job.experience_level}</p>
                    </div>

                    <div className="info-section">
                      <h4 className="section-title">Location</h4>
                      <p className="text">{job.location}</p>
                    </div>

                    <div className="button-group">
                      <button
                        className="btn btn-primary"
                        onClick={() => handleStartInterview(job)}
                        style={{ position: 'relative' }}
                      >
                        Start Interview
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p className="empty-text">You haven't applied to any jobs yet.</p>
            </div>
          )}
        </div>
      </div>
      
      <InterviewAlert
        open={showDialog}
        onClose={() => setShowDialog(false)}
        onProceed={handleProceed}
      />
    </div>
  );
};

export default CandidateAppliedJobs;