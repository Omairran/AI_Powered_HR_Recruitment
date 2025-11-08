import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import '../../styles/Login.css'
const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
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

  const handleLogin = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    setShowError(false);

    try {
      const response = await axios.post(
        "http://localhost:8000/api/authentication/candidate/",
        {
          username,
          password,
        }
      );
      
      localStorage.setItem("access", response.data.access);
      localStorage.setItem("refresh", response.data.refresh);
      localStorage.setItem("username", username); // Add this line to store username

      navigate("/candidate-dashboard");
    } catch (err) {
      const errorMessage = "Incorrect username or password.";
      setError(errorMessage);
      setShowError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
        const response = await axios.post(
            "http://localhost:8000/api/authentication/google/auth/",
            {
                token: credentialResponse.credential,
            }
        );

        localStorage.setItem("access", response.data.access);
        localStorage.setItem("refresh", response.data.refresh);
        if (response.data.username) {
          localStorage.setItem("username", response.data.username);
        }
        navigate("/candidate-dashboard");
    } catch (err) {
        if (err.response && err.response.status === 400) {
            setError("Google authentication failed.");
        } else if (err.response && err.response.status === 409) {
            setError("An account with this email already exists.");
        } else {
            setError("Server error occurred.");
        }
        setShowError(true);
    }
};

  const FloatingElements = () => {
  const elements = Array.from({ length: 30 }, (_, index) => ({
    id: index,
    type: ['circle', 'square', 'triangle'][Math.floor(Math.random() * 3)],
    size: Math.random() * 10 + 5 + 'px',
    color: [
      'rgba(79, 70, 229, 0.2)',  // Indigo
      'rgba(236, 72, 153, 0.2)', // Pink
      'rgba(99, 102, 241, 0.2)'  // Blue
    ][Math.floor(Math.random() * 3)],
    left: Math.random() * 100 + 'vw',
    duration: Math.random() * 10 + 15 + 's',
    delay: Math.random() * 10 + 's',
    distance: (Math.random() * 200 - 100) + 'px',
    rotation: Math.random() * 720 - 360 + 'deg',
    maxOpacity: Math.random() * 0.3 + 0.1
  }));
}

  return (
    <div className={`login-page ${mounted ? 'fade-in' : ''}`}>
      <div className="background-circles">
        <div className="circle"></div>
        <div className="circle"></div>
      </div>
      

      <div className="animated-background">
        <div className="gradient-sphere"></div>
      </div>
      

      <div className="login-container">
        {/* Left Side - Branding */}
        <div className="branding-section">
          <div className="brand-content">
            <h1 className="main-title">
              Welcome to {' '}
              <span className="gradient-text">AI-Powered Interviewing System</span>
            </h1>
            <p className="subtitle">
              Transform your hiring process with intelligent interviews powered by AI
            </p>
            
            <div className="features-grid">
              {[
                { title: 'Smart Analysis', icon: '🔍', delay: '0s' },
                { title: 'Real-time Feedback', icon: '⚡', delay: '0.2s' },
                { title: 'AI Assessment', icon: '🤖', delay: '0.4s' },
                { title: 'Skill Evaluation', icon: '📊', delay: '0.6s' }
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

        {/* Right Side - Login Form */}
        <div className="form-section">
          <div className="login-form-container">
            <div className="form-header">
              <h2 className="form-title gradient-text">Candidate Login</h2>
            </div>
            
            <form onSubmit={handleLogin} className="login-form">
            <label htmlFor="username">Username</label>

              <div className={`input-group floating-label ${activeField === 'username' ? 'focused' : ''}`}>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onFocus={() => setActiveField('username')}
                  onBlur={() => setActiveField('')}
                  className="input-field"
                  placeholder=" "
                  required
                />
                <div className="input-border"></div>
              </div>
              
              <label htmlFor="password">Password</label>

              <div className={`input-group floating-label ${activeField === 'password' ? 'focused' : ''}`}>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setActiveField('password')}
                  onBlur={() => setActiveField('')}
                  className="input-field"
                  placeholder=" "
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
                      <span>Authenticating...</span>
                    </>
                  ) : (
                    <>
                      <span>Login</span>
                      <span className="button-icon">→</span>
                    </>
                  )}
                </div>
              </button>

              <div className="modern-divider">
                <div className="divider-line"></div>
                <span className="divider-text">or continue with</span>
                <div className="divider-line"></div>
              </div>

              <div className="google-login">
                <GoogleOAuthProvider clientId="305846523403-gjh733avsmqke5o2e5365fs4offlasv5.apps.googleusercontent.com">
                  <GoogleLogin
                    onSuccess={handleGoogleSuccess}
                    onError={() => setError("Google authentication failed")}
                    useOneTap
                    shape="rectangular"
                    theme="filled_blue"
                    text="continue_with"
                    size="large"
                    width="100%"
                  />
                </GoogleOAuthProvider>
              </div>

              <div className="links-section">
                <p>
                  Don't have an account?{" "}
                  <a href="/signup" className="modern-link">
                    <span className="link-text">Sign up here</span>
                  </a>
                </p>
                <p>
                  Are you a recruiter?{" "}
                  <a href="/recruiter-login" className="modern-link">
                    <span className="link-text">Login as Recruiter</span>
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

export default Login;