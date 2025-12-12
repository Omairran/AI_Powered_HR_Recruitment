import React, { useState,useEffect } from 'react';
import axiosInstance from '../api/axiosConfig';
import { 
  BriefcaseIcon, PlayIcon, NewspaperIcon, 
  LogOutIcon, BellIcon, UserCircleIcon, SearchIcon,
  CalendarIcon, CheckCircleIcon, ClockIcon, Building2Icon,
  TrendingUpIcon, AwardIcon, MessageSquareIcon,
  BookOpenIcon, GraduationCapIcon, ScrollIcon, 
  BarChartIcon, CalendarClockIcon, StarIcon,
  FileTextIcon, MapPinIcon, UsersIcon, HeartIcon,ChevronRight
} from 'lucide-react';
import "../../styles/CandidateDashboard.css";
import Arbisoft from '../../assets/Arbisoft.jpg';
import Netsol from '../../assets/netsol.jpg';
import zubair from "../../assets/zubair.jpg";
import axios from "axios";

import {useLocation, useNavigate,Link } from 'react-router-dom';

const CandidateDashboard = () => {
  const [activeTab, setActiveTab] = useState('home');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [jobPosts, setJobPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [applicationCount, setApplicationCount] = useState(0); // New state for application count
  const [candidateId, setCandidateId] = useState(null);
  const [jobs, setJobs] = useState([]);

  const [error, setError] = useState(null);
  const [applications, setApplications] = useState([]);
  const [username, setUsername] = useState(localStorage.getItem('username') || 'Guest');
  const [profileImage, setProfileImage] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [name,setName]=useState()
  const navigate = useNavigate();

  // Function to format relative time
  const getRelativeTime = (dateString) => {
    const now = new Date();
    const posted = new Date(dateString);
    const diffInSeconds = Math.floor((now - posted) / 1000);
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    const diffInHours = Math.floor(diffInMinutes / 60);
    const diffInDays = Math.floor(diffInHours / 24);

    if (diffInSeconds < 60) return 'just now';
    if (diffInMinutes < 60) return `${diffInMinutes}m`;
    if (diffInHours < 24) return `${diffInHours}h`;
    if (diffInDays < 7) return `${diffInDays}d`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w`;
    return `${Math.floor(diffInDays / 30)}mo`;
  };
  // useEffect(() => {
  //   const fetchJobs = async () => {
  //     try {
  //       const response = await fetch('http://127.0.0.1:8000/api/job_posting/publicposts/');
  //       if (!response.ok) {
  //         throw new Error('Failed to fetch jobs');
  //       }
  //       const data = await response.json();
  //       console.log('data',data)
  //       const sortedJobs = data
  //         .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
  //         .slice(0, 2);
  //       setJobPosts(sortedJobs);
  //       console.log('jobPosts',jobPosts)
  //     } catch (err) {
  //       setError(err.message);
  //     } finally {
  //       setLoading(false);
  //     }
  //   };

  //   fetchJobs();
  // }, []);

  useEffect(() => {
      const fetchJobs = async () => {
        setLoading(true);
        const accessToken = localStorage.getItem('access');
        
        try {
          const response = await fetch('http://127.0.0.1:8000/api/job_posting/publicposts/', {
            headers: {
              'Authorization': `Bearer ${accessToken}`
            }
          });
  
          if (!response.ok) {
            throw new Error('Failed to fetch jobs');
          }
  
          const data = await response.json();
          // Sort jobs by date before setting them
          const sortedJobs = data
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 2);
          setJobPosts(sortedJobs);
          // setFilteredJobs(sortedJobs);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
  
      fetchJobs();
    }, []);
  

  
  useEffect(() => {
    const fetchApplications = () => {
      axiosInstance.get('job_posting/candidate/applied-jobs/')
        .then((response) => {
          const data = response.data;
          const sortedApplications = data
            .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
            .slice(0, 2);
          setApplications(sortedApplications);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    };

    fetchApplications();
  }, []);
  
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
    axiosInstance
      .get('job_posting/candidate/applied-jobs/')
      .then((response) => {
        const jobsData = response.data;
        setJobs(jobsData);
        setApplicationCount(jobsData.length); // Count the number of jobs
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  };

  useEffect(() => {
    const fetchProfileImage = async () => {
        try {
            const accessToken = localStorage.getItem('access');
            
            if (!accessToken) {
                console.error('No access token found');
                return;
            }

            const response = await axios.get('http://localhost:8000/api/authentication/profile/image/', {
                headers: {
                    'Authorization': `Bearer ${accessToken}`
                }
            });
            console.log(response.data.profile_image)
            if (response.data.profile_image && response.data.candidate_name) {
                setProfileImage(response.data.profile_image);
                setName(response.data.candidate_name);

            }
        } catch (error) {
            console.error('Error fetching profile image:', error);
            // If token expired, you might want to use the refresh token here
        }
    };

    fetchProfileImage();
}, []);

/// Add this function to handle file selection and upload
const handleImageChange = async (event) => {
  const file = event.target.files[0];
  if (!file) return;

  // Basic validation
  if (!file.type.startsWith('image/')) {
    alert('Please select an image file');
    return;
  }

  try {
    setIsUploading(true);

    // Create FormData to send file
    const formData = new FormData();
    formData.append('profile_image', file);

    const accessToken = localStorage.getItem('access');
    
    const response = await axios.post(
      'http://localhost:8000/api/authentication/profile/image/upload/',
      formData,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'multipart/form-data',
        }
      }
    );

    if (response.data.profile_image) {
      setProfileImage(response.data.profile_image);
    }
  } catch (error) {
    if (error.response) {
      alert(error.response.data.error);
    } else {
      console.error('Error uploading image:', error);
      alert('Failed to upload image');
    }
  } finally {
    setIsUploading(false);
  }
};

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case 'applied':
        return 'pending';
      case 'interview done':
        return 'success';
      default:
        return '';
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  const savedJobs = [
    { role: 'Senior Frontend Developer', company: 'Arbisoft', location: 'Islamabad', salary: '$140k-180k' },
    { role: 'Lead UI Engineer', company: 'Netsol', location: 'Lahore', salary: '$160k-200k' }
  ];

  const courses = [
    { title: 'System Design', progress: 70, icon: GraduationCapIcon },
    { title: 'AWS Certification', progress: 45, icon: ScrollIcon }
  ];

  const events = [
    { date: '25', month: 'May', title: 'Open House 2025, Namal', type: 'Campus', time: '9:00 AM' },
    { date: '26', month: 'May', title: 'Career Fair 2025, Namal', type: 'Campus', time: '10:00 AM' }
  ];
  
  const handleLogout = () => {
    localStorage.removeItem('username');
    localStorage.removeItem('access');
    localStorage.removeItem('refresh');
    navigate("/logout")
    console.log('Logging out...');
  };
  const handleSeePosts = () => {
    navigate("/publicposts")
    // console.log('Logging out...');
  };
  const handleAppliedPosts = () => {
    navigate("/applied-jobs")
    // console.log('Logging out...');
  };
  return (
    <div className="dashboard-container">
      <nav className="nav-container">
        <div className="nav-content">
          <div className="nav-left">
            <h1 className="logo">TalentScout</h1>
            <div className="search-wrapper">
              <SearchIcon className="search-icon" />
              <input type="text" className="search-input" placeholder="Search opportunities..." />
            </div>
          </div>
          
          <div className="nav-right">
            <button className="icon-button">
              <BellIcon />
              <span className="notification-badge">3</span>
            </button>
            <div className="profile-dropdown">
              <div 
                className="user-profile"
                onClick={() => setShowProfileMenu(!showProfileMenu)}
              >
                <img 
                src={profileImage ? `${profileImage}` : '/path/to/default-avatar.png'} 
                alt="Profile" 
                className="profile-image" 
            />            
                <span className="user-name">{name}</span>
              </div>
              
              {showProfileMenu && (
                <div className="profile-menu">
                  {/* <button className="profile-menu-item" onClick={() => setShowProfileMenu(false)}>
                    <UserCircleIcon className="menu-icon" />
                    View Profile
                  </button> */}
                  <button className="profile-menu-item" onClick={handleLogout}>
                    <LogOutIcon className="menu-icon" />
                    Logout
                  </button>
                </div>
              )}
              </div>
          </div>
        </div>
      </nav>


      <div className="dashboard-grid">
        {/* Left Sidebar */}
        <aside className="sidebar">
          <div className="profile-card">
          <img 
            src={profileImage ? `${profileImage}` : '/path/to/default-avatar.png'} 
            alt="Profile" 
            className="profile-image" 
        />
           {!profileImage && (  // Only show upload button if no image exists
            <div className="upload-overlay">
              <input
                type="file"
                id="profile-image-upload"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
              <label 
                htmlFor="profile-image-upload"
                className="upload-button"
              >
                {isUploading ? 'Uploading...' : 'Upload Photo'}
              </label>
            </div>
          )}
            <h2 className="profile-name">{name}</h2>
            <p className="profile-title">Software Engineer</p>
            <div className="profile-stats">
              <Link to="/applied-jobs">
              <div className="stat">
                <span className="stat-value">{applicationCount}</span>
                <span className="stat-label">Applications</span>
              </div>
              </Link>
              <div className="stat">
                <span className="stat-value">{applicationCount}</span>
                <span className="stat-label">Interviews</span>
              </div>
            </div>
          </div>
          
          <div className="skills-section">
            <h3>Top Skills</h3>
            <div className="skills-list">
              <span className="skill-tag">React</span>
              <span className="skill-tag">Node.js</span>
              <span className="skill-tag">TypeScript</span>
              <span className="skill-tag">AWS</span>
            </div>
          </div>

          <div className="preferences-section">
            <h3>Job Preferences</h3>
            <div className="preferences-list">
              <div className="preference-item">
                <h4>Desired Role</h4>
                <p>Junior Full Stack Developer</p>
              </div>
              <div className="preference-item">
                <h4>Lahore</h4>
                <p>Arbisoft/Onsite</p>
              </div>
              <div className="preference-item">
                <h4>Expected Salary</h4>
                <p>$120k - $150k</p>
              </div>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="main-content">
          {/* Quick Actions */}
          <div className="action-grid">
            <div className="action-card interview-card">
              <div className="card-header">
                <PlayIcon className="card-icon" />
                <h2>Recent Posts</h2>

                <Link to="/publicposts"
                className="recruiter-dashboard__view-all-button"
              >
                View all Posts
                <ChevronRight className="recruiter-dashboard__chevron-icon" />
              </Link>
            </div>
              <div className="interview-list">
              {jobPosts.map((job, index) => (
                  <div key={job.id || index} 
                  className="interview-item">
                    <CalendarIcon className="item-icon" />
                    <div className="item-details">
                      <h3>{job.title}</h3>
                      <p>{job.location}</p>
                      <span>Posted {getRelativeTime(job.created_at)}</span>


                    </div>
                    <button className="btn-primary" onClick={handleSeePosts}>View</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="action-card applications-card">
              <div className="card-header">
                <BriefcaseIcon className="card-icon" />
                <h2>Recent Applications</h2>

                <Link 
                to="/applied-jobs"
                className="recruiter-dashboard__view-all-button"
              >
                View all Applications
                <ChevronRight className="recruiter-dashboard__chevron-icon" />
              </Link>
              </div>
              <div className="applications-list">
              {applications.map((app, index) => (

                <div key={app.id || index} className="application-item">
                    <div className="item-details">
                    <h3>{app.title}</h3>
                        <p>{app.location}</p>
                        {/* <span className={`status ${getStatusClass(app.status)}`}>
                            {app.status}
                        </span> */}
                    </div>
                    <button className="btn-outline" onClick={handleAppliedPosts}>View</button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Progress Section */}
          <div className="progress-section">
            <div className="section-header">
              <BarChartIcon className="section-icon" />
              <h2>Career Progress</h2>
            </div>
            <div className="progress-stats">
              <div className="progress-item">
                <div className="progress-bar" style={{width: '75%'}}></div>
                <p>Profile Completion</p>
              </div>
              <div className="progress-item">
                <div className="progress-bar" style={{width: '60%'}}></div>
                <p>Interview Success Rate</p>
              </div>
            </div>
          </div>

          {/* Learning and Events Grid */}
          <div className="additional-sections">
            <div className="learning-section">
              <div className="section-header">
                <BookOpenIcon className="section-icon" />
                <h2>Learning Path</h2>
              </div>
              <div className="courses-grid">
                {courses.map((course, index) => (
                  <div key={index} className="course-card">
                    <course.icon className="course-icon" />
                    <h3>{course.title}</h3>
                    <p>{course.progress}% Complete</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="events-section">
              <div className="section-header">
                <CalendarClockIcon className="section-icon" />
                <h2>Events & Workshops</h2>
              </div>
              <div className="events-list">
                {events.map((event, index) => (
                  <div key={index} className="event-item">
                    <div className="event-date">
                      <span>{event.date}</span>
                      <span>{event.month}</span>
                    </div>
                    <div className="event-details">
                      <h3>{event.title}</h3>
                      <p>{event.type} • {event.time}</p>
                    </div>
                    <button className="btn-outline">Join</button>
                  </div>
                ))}
              </div>
            </div>

            <div className="network-section">
              <div className="section-header">
                <UsersIcon className="section-icon" />
                <h2>Professional Network</h2>
              </div>
              <div className="network-stats">
                <div className="stat-card">
                  <h3>250+</h3>
                  <p>Connections</p>
                </div>
                <div className="stat-card">
                  <h3>15</h3>
                  <p>Endorsements</p>
                </div>
              </div>
            </div>

            <div className="saved-section">
              <div className="section-header">
                <HeartIcon className="section-icon" />
                <h2>Saved Jobs</h2>
              </div>
              <div className="saved-jobs">
                {savedJobs.map((job, index) => (
                  <div key={index} className="saved-job-item">
                    <div className="company-logo">
                    <img 
                    src={job.company === 'Arbisoft' ? Arbisoft : Netsol} 
                    alt={job.company} 
                    className="company-logo-img"
        />
                    </div>
                    <div className="job-details">
                      <h3>{job.role}</h3>
                      <p>{job.company} • {job.location}</p>
                    </div>
                    <span className="salary-tag">{job.salary}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="documents-section">
              <div className="section-header">
                <FileTextIcon className="section-icon" />
                <h2>My Documents</h2>
              </div>
              <div className="documents-grid">
                <div className="document-card">
                  <FileTextIcon className="document-icon" />
                  <span>Resume.pdf</span>
                </div>
                <div className="document-card">
                  <ScrollIcon className="document-icon" />
                  <span>Certificates</span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats Section */}
          <div className="stats-section">
            <div className="stats-card">
              <TrendingUpIcon className="stats-icon" />
              <div className="stats-info">
                <span className="stats-value">85%</span>
                <span className="stats-label">Profile Match Rate</span>
              </div>
            </div>
            <div className="stats-card">
              <AwardIcon className="stats-icon" />
              <Link to="/applied-jobs">
              <div className="stats-info">
                
                <span className="stats-value">{applicationCount}</span>
                <span className="stats-label">Total Applications</span>
                
              </div>
              </Link>
            </div>
            <div className="stats-card">
              <MessageSquareIcon className="stats-icon" />
              <div className="stats-info">
                <span className="stats-value">{applicationCount}</span>
                <span className="stats-label">Interviews</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default CandidateDashboard;