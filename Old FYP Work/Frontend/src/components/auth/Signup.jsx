import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import "../../styles/Login.css"; // Assuming Login.css also styles Signup

const Signup = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
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
      await axios.post("http://localhost:8000/api/authentication/register/", {
        username,
        email,
        password,
        confirmPassword,
      });

      const loginResponse = await axios.post(
        "http://localhost:8000/api/authentication/candidate/",
        {
          username,
          password,
        }
      );

      localStorage.setItem("access", loginResponse.data.access);
      localStorage.setItem("refresh", loginResponse.data.refresh);
      localStorage.setItem("username", username); // Add this line to store username

      navigate("/candidate-dashboard");
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
            errorMessage = err.response.data.error || "Signup failed. Please try again.";
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
        navigate("/candidte-dashboard");
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


  return (
    <div className={`login-page ${mounted ? 'fade-in' : ''}`}>
    <div className="background-circles">
      <div className="circle"></div>
      <div className="circle"></div>
    </div>

    <div className="animated-background">
      <div className="gradient-sphere"></div>
    </div>

    <div className="login-container signup-container"> {/* Added signup-specific class */}
      {/* Left Side - Branding */}
      <div className="branding-section">
        <div className="brand-content">
          <h1 className="main-title">
            Welcome to  {' '}
            <span className="gradient-text">AI-Powered Interviewing System</span>
          </h1>
          <p className="subtitle">
            Join our platform and showcase your skills through AI-powered interviews
          </p>
          
          <div className="features-grid">
            {[
              { title: 'Easy Registration', icon: '📝', delay: '0s' },
              { title: 'Secure Platform', icon: '🔒', delay: '0.2s' },
              { title: 'AI Interviews', icon: '🤖', delay: '0.4s' },
              { title: 'Quick Results', icon: '⚡', delay: '0.6s' }
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
        <div className="login-form-container signup-form-container"> {/* Added signup-specific class */}
          <div className="form-header">
            <h2 className="form-title gradient-text">Create Account</h2>
          </div>
          
          <form onSubmit={handleSignup} className="login-form">
            {/* Modified input groups with text alignment */}
            <label className="input-label" htmlFor="username">Username</label>

            <div className={`input-group floating-label ${activeField === 'username' ? 'focused' : ''}`}>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onFocus={() => setActiveField('username')}
                onBlur={() => setActiveField('')}
                className="input-field text-left" // Added text-left class
                placeholder="bairi"
                required
              />
              <div className="input-border"></div>
            </div>
            <label className="input-label" htmlFor="email">Email</label>

            {/* Repeat the same pattern for other input fields */}
          
            <div className={`input-group floating-label ${activeField === 'email' ? 'focused' : ''}`}>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setActiveField('email')}
                onBlur={() => setActiveField('')}
                className="input-field text-left"
                placeholder="zubair2021@namal.edu.pk"
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
                placeholder=" "
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
                placeholder=" "
                required
              />
              <div className="input-border"></div>
            </div>

            {/* Rest of the form remains the same */}
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
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <>
                    <span>Sign Up</span>
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
                Already have an account?{" "}
                <a href="/candidate-login" className="modern-link">
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