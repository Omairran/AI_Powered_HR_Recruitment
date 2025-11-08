import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axiosInstance from '../api/axiosConfig';
import { 
  Lock as LockIcon, 
  Unlock as UnlockIcon, 
  Edit as EditIcon, 
  Trash2 as DeleteIcon,
  Users as UsersIcon 
} from 'lucide-react';
import CustomDialog from '../alerts/CustomDialog';
import '../../styles/shared.css';

const AllJobsPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editingJob, setEditingJob] = useState(null);
  const [jobToDelete, setJobToDelete] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  const fetchJobs = () => {
    const accessToken = localStorage.getItem('access');

    axiosInstance.get('job_posting/jobposts/')
      .then((response) => {
        setJobs(response.data);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  const handleCheckApplicants = (job) => {
    navigate('/job-applicants', { state: { job } });
  };

  const handleEditJob = (job) => {
    setEditingJob({
      ...job,
      skills: Array.isArray(job.skills) ? job.skills.join(', ') : job.skills
    });
  };

  const handleSaveEdit = async () => {
    try {
      const updateData = {
        ...editingJob,
        skills: editingJob.skills.split(',').map(skill => skill.trim())
      };

      await axiosInstance.patch(`job_posting/jobposts/${editingJob.id}/`, updateData);
      fetchJobs();
      setEditingJob(null);
    } catch (err) {
      console.error('Error updating job:', err);
      alert('Failed to update job');
    }
  };

  const handleTogglePrivacy = async (job) => {
    try {
      await axiosInstance.patch(`job_posting/jobposts/${job.id}/`, {
        is_private: !job.is_private
      });
      fetchJobs();
    } catch (err) {
      console.error('Error toggling job privacy:', err);
      alert('Failed to update job privacy');
    }
  };

  const handleDeleteJob = async () => {
    if (!jobToDelete) return;
    
    try {
      await axiosInstance.delete(`job_posting/jobposts/${jobToDelete}/`);
      fetchJobs();
      setJobToDelete(null);
    } catch (err) {
      console.error('Error deleting job:', err);
      alert('Failed to delete job');
    }
  };

  const renderJobCard = (job) => {
    const experienceLevels = [
      'Basic', 
      'Intermediate', 
      'Expert'
    ];

    if (editingJob && editingJob.id === job.id) {
      return (
        <div className="card" key={job.id}>
          <div className="card-content">
            <div className="form-group">
              <input
                className="form-input"
                value={editingJob.title}
                onChange={(e) => setEditingJob({...editingJob, title: e.target.value})}
                placeholder="Job Title"
              />
              <textarea
                className="form-input"
                value={editingJob.description}
                onChange={(e) => setEditingJob({...editingJob, description: e.target.value})}
                placeholder="Job Description"
                style={{ minHeight: '120px' }}
              />
              <input
                className="form-input"
                value={editingJob.skills}
                onChange={(e) => setEditingJob({...editingJob, skills: e.target.value})}
                placeholder="Skills (comma-separated)"
              />
              <select
                className="form-input"
                value={editingJob.experience_level}
                onChange={(e) => setEditingJob({...editingJob, experience_level: e.target.value})}
              >
                {experienceLevels.map((level) => (
                  <option key={level} value={level}>{level}</option>
                ))}
              </select>
              <div className="button-group">
                <button className="btn btn-primary" onClick={handleSaveEdit}>
                  Save Changes
                </button>
                <button className="btn btn-secondary" onClick={() => setEditingJob(null)}>
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="card" key={job.id}>
        <div className="card-content">
          <div className="card-header">
            <h3 className="card-title">{job.title}</h3>
            <button 
              className="icon-button"
              onClick={() => handleTogglePrivacy(job)}
              title={job.is_private ? "Make Public" : "Make Private"}
            >
              {job.is_private ? 
                <LockIcon className="icon-red" size={20} /> : 
                <UnlockIcon className="icon-green" size={20} />
              }
            </button>
          </div>

          <div className="card-body">
            <div className="info-section">
              <h4 className="section-title">Description</h4>
              <p className="description-text">{job.description}</p>
            </div>

            <div className="info-section">
              <h4 className="section-title">Required Skills</h4>
              <div className="tags-container">
                {Array.isArray(job.skills) ? 
                  job.skills.map((skill, index) => (
                    <span key={index} className="tag skill-tag">{skill}</span>
                  )) :
                  job.skills.split(',').map((skill, index) => (
                    <span key={index} className="tag skill-tag">{skill.trim()}</span>
                  ))
                }
              </div>
            </div>

            <div className="info-section">
              <h4 className="section-title">Experience Level</h4>
              <p className="text">{job.experience_level}</p>
            </div>

            <div className="button-group">
              <button className="btn btn-primary" onClick={() => handleEditJob(job)}>
                <EditIcon size={16} /> Edit
              </button>
              <button className="btn btn-danger" onClick={() => setJobToDelete(job.id)}>
                <DeleteIcon size={16} /> Delete
              </button>
              <button className="btn btn-success" onClick={() => handleCheckApplicants(job)}>
                <UsersIcon size={16} /> View Applicants
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className="loading-container"><p className="loading-text">Loading jobs...</p></div>;
  }

  if (error) {
    return <div className="error-container"><p className="error-text">Error: {error}</p></div>;
  }

  return (
    <div className="page-container">
      <div className="content-wrapper">
        <div className="page-header">
          <h2 className="page-title">Posted Jobs</h2>
          <button 
            className="btn btn-secondary"
            onClick={() => navigate('/recruiter-dashboard')}
          >
            Back to Dashboard
          </button>
        </div>
        
        {jobs.length > 0 ? (
          <div className="grid-container">
            {jobs.map(renderJobCard)}
          </div>
        ) : (
          <div className="empty-state">
            <p className="empty-text">No jobs available.</p>
          </div>
        )}
      </div>

      <CustomDialog
        open={!!jobToDelete}
        onClose={() => setJobToDelete(null)}
        onConfirm={handleDeleteJob}
        title="Delete Job Posting"
        description="Are you sure you want to delete this job posting? This action cannot be undone."
      />
    </div>
  );
};

export default AllJobsPage;