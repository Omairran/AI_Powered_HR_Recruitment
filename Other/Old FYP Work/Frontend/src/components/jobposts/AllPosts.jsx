import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft as ArrowLeftIcon, Clock as ClockIcon, Search as SearchIcon, Filter as FilterIcon,Briefcase } from 'lucide-react';
import '../../styles/shared.css';
import "../../styles/filter.css"; // Assuming AllPosts uses filter.css

const AllPosts = () => {
  const [allJobs, setAllJobs] = useState([]);
  const [filteredJobs, setFilteredJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [hoveredId, setHoveredId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    experience_level: '',
    skills: '',
    posted_within: '',
    jobTitle: '', // Added new filter for job title
  });
  const [showFilters, setShowFilters] = useState(false);
  const navigate = useNavigate();

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
        const sortedJobs = data.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        setAllJobs(sortedJobs);
        setFilteredJobs(sortedJobs);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobs();
  }, []);

  useEffect(() => {
    let result = [...allJobs];

    // Apply search filter
    if (searchTerm.trim()) {
      const searchLower = searchTerm.toLowerCase().trim();
      result = result.filter(job => 
        job.title.toLowerCase().includes(searchLower) ||
        job.description.toLowerCase().includes(searchLower)
      );
    }

    // Apply job title filter
    if (filters.jobTitle.trim()) {
      const titleLower = filters.jobTitle.toLowerCase().trim();
      result = result.filter(job => 
        job.title.toLowerCase().includes(titleLower)
      );
    }

    // Apply experience level filter
    if (filters.experience_level) {
      result = result.filter(job => 
        job.experience_level.toLowerCase() === filters.experience_level.toLowerCase()
      );
    }

    // Apply skills filter
    if (filters.skills.trim()) {
      const searchSkills = filters.skills.toLowerCase().split(',').map(skill => skill.trim());
      result = result.filter(job => {
        const jobSkills = job.skills.map(skill => skill.toLowerCase());
        return searchSkills.some(searchSkill => 
          jobSkills.some(jobSkill => jobSkill.includes(searchSkill))
        );
      });
    }

    // Apply posted within filter
    if (filters.posted_within) {
      const now = new Date();
      const jobDate = (date) => new Date(date);
      
      result = result.filter(job => {
        const timeDiff = now - jobDate(job.created_at);
        const daysDiff = timeDiff / (1000 * 60 * 60 * 24);

        switch (filters.posted_within) {
          case '1h':
            return daysDiff <= 1/24;
          case '24h':
            return daysDiff <= 1;
          case '7d':
            return daysDiff <= 7;
          case '30d':
            return daysDiff <= 30;
          default:
            return true;
        }
      });
    }

    // Sort the filtered results by date (most recent first)
    result.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    
    setFilteredJobs(result);
  }, [searchTerm, filters, allJobs]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const clearFilters = () => {
    setFilters({
      experience_level: '',
      skills: '',
      posted_within: '',
      jobTitle: '', // Clear job title filter as well
      // Location:'',
    });
    setSearchTerm('');
  };

  const handleApplyJob = (job) => {
    navigate('/application-form', { state: { jobData: job } });
  };

  const formatPostedDate = (dateString) => {
    const now = new Date();
    const createdAt = new Date(dateString);
    const diffInSeconds = Math.floor((now - createdAt) / 1000);

    if (diffInSeconds < 60) return `${diffInSeconds}s ago`;
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)}mo ago`;
    return `${Math.floor(diffInSeconds / 31536000)}y ago`;
  };

  // const handleSearchChange = (e) => {
  //   setSearchTerm(e.target.value);
  // };

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
          <button className="btn btn-secondary" onClick={() => navigate('/candidate-dashboard')}>
            <ArrowLeftIcon size={16} /> Back
          </button>
          <h2 className="page-title">Available Job Positions</h2>
        </div>

        <div className="search-filter-container">
          <div className="search-bar">
            <SearchIcon size={20} />
            <input
              type="text"
              placeholder="Search by title or description..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <button
            className="btn btn-secondary filter-toggle"
            onClick={() => setShowFilters(!showFilters)}
          >
            <FilterIcon size={20} />
            {showFilters ? 'Hide Filters' : 'Show Filters'}
          </button>
        </div>

        {showFilters && (
          <div className="filters-panel">
            <div className="filter-group">
              <label>Job Title</label>
              <input
                type="text"
                name="jobTitle"
                value={filters.jobTitle}
                onChange={handleFilterChange}
                placeholder="Filter by job title..."
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Experience Level</label>
              <select
                name="experience_level"
                value={filters.experience_level}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">All Levels</option>
                <option value="Basic">Basic</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Expert">Expert</option>
              </select>
            </div>

            <div className="filter-group">
              <label>Skills (comma-separated)</label>
              <input
                type="text"
                name="skills"
                value={filters.skills}
                onChange={handleFilterChange}
                placeholder="e.g., Python, React, Django"
                className="filter-input"
              />
            </div>

            <div className="filter-group">
              <label>Posted Within</label>
              <select
                name="posted_within"
                value={filters.posted_within}
                onChange={handleFilterChange}
                className="filter-select"
              >
                <option value="">Any Time</option>
                <option value="1h">Last 1 hours</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
            </div>

            <button
              className="btn btn-secondary clear-filters"
              onClick={clearFilters}
            >
              Clear All Filters
            </button>
          </div>
        )}

        <div className="grid-container">
          {filteredJobs.length > 0 ? (
            filteredJobs.map((job) => (
              <div 
                key={job.id} 
                className={`card ${hoveredId === job.id ? 'card-hovered' : ''}`}
                onMouseEnter={() => setHoveredId(job.id)}
                onMouseLeave={() => setHoveredId(null)}
              >
                <div className="card-content">
                  <div className="time-badge">
                    <ClockIcon size={14} />
                    <span>{formatPostedDate(job.created_at)}</span>
                  </div>

                  <div className="card-body">
                  <Briefcase className="text-gray-600" size={20} />

                    <h3 className="card-title">{job.title}</h3>
                    
                    <div className="info-section">
                      <h4 className="section-title">Description</h4>
                      <p className="description-text">{job.description}</p>
                    </div>

                    <div className="info-section">
                      <h4 className="section-title">Required Skills</h4>
                      <div className="tags-container">
                        {job.skills.map((skill, index) => (
                          <span key={index} className="tag skill-tag">
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

                    <button
                      className={`btn btn-primary compact w-full ${hoveredId === job.id ? 'btn-hover' : ''}`}
                      onClick={() => handleApplyJob(job)}
                    >
                      Apply Now
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <p className="empty-text">No jobs match your search criteria.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AllPosts;