import React, { useState } from 'react';
import axios from 'axios';
import './Register.css';

const Register = ({ userType, onRegisterSuccess, onBack }) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    first_name: '',
    last_name: '',
    phone: '',
    company: '' // Only for HR
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
    setError('');

    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    // Validate password strength
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);

    try {
      const registerData = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        user_type: userType,
        first_name: formData.first_name,
        last_name: formData.last_name,
        phone: formData.phone,
      };

      if (userType === 'hr') {
        registerData.company = formData.company;
      }

      const response = await axios.post('http://localhost:8000/api/auth/register/', registerData);

      // Save token and user data
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      // Call success callback
      onRegisterSuccess(response.data);

    } catch (error) {
      console.error('Registration error:', error);
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else {
        setError('Registration failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <div className="register-split-container">

        {/* Left Panel - Branding */}
        <div className="register-left-panel">
          <div className="register-left-content">
            <div className="panel-icon-circle">
              {userType === 'candidate' ? '👤' : '💼'}
            </div>
            <h1>Join AI Recruitment</h1>
            <p className="panel-subtitle">
              {userType === 'candidate'
                ? 'Unlock your career potential with AI-driven matching.'
                : 'Find the perfect talent efficiently with smart insights.'}
            </p>

            <div className="feature-list">
              <div className="feature-item">
                <span className="feature-icon">✨</span>
                <span>Smart Resume Parsing</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🎯</span>
                <span>Accurate Job Matching</span>
              </div>
              <div className="feature-item">
                <span className="feature-icon">🚀</span>
                <span>Streamlined Handling</span>
              </div>
            </div>
          </div>
          <div className="panel-overlay"></div>
        </div>

        {/* Right Panel - Form */}
        <div className="register-right-panel">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>

          <div className="register-form-container">
            <div className="register-header">
              <h2>Create Account</h2>
              <p>{userType === 'candidate' ? 'Candidate Registration' : 'HR Recruiter Registration'}</p>
            </div>

            {error && (
              <div className="error-message">
                ❌ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="register-form">
              <div className="form-row">
                <div className="form-group">
                  <label>First Name *</label>
                  <input
                    type="text"
                    name="first_name"
                    value={formData.first_name}
                    onChange={handleChange}
                    placeholder="John"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Last Name *</label>
                  <input
                    type="text"
                    name="last_name"
                    value={formData.last_name}
                    onChange={handleChange}
                    placeholder="Doe"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Username *</label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  placeholder="john_doe"
                  required
                />
              </div>

              <div className="form-group">
                <label>Email *</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div className="form-group">
                <label>Phone</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+92 300 1234567"
                />
              </div>

              {userType === 'hr' && (
                <div className="form-group">
                  <label>Company Name *</label>
                  <input
                    type="text"
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    placeholder="Tech Corp Inc."
                    required
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="******"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Confirm *</label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="******"
                    required
                  />
                </div>
              </div>

              <button type="submit" className="btn-register" disabled={loading}>
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </form>

            <div className="register-footer">
              <p>
                Already have an account?{' '}
                <span className="link" onClick={() => onBack('login')}>
                  Login here
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Register;