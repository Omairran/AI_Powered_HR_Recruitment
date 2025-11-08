import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const JobDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { job } = location.state || {};

  if (!job) {
    return <div style={styles.container}>
      <p style={styles.errorText}>Job details not found.</p>
      <button style={styles.backButton} onClick={() => navigate('/applied-jobs')}>
        Back to Applied Jobs
      </button>
    </div>;
  }

  const handleStartInterview = (jobId) => {
    navigate(`/chat/${jobId}`);
  };

  return (
    <div style={styles.container}>
      <button style={styles.backButton} onClick={() => navigate('/applied-jobs')}>
        Back to Applied Jobs
      </button>
      
      <div style={styles.detailsCard}>
        <h2 style={styles.pageTitle}>Job Details</h2>
        
        <div style={styles.detailSection}>
          <h3 style={styles.sectionTitle}>Title</h3>
          <p style={styles.detailText}>{job.title}</p>
        </div>

        <div style={styles.detailSection}>
          <h3 style={styles.sectionTitle}>Description</h3>
          <p style={styles.detailText}>{job.description}</p>
        </div>

        <div style={styles.detailSection}>
          <h3 style={styles.sectionTitle}>Required Skills</h3>
          <p style={styles.detailText}>
            {Array.isArray(job.skills) ? job.skills.join(', ') : job.skills}
          </p>
        </div>

        <div style={styles.detailSection}>
          <h3 style={styles.sectionTitle}>Experience Level</h3>
          <p style={styles.detailText}>{job.experience_level}</p>
        </div>

        <div style={styles.detailSection}>
          <h3 style={styles.sectionTitle}>Location</h3>
          <p style={styles.detailText}>{job.location}</p>
        </div>

        <div style={styles.detailSection}>
          <h3 style={styles.sectionTitle}>Application Date</h3>
          <p style={styles.detailText}>
            {new Date(job.application_date).toLocaleDateString()}
          </p>
        </div>

        {job.marks !== null && (
          <div style={styles.detailSection}>
            <h3 style={styles.sectionTitle}>Test Score</h3>
            <p style={styles.detailText}>{job.marks}</p>
          </div>
        )}

        <div style={styles.buttonContainer}>
          <button
            style={styles.interviewButton}
            onClick={() => handleStartInterview(job.id)}
          >
            Start Interview
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '800px',
    margin: '0 auto',
  },
  detailsCard: {
    backgroundColor: '#fff',
    borderRadius: '8px',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginTop: '20px',
  },
  pageTitle: {
    fontSize: '1.8rem',
    fontWeight: 'bold',
    marginBottom: '30px',
    textAlign: 'center',
  },
  detailSection: {
    marginBottom: '20px',
    padding: '15px',
    borderBottom: '1px solid #eee',
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: 'bold',
    marginBottom: '10px',
    color: '#444',
  },
  detailText: {
    fontSize: '1rem',
    lineHeight: '1.5',
    color: '#666',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'center',
    marginTop: '30px',
  },
  interviewButton: {
    padding: '12px 24px',
    backgroundColor: '#28a745',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    fontWeight: 'bold',
    width: '100%',
    maxWidth: '300px',
  },
  backButton: {
    padding: '8px 15px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  errorText: {
    textAlign: 'center',
    color: 'red',
    fontSize: '1.2rem',
    marginTop: '50px',
    marginBottom: '20px',
  }
};

export default JobDetailsPage;