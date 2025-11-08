import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Users, Clock, Search } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import "../../styles/ApplicantsDetailPage.css";

const ApplicantsDetailsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [applicants, setApplicants] = useState([]);
  const [sortedApplicants, setSortedApplicants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [limit, setLimit] = useState('1');
  const [sortOrder, setSortOrder] = useState('desc');

  const job = location.state?.job;
  console.log("job",job);
  const fetchApplicants = async () => {
    try {
      const response = await axiosInstance.get(`job_posting/job/${job.id}/applicants/`);
      console.log('response',response)
      setApplicants(response.data);
      setLoading(false);
    } catch (err) {
      console.error('Error fetching applicants:', err);
      setError('Failed to load applicants');
      setLoading(false);
    }
  };


  const fetchSortedApplicants = async () => {
    try {
      const response = await axiosInstance.get(
        `job_posting/job/${job.id}/applicants/sorted/?limit=${limit}&sort_order=${sortOrder}`
      );
      setSortedApplicants(response.data);
    } catch (err) {
      console.error('Error fetching sorted applicants:', err);
    }
  };

  useEffect(() => {
    if (!job) {
      navigate('/view-job');
      return;
    }
    fetchApplicants();
  }, [job, navigate]);

  useEffect(() => {
    if (job) {
      fetchSortedApplicants();
    }
  }, [job, limit, sortOrder]);

  if (!job) {
    return (
      <div className="adp-applicants-page">
        <div className="text-lg text-gray-600">No job selected</div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="adp-applicants-page">
        <div className="text-lg text-gray-600">Loading applicants...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="adp-applicants-page">
        <div className="text-lg text-red-600">{error}</div>
      </div>
    );
  }

  return (
    <div className="adp-applicants-page">
      <div className="adp-main-content">
        <div className="adp-content-container">
          <div className="adp-page-header">
            <div className="adp-header-left">
              <button 
                onClick={() => navigate('/view-job')}
                className="adp-back-button"
              >
                <ArrowLeft size={16} />
                Back to Jobs
              </button>
              <h1 className="adp-page-title">Applicants for {job.title}</h1>
            </div>
            <div className="adp-applicants-count">
              <Users size={20} />
              <span>{applicants.length} Applicants</span>
            </div>
          </div>

          {applicants.length === 0 ? (
            <div className="adp-empty-state">
              <p>No applicants have applied for this job yet.</p>
            </div>
          ) : (
            <div className="adp-applicants-grid">
              {applicants.map((applicant) => (
                <div key={applicant.id} className="adp-applicant-card">
                  <div className="adp-card-content">
                    <div className="adp-card-header">
                      <h3 className="adp-applicant-name">{applicant.full_name}</h3>
                      <div className="adp-timestamp">
                        <Clock size={14} />
                        {new Date(applicant.applied_at).toLocaleDateString()}
                      </div>
                    </div>
                    
                    <div className="adp-applicant-details">
                      <div className="adp-detail-item">
                        <p className="adp-detail-label">Email</p>
                        <p className="adp-detail-value">{applicant.email}</p>
                      </div>
                      <div className="adp-detail-item">
                        <p className="adp-detail-label">Qualification</p>
                        <p className="adp-detail-value">{applicant.qualification}</p>
                      </div>
                    </div>

                    <button 
                      onClick={() => navigate('/applicant-profile', { state: { applicant } })}
                      className="adp-view-profile-button"
                    >
                      View Full Profile
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="adp-right-panel">
        <div className="adp-panel-content">
          <h3 className="adp-panel-title">Top Candidates</h3>
          
          <div className="adp-filter-controls">
            <div className="adp-filter-group">
              <label>Show Top</label>
              <select
                value={limit}
                onChange={(e) => setLimit(e.target.value)}
                className="adp-filter-select"
              >
                <option value="1">Top 1</option>
                <option value="5">Top 5</option>
                <option value="10">Top 10</option>
                <option value="15">Top 15</option>
                <option value="20">Top 20</option>
              </select>
            </div>

            <div className="adp-filter-group">
              <label>Sort Order</label>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value)}
                className="adp-filter-select"
              >
                <option value="desc">Highest First</option>
                <option value="asc">Lowest First</option>
              </select>
            </div>
          </div>

          <div className="adp-sorted-list">
            {sortedApplicants.map((applicant, index) => (
              <div key={applicant.id} className="adp-sorted-list-item">
                <div className="adp-list-item-left">
                  <span className="adp-rank">{index + 1}.</span>
                  <button
                    onClick={() => navigate('/applicant-profile', { state: { applicant } })}
                    className="adp-applicant-link"
                  >
                    {applicant.full_name}
                  </button>
                </div>
                <span className="adp-marks">{applicant.marks}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApplicantsDetailsPage;