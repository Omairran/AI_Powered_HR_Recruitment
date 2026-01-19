import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import './CandidateDashboard.css';

const CandidateDashboard = ({ onNavigate }) => {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [stats, setStats] = useState({
        total: 0,
        reviewing: 0,
        interview: 0,
        rejected: 0,
        hired: 0
    });

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            setError(null);
            // Use api instance to ensure auth headers are sent
            const response = await api.get('/job-applications/');

            // API might return standard pagination { count: 10, results: [...] } or just [...]
            let data = [];
            if (Array.isArray(response.data)) {
                data = response.data;
            } else if (response.data && Array.isArray(response.data.results)) {
                data = response.data.results;
            } else {
                console.warn('Unexpected API response format:', response.data);
                data = [];
            }

            setApplications(data);
            calculateStats(data);
        } catch (error) {
            console.error('Error fetching applications:', error);
            setError('Failed to load applications. Please try again.');
            setApplications([]);
        } finally {
            setLoading(false);
        }
    };

    const calculateStats = (apps) => {
        const newStats = {
            total: apps.length,
            reviewing: apps.filter(a => ['applied', 'reviewing', 'shortlisted'].includes(a.status)).length,
            interview: apps.filter(a => a.status === 'interviewed').length,
            rejected: apps.filter(a => a.status === 'rejected').length,
            hired: apps.filter(a => ['offered', 'hired'].includes(a.status)).length
        };
        setStats(newStats);
    };

    const getStatusBadge = (status) => {
        // Map backend status to UI friendly badges
        const styles = {
            'applied': 'badge-gray',
            'screening': 'badge-blue', // Map screening to blue
            'reviewing': 'badge-blue',
            'shortlisted': 'badge-purple',
            'interview': 'badge-yellow', // Map interview to yellow
            'interviewed': 'badge-yellow',
            'offered': 'badge-green',
            'hired': 'badge-green',
            'rejected': 'badge-red'
        };

        // Handle case sensitivity or missing statuses
        const statusKey = (status || '').toLowerCase();
        // Default to gray if unknown
        const badgeClass = styles[statusKey] || 'badge-gray';

        return <span className={`status-badge ${badgeClass}`}>{status || 'Unknown'}</span>;
    };

    if (loading) return (
        <div className="dashboard-container">
            <div className="loading-spinner"></div>
            <p style={{ textAlign: 'center', marginTop: '1rem' }}>Loading your applications...</p>
        </div>
    );

    if (error) return (
        <div className="dashboard-container">
            <div className="empty-state">
                <p className="error-text">⚠️ {error}</p>
                <button onClick={fetchApplications} className="btn-secondary">Try Again</button>
            </div>
        </div>
    );

    return (
        <div className="dashboard-container">
            <div className="dashboard-header">
                <h2>👋 My Dashboard</h2>
                <p>Track your job applications and status</p>
            </div>

            <div className="stats-grid">
                <div className="stat-card">
                    <h3>{stats.total}</h3>
                    <p>Total Applications</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.reviewing}</h3>
                    <p>In Review</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.interview}</h3>
                    <p>Interviews</p>
                </div>
                <div className="stat-card">
                    <h3>{stats.hired}</h3>
                    <p>Offers</p>
                </div>
            </div>

            <div className="applications-section">
                <h3>My Applications</h3>
                {applications.length === 0 ? (
                    <div className="empty-state">
                        <p>You haven't applied to any jobs yet.</p>
                        <button onClick={() => onNavigate('jobs')} className="btn-primary">Browse Jobs</button>
                    </div>
                ) : (
                    <div className="table-responsive">
                        <table className="applications-table">
                            <thead>
                                <tr>
                                    <th>Job Title</th>
                                    <th>Company</th>
                                    <th>Applied Date</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {applications.map(app => (
                                    <tr key={app.id}>
                                        <td>{app.job_details?.title || app.job_title || 'Unknown Role'}</td>
                                        <td>{app.job_details?.company || 'Unknown Company'}</td>
                                        <td>{new Date(app.applied_at).toLocaleDateString()}</td>
                                        <td>{getStatusBadge(app.status)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CandidateDashboard;
