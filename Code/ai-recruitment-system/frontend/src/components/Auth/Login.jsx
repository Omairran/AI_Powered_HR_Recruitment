import React, { useState } from 'react';
import axios from 'axios';
import './Login.css';

const Login = ({ userType, onLoginSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await axios.post('http://localhost:8000/api/auth/login/', formData);
      
      // Check if user type matches
      if (response.data.user.user_type !== userType) {
        setError(`This account is registered as ${response.data.user.user_type}. Please use the correct login.`);
        setLoading(false);
        return;
      }

      // Save token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      if (response.data.candidate_profile) {
        localStorage.setItem('candidate_profile', JSON.stringify(response.data.candidate_profile));
      }

      // Call success callback
      onLoginSuccess(response.data);

    } catch (error) {
      console.error('Login error:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Login failed. Please check your credentials.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <button className="back-button" onClick={onBack}>
          ← Back
        </button>

        <div className="login-header">
          <div className="login-icon">
            {userType === 'candidate' ? '👤' : '💼'}
          </div>
          <h2>
            {userType === 'candidate' ? 'Candidate Login' : 'HR Recruiter Login'}
          </h2>
          <p>Welcome back! Please login to continue</p>
        </div>

        {error && (
          <div className="error-message">
            ❌ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              placeholder="Enter your username"
              required
              autoFocus
            />
          </div>

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Enter your password"
              required
            />
          </div>

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? '⏳ Logging in...' : '🚀 Login'}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Don't have an account?{' '}
            <span className="link" onClick={() => onBack('register')}>
              Sign up here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;