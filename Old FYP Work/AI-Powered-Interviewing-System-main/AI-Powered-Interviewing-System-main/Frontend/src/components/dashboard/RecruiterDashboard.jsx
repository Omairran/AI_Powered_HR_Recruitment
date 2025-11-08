import React, { useEffect, useState } from 'react';
import { useNavigate,Link } from 'react-router-dom';
import { 
  Search, 
  Plus, 
  Briefcase, 
  Users, 
  Star, 
  ChevronRight, 
  Bell,
  LogOut,
  ChevronDown,
  Building
} from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import zubair from '../../assets/zubair.jpg';
import "../../styles/RecruiterDashboard.css";

const RecruiterDashboard = () => {
  const navigate = useNavigate();
  const [jobPosts, setJobPosts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [notificationCount, setNotificationCount] = useState(3);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalApplications: 0,
    interviewsScheduled: 12,
    averageScore: 82,
    activeJobs: 0
  });
  const [username, setUsername] = useState(localStorage.getItem('username') || 'Guest');

  useEffect(() => {
    const accessToken = localStorage.getItem('access');
    if (!accessToken) {
      navigate('/recruiter-dashboard');
      return;
    }

    axiosInstance.get('job_posting/with_applicants/')
      .then(response => {
        const processedPosts = response.data.map(post => ({
          ...post,
          skills: Array.isArray(post.skills) ? post.skills.join(', ') : post.skills || ''
        }))
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)); // Add this line

        const totalApps = processedPosts.reduce((total, post) => {
          return total + (post.applicants?.length || 0);
        }, 0);
        setJobPosts(processedPosts);
        setDashboardStats(prev => ({
          ...prev,
          activeJobs: processedPosts.length,
          totalApplications: totalApps
        }));
      
      })
      .catch(error => {
        console.error('Error fetching job posts:', error);
        if (error.response && error.response.status === 401) {
          localStorage.removeItem('access');
          localStorage.removeItem('refresh');
          navigate('/login');
        }
      });
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate('/');
  };

  const handleIconClick = () => navigate('/JobPosting');
  const handleIconPostClick = () => navigate('/view-job');

  const getSkillsArray = (skillsString) => {
    if (!skillsString) return [];
    return skillsString.split(',').map(skill => skill.trim()).filter(Boolean);
  };

  return (
    <div className="recruiter-dashboard">
      <nav className="recruiter-dashboard__navbar">
        <div className="recruiter-dashboard__navbar-content">
          <div className="recruiter-dashboard__navbar-left">
            <div className="recruiter-dashboard__logo-container">
              <Briefcase className="recruiter-dashboard__logo-icon" />
              <span className="recruiter-dashboard__logo-text">TalentScout</span>
            </div>
            <h1>Welcome, Recruiter</h1>
          </div>
          
          <div className="recruiter-dashboard__navbar-right">
            <div className="recruiter-dashboard__search-container">
              <input
                type="text"
                placeholder="Search jobs or candidates..."
                className="recruiter-dashboard__search-input"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="recruiter-dashboard__search-icon" />
            </div>
            
            <div className="recruiter-dashboard__notification-badge">
              <Bell className="recruiter-dashboard__notification-icon" />
              {notificationCount > 0 && (
                <span className="recruiter-dashboard__badge">{notificationCount}</span>
              )}
            </div>
            
            <div className="recruiter-dashboard__profile-container" onClick={() => setShowProfileDropdown(!showProfileDropdown)}>
              <img
                src=""
                alt="Profile"
                className="recruiter-dashboard__profile-image"
              />
              <span className="recruiter-dashboard__profile-name">{username}</span>
              <ChevronDown className="recruiter-dashboard__dropdown-icon" />
              
              {showProfileDropdown && (
                <div className="recruiter-dashboard__profile-dropdown">
                  <button onClick={handleLogout} className="recruiter-dashboard__logout-button">
                    <LogOut className="recruiter-dashboard__logout-icon" />
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      <div className="recruiter-dashboard__container">
        <main className="recruiter-dashboard__main-content">
          <div className="recruiter-dashboard__stats-grid recruiter-dashboard__fade-in">
            <div className="recruiter-dashboard__stat-card">
              <div className="recruiter-dashboard__stat-content">
                <div className="recruiter-dashboard__icon-container recruiter-dashboard__icon-blue">
                  <Users className="recruiter-dashboard__stat-icon" />
                </div>
                <div>
                  <Link to="/view-job">
                  <p className="recruiter-dashboard__stat-label">Total Applications</p>
                  <p className="recruiter-dashboard__stat-value">{dashboardStats.totalApplications}</p>
                  </Link>

                </div>
              </div>
            </div>
            
            <div className="recruiter-dashboard__stat-card">
              <div className="recruiter-dashboard__stat-content">
                <div className="recruiter-dashboard__icon-container recruiter-dashboard__icon-green">
                  <Briefcase className="recruiter-dashboard__stat-icon" />
                </div>
                <div>
                <Link to="/view-job">
                  <p className="recruiter-dashboard__stat-label">Interviews Scheduled</p>
                  <p className="recruiter-dashboard__stat-value">{dashboardStats.activeJobs}</p>
                </Link>
                </div>
              </div>
            </div>
            
            <div className="recruiter-dashboard__stat-card">
              <div className="recruiter-dashboard__stat-content">
                <div className="recruiter-dashboard__icon-container recruiter-dashboard__icon-purple">
                  <Star className="recruiter-dashboard__stat-icon" />
                </div>
                <div>
                  <p className="recruiter-dashboard__stat-label">Average Interview Score</p>
                  <p className="recruiter-dashboard__stat-value">{dashboardStats.averageScore}%</p>
                </div>
              </div>
            </div>

            <div className="recruiter-dashboard__stat-card">
              <div className="recruiter-dashboard__stat-content">
                <div className="recruiter-dashboard__icon-container recruiter-dashboard__icon-orange">
                  <Briefcase className="recruiter-dashboard__stat-icon" />
                </div>
                <div>
                <Link to="/view-job">
                  <p className="recruiter-dashboard__stat-label">Active Job Posts</p>
                  <p className="recruiter-dashboard__stat-value">{dashboardStats.activeJobs}</p>
                </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="recruiter-dashboard__quick-actions recruiter-dashboard__fade-in">
            <div className="recruiter-dashboard__action-card" onClick={handleIconClick}>
              <div className="recruiter-dashboard__action-content">
                <div>
                  <h3 className="recruiter-dashboard__action-title">Post a New Job</h3>
                  <p className="recruiter-dashboard__action-description">Create a new job posting and find the perfect candidates</p>
                </div>
                <div className="recruiter-dashboard__icon-container recruiter-dashboard__icon-blue">
                  <Plus className="recruiter-dashboard__action-icon" />
                </div>
              </div>
            </div>

            <div className="recruiter-dashboard__action-card" onClick={handleIconPostClick}>
              <div className="recruiter-dashboard__action-content">
                <div>
                  <h3 className="recruiter-dashboard__action-title">View Posted Jobs</h3>
                  <p className="recruiter-dashboard__action-description">Manage and track your active job postings</p>
                </div>
                <div className="recruiter-dashboard__icon-container recruiter-dashboard__icon-green">
                  <Briefcase className="recruiter-dashboard__action-icon" />
                </div>
              </div>
            </div>
          </div>

          <div className="recruiter-dashboard__table-container recruiter-dashboard__fade-in">
            <div className="recruiter-dashboard__table-header">
              <h2 className="recruiter-dashboard__table-title">Recent Job Posts</h2>
              <Link to="/view-job"
                
                className="recruiter-dashboard__view-all-button"
              >
                View all
                <ChevronRight className="recruiter-dashboard__chevron-icon" />
              </Link>
            </div>

            <div className="recruiter-dashboard__table-scroll">
              <table className="recruiter-dashboard__table">
                <thead>
                  <tr>
                    <th>Job Title</th>
                    <th>Skills Required</th>
                    <th>Posted Date</th>
                    <th>Applicants</th>
                  </tr>
                </thead>
                <tbody>
                  {jobPosts.slice(0, 2).map((post, index) => (
                    <tr key={`job-post-${post.id}-${index}`}>
                      <td>
                        <span className="recruiter-dashboard__job-title">{post.job_title}</span>
                      </td>
                      <td>
                        <div className="recruiter-dashboard__skills-container">
                          {getSkillsArray(post.skills).map((skill, idx) => (
                            <span 
                              key={idx}
                              className="recruiter-dashboard__skill-tag"
                            >
                              {skill}
                            </span>
                          ))}
                        </div>
                      </td>
                      <td className="recruiter-dashboard__posted-date">
                        {new Date(post.posted_at).toLocaleDateString()}
                      </td>
                      <td>
                        {post.applicants && post.applicants.length > 0 ? (
                          <div className="recruiter-dashboard__applicant-list">
                            {post.applicants.map((applicant, idx) => (
                              <div 
                                key={`applicant-${post.id}-${idx}`}
                                className="recruiter-dashboard__applicant-item"
                              >
                                <div className="recruiter-dashboard__applicant-avatar">
                                  {applicant.candidate_name.charAt(0).toUpperCase()}
                                </div>
                                <span className="recruiter-dashboard__applicant-name">{applicant.candidate_name}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="recruiter-dashboard__no-applicants">No applicants yet</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default RecruiterDashboard;