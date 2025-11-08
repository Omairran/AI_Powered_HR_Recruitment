// PendingVerification.jsx
import React from 'react';
import { CheckCircle2, Clock, Mail } from 'lucide-react';
import '../../styles/PendingVerification.css';

const PendingVerification = () => {
  return (
    <div className="pv-container">
      <div className="pv-card">
        <div className="pv-decorative-circle pv-top-circle" />
        <div className="pv-decorative-circle pv-bottom-circle" />
        
        <div className="pv-main-content">
          <div className="pv-icon-container">
            <div className="pv-main-icon">
              <Clock className="pv-clock-icon" />
              <div className="pv-mail-badge">
                <Mail className="pv-mail-icon" />
              </div>
            </div>
          </div>

          <h1 className="pv-title">Verification Pending</h1>
          <p className="pv-description">
            Thank you for your interest in joining our AI-Powered Interviewing System as a recruiter. Your application has been submitted for review.
          </p>

          <div className="pv-status-timeline">
            <div className="pv-timeline-items">
              <div className="pv-timeline-item">
                <CheckCircle2 className="pv-check-icon" />
                <div className="pv-timeline-content">
                  <p className="pv-timeline-title">Application Submitted</p>
                  <p className="pv-timeline-description">Your details have been sent to our admin team</p>
                </div>
              </div>
              <div className="pv-timeline-item">
                <Clock className="pv-pending-icon" />
                <div className="pv-timeline-content">
                  <p className="pv-timeline-title">Under Review</p>
                  <p className="pv-timeline-description">Our team is reviewing your application</p>
                </div>
              </div>
            </div>
          </div>

          <div className="pv-next-steps">
            <h2 className="pv-next-steps-title">What's Next?</h2>
            <div className="pv-steps-container">
              <div className="pv-step-item">
                <div className="pv-step-number">
                  <span>1</span>
                </div>
                <p className="pv-step-description">We'll review your application within 1-2 business days</p>
              </div>
              <div className="pv-step-item">
                <div className="pv-step-number">
                  <span>2</span>
                </div>
                <p className="pv-step-description">You'll receive an email with your account credentials once approved</p>
              </div>
              <div className="pv-step-item">
                <div className="pv-step-number">
                  <span>3</span>
                </div>
                <p className="pv-step-description">Use those credentials to log in and start using our platform</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PendingVerification;