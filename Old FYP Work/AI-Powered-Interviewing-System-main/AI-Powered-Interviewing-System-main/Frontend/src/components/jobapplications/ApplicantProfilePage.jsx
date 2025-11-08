import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, Mail, Calendar, Award, Briefcase, Download } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import "../../styles/ApplicantsDetailPage.css";
import JSZip from 'jszip';
import { saveAs } from 'file-saver';
import { toast } from "react-toastify";

const ApplicantProfilePage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [applicantDetails, setApplicantDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const applicant = location.state?.applicant;
  
  const fetchApplicantDetails = async () => {
    try {
      const response = await axiosInstance.get(`job_posting/applicant/${applicant.id}/`);
      setApplicantDetails(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching applicant details:', err);
      setError('Failed to load applicant profile');
      setLoading(false);
    }
  };

  console.log("applicantDetails", applicantDetails);
  useEffect(() => {
    if (!applicant) {
      navigate('/view-job');
      return;
    }
    fetchApplicantDetails();
  }, [applicant, navigate]);

  const handleDownloadResume = async () => {
    try {
      const response = await axiosInstance.get(
        `job_posting/applicant/${applicant.id}/?download=true`,
        {
          responseType: 'blob', // Important for handling file downloads
        }
      );
       // Create a blob URL and trigger download
       const blob = new Blob([response.data], { type: 'application/pdf' });
       const url = window.URL.createObjectURL(blob);
       const link = document.createElement('a');
       link.href = url;
       link.setAttribute('download', `${applicantDetails?.full_name}_resume.pdf`);
       document.body.appendChild(link);
       link.click();
       link.remove();
       window.URL.revokeObjectURL(url);
     } catch (err) {
       console.error('Error downloading resume:', err);
       alert('Failed to download resume');
     }
   };

  // In your React/Vue/etc component
  const handleExportFrames = async (applicationId) => {
    try {
      // Start loading indicator
      setLoading(true);
      
      // Make a GET request to the frames download endpoint using axiosInstance
      const response = await axiosInstance.get(`job_posting/download-frames/${applicant.id}/`, {
        responseType: 'blob' // Important: set responseType to 'blob'
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary anchor element to trigger download
      const a = document.createElement('a');
      a.href = url;
      a.download = `${applicant.full_name}_Interview_Frames_Application_Id_${applicant.id}.zip`;
      document.body.appendChild(a);
      a.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading frames:', error);
      // Show error notification to user
      toast.error('Error downloading frames: ' + (error.response?.data || error.message));
    } finally {
      // Stop loading indicator
      setLoading(false);
    }
  };

  const updateApplicationStatus = async (newStatus) => {
    try {
      const response = await axiosInstance.patch(`job_posting/applicant/${applicant.id}/`, {
        application_status: newStatus
      });
      
      if (response.data) {
        setApplicantDetails(prev => ({
          ...prev,
          application_status: newStatus
        }));
      }
    } catch (err) {
      console.error('Error updating status:', err);
      alert('Failed to update status');
    }
  };

  const handleShortlist = () => updateApplicationStatus('Selected');
  const handleReject = () => updateApplicationStatus('Rejected');

  if (!applicant) return (
    <div style={styles.messageContainer}>
      <p style={styles.errorText}>No applicant selected</p>
    </div>
  );

  if (loading) return (
    <div style={styles.messageContainer}>
      <p style={styles.loadingText}>Loading applicant profile...</p>
    </div>
  );

  if (error) return (
    <div style={styles.messageContainer}>
      <p style={styles.errorText}>{error}</p>
    </div>
  );

  // Check if frames exist
  const hasFrames = applicantDetails?.face_verification_result && 
                   applicantDetails.face_verification_result.length > 0;

  return (
    <div style={styles.pageContainer}>
      <div style={styles.contentWrapper}>
        <div style={styles.headerActions}>
          <button onClick={() => navigate(-1)} style={styles.backButton}>
            <ArrowLeft style={styles.icon} />
            Back
          </button>
          
          {hasFrames && (
            <button 
              onClick={handleExportFrames} 
              style={styles.exportButton}
              disabled={exportLoading}
            >
              <Download style={styles.icon} />
              {exportLoading 
                ? `Exporting... ${exportProgress}%` 
                : 'Export Frames'}
            </button>
          )}
        </div>

        <div style={styles.profileCard}>
          <div style={styles.profileHeader}>
            <h1 style={styles.profileName}>{applicantDetails?.full_name}</h1>
            <div style={styles.profileEmail}>
              <Mail style={styles.iconSmall} />
              <span>{applicantDetails?.email}</span>
            </div>
            
          </div>

          <div style={styles.mainContent}>
            <div style={styles.infoGrid}>
              <div style={styles.infoSection}>
                <h2 style={styles.sectionTitle}>
                  <Award style={styles.iconSmall} />
                  Qualifications & Results
                </h2>
                <div style={styles.infoList}>
                <div style={styles.infoItem}>
                    <span style={styles.label}>Job Title:</span>
                    <span>{applicantDetails?.job_title}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.label}>Qualification:</span>
                    <span>{applicantDetails?.qualification}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.label}>Interview Score:</span>
                    <span>{applicantDetails?.marks || 'Interview Not Done'}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.label}>Confidence Score:</span>
                    <span>{parseFloat(applicantDetails?.confidence_score).toFixed(2)}</span>
                  </div>
                  
                  
                </div>
              </div>

              <div style={styles.infoSection}>
                <h2 style={styles.sectionTitle}>
                  <Briefcase style={styles.iconSmall} />
                  Application Information
                </h2>
                <div style={styles.infoList}>
                  <div style={styles.infoItem}>
                    <span style={styles.label}>Status:</span>
                    <span style={styles.statusBadge}>
                    {applicantDetails?.application_status}
                  </span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.label}>Applied Date:</span>
                    <span>{new Date(applicantDetails?.applied_at).toLocaleDateString()}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.label}>Interview/Flag Status:</span>
                    <span>{applicantDetails?.flag_status ? "Yes" : "No"}</span>
                  </div>
                  <div style={styles.infoItem}>
                    <span style={styles.label}>Interview Status:</span>
                    <span>{applicantDetails?.interview_status ? "Interview Done" : "Interview Not Done"}</span>
                    </div>
                    
                  
                </div>
              </div>
            </div>

            {applicantDetails?.resume && (
            <div style={styles.resumeSection}>
              <button 
                onClick={handleDownloadResume}
                style={styles.resumeButton}
              >
                <FileText style={styles.iconSmall} />
                View Resume
              </button>
            </div>
            )}

            <div style={styles.actionButtons}>
              <button 
                onClick={handleShortlist}
                disabled={applicantDetails?.application_status === 'Selected'}
                style={styles.shortlistButton}
              >
                {applicantDetails?.application_status === 'Selected' ? 'Shortlisted' : 'Shortlist Candidate'}
              </button>
              <button 
                onClick={handleReject}
                disabled={applicantDetails?.application_status === 'Rejected'}
                style={styles.rejectButton}
              >
                {applicantDetails?.application_status === 'Rejected' ? 'Rejected' : 'Reject Application'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageContainer: {
    padding: '20px',
    maxWidth: '1200px',
    margin: '0 auto',
  },
  contentWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  messageContainer: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh',
  },
  loadingText: {
    fontSize: '18px',
    color: '#666',
  },
  errorText: {
    fontSize: '18px',
    color: '#dc2626',
  },
  // backButton: {
  //   display: 'flex',
  //   alignItems: 'center',
  //   gap: '8px',
  //   padding: '8px 16px',
  //   backgroundColor: '#fff',
  //   border: '1px solid #e5e7eb',
  //   borderRadius: '8px',
  //   cursor: 'pointer',
  //   marginBottom: '20px',
  //   color: '#374151',
  //   fontWeight: '500',
  //   transition: 'all 0.2s',
  // },
  headerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  
  exportButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#4f46e5',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  icon: {
    marginRight: '8px',
    width: '16px',
    height: '16px',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
    overflow: 'hidden',
  },
  profileHeader: {
    background: 'linear-gradient(135deg, #2563eb 0%, #1e40af 100%)',
    padding: '24px',
    color: '#fff',
    position: 'relative',
    overflow: 'hidden',
    borderBottom: '1px solid #e5e7eb',


  },
  profileHeaderOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'linear-gradient(45deg, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 100%)',
  },
  profileName: {
    fontSize: '32px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#fff',
    letterSpacing: '0.5px',
  },
  profileEmail: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    color: '#e5e7eb',
    fontSize: '16px',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: '8px 16px',
    borderRadius: '8px',
    width: 'fit-content',
  },
  // iconSmall: {
  //   marginRight: '6px',
  //   width: '14px',
  //   height: '14px',
  // },
  mainContent: {
    padding: '24px',
  },
  infoGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '24px',
    marginBottom: '24px',
  },
  infoSection: {
    backgroundColor: '#f8fafc',
    padding: '30px',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    transition: 'transform 0.2s ease',
    ':hover': {
      transform: 'translateY(-2px)',
    },
  },
  sectionTitle: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    fontSize: '20px',
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: '24px',
    padding: '0 0 16px 0',
    borderBottom: '2px solid #e5e7eb',
  },
  infoList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  infoItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    backgroundColor: '#fff',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  label: {
    fontWeight: '500',
    color: '#4b5563',
    fontSize: '15px',
  },
  value: {
    color: '#111827',
    fontWeight: '500',
  },
  statusBadge: {
    display: 'inline-block',
    fontSize: '14px',
    fontWeight: '500',
    color: '#059669',
    backgroundColor: '#d1fae5',
    padding: '4px 8px',
    borderRadius: '9999px',
  },
  resumeSection: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: '24px',
    marginTop: '24px',
    display: 'flex',
    justifyContent: 'center',
  },
  resumeButton: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '10px',
    padding: '12px 24px',
    backgroundColor: '#2563eb',
    color: '#fff',
    borderRadius: '10px',
    cursor:'pointer',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    ':hover': {
      backgroundColor: '#1d4ed8',
      transform: 'translateY(-1px)',
    },
  },
  actionButtons: {
    display: 'flex',
    justifyContent: 'center',
    gap: '20px',
    marginTop: '40px',
  },
  shortlistButton: {
    padding: '14px 32px',
    backgroundColor: '#059669',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    ':hover': {
      backgroundColor: '#047857',
      transform: 'translateY(-1px)',
    },
  },
  rejectButton: {
    padding: '14px 32px',
    backgroundColor: '#dc2626',
    color: '#fff',
    border: 'none',
    borderRadius: '10px',
    fontWeight: '600',
    fontSize: '16px',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
    ':hover': {
      backgroundColor: '#b91c1c',
      transform: 'translateY(-1px)',
    },
  },
  backButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  
  // icon: {
  //   width: '20px',
  //   height: '20px',
  // },
  iconSmall: {
    width: '16px',
    height: '16px',
  },
};

export default ApplicantProfilePage;