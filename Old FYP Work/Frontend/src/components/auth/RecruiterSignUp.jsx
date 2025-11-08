import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "../../styles/Login.css";

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [error, setError] = useState("");
  const [showError, setShowError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [activeField, setActiveField] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  const handleSignup = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setShowError(false);

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setShowError(true);
      setIsLoading(false);
      return;
    }

    try {
      // Send registration request to your Django backend
      await axios.post("http://localhost:8000/api/authentication/recruiter-request/", {
        username,
        email,
        organization,
        password,
      });

      // Redirect to pending verification page
      navigate("/pending-verification");
      
    } catch (err) {
      let errorMessage;
      if (err.response) {
        switch (err.response.status) {
          case 400:
            errorMessage = err.response.data.error || "Please fill in all fields correctly.";
            break;
          case 409:
            errorMessage = "Username or email already exists.";
            break;
          default:
            errorMessage = err.response.data.error || "Signup request failed. Please try again.";
        }
      } else if (err.request) {
        errorMessage = "Cannot connect to server. Please check your internet connection.";
      } else {
        errorMessage = "An unexpected error occurred. Please try again.";
      }
      setError(errorMessage);
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={`login-page ${mounted ? 'fade-in' : ''}`}>
      <div className="background-circles">
        <div className="circle"></div>
        <div className="circle"></div>
      </div>

      <div className="animated-background">
        <div className="gradient-sphere"></div>
      </div>

      <div className="login-container signup-container">
        {/* Left Side - Branding */}
        <div className="branding-section">
          <div className="brand-content">
            <h1 className="main-title">
              Welcome to{' '}
              <span className="gradient-text">AI-Powered Interviewing System</span>
            </h1>
            <p className="subtitle">
              Join our platform as a recruiter and revolutionize your hiring process
            </p>
            
            <div className="features-grid">
              {[
                { title: 'AI-Powered Interviews', icon: '🤖', delay: '0s' },
                { title: 'Secure Platform', icon: '🔒', delay: '0.2s' },
                { title: 'Advanced Analytics', icon: '📊', delay: '0.4s' },
                { title: 'Smart Hiring', icon: '🎯', delay: '0.6s' }
              ].map((feature) => (
                <div 
                  key={feature.title}
                  className="feature-card"
                  style={{ '--delay': feature.delay }}
                >
                  <div className="feature-icon">{feature.icon}</div>
                  <p>{feature.title}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Side - Signup Form */}
        <div className="form-section">
          <div className="login-form-container signup-form-container">
            <div className="form-header">
              <h2 className="form-title gradient-text">Create Recruiter Account</h2>
              <p className="form-subtitle">Join our platform to streamline your hiring process</p>
            </div>
            
            <form onSubmit={handleSignup} className="login-form">
              <label className="input-label" htmlFor="username">Username</label>
              <div className={`input-group floating-label ${activeField === 'username' ? 'focused' : ''}`}>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setActiveField('username')}
                  onBlur={() => setActiveField('')}
                  className="input-field text-left"
                  placeholder="Enter your username"
                  required
                />
                <div className="input-border"></div>
              </div>

              <label className="input-label" htmlFor="email">Email</label>
              <div className={`input-group floating-label ${activeField === 'email' ? 'focused' : ''}`}>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setActiveField('email')}
                  onBlur={() => setActiveField('')}
                  className="input-field text-left"
                  placeholder="Enter your email"
                  required
                />
                <div className="input-border"></div>
              </div>

              <label className="input-label" htmlFor="organization">Organization</label>
              <div className={`input-group floating-label ${activeField === 'organization' ? 'focused' : ''}`}>
                <input
                  type="text"
                  id="organization"
                  value={organization}
                  onChange={(e) => setOrganization(e.target.value)}
                  onFocus={() => setActiveField('organization')}
                  onBlur={() => setActiveField('')}
                  className="input-field text-left"
                  placeholder="Enter your organization name"
                  required
                />
                <div className="input-border"></div>
              </div>

              <label className="input-label" htmlFor="password">Password</label>
              <div className={`input-group floating-label ${activeField === 'password' ? 'focused' : ''}`}>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setActiveField('password')}
                  onBlur={() => setActiveField('')}
                  className="input-field text-left"
                  placeholder="Enter your password"
                  required
                />
                <div className="input-border"></div>
              </div>

              <label className="input-label" htmlFor="confirmPassword">Confirm Password</label>
              <div className={`input-group floating-label ${activeField === 'confirmPassword' ? 'focused' : ''}`}>
                <input
                  type="password"
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setActiveField('confirmPassword')}
                  onBlur={() => setActiveField('')}
                  className="input-field text-left"
                  placeholder="Confirm your password"
                  required
                />
                <div className="input-border"></div>
              </div>

              {showError && (
                <div className="error-message">
                  <div className="error-icon">⚠️</div>
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="login-button"
              >
                <div className="button-content">
                  {isLoading ? (
                    <>
                      <div className="modern-spinner"></div>
                      <span>Submitting Request...</span>
                    </>
                  ) : (
                    <>
                      <span>Request Access</span>
                      <span className="button-icon">→</span>
                    </>
                  )}
                </div>
              </button>

              <div className="links-section">
                <p>
                  Already have an account?{" "}
                  <a href="/recruiter-login" className="modern-link">
                    <span className="link-text">Login here</span>
                  </a>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;