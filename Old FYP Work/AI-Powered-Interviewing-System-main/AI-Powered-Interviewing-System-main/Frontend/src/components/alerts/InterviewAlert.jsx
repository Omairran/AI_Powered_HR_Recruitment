import React, { useEffect } from 'react';
import { AlertCircle, Wifi, Volume2, Sun, Camera, Monitor, Clock, CheckCircle2 } from 'lucide-react';

const fixedStyles = `
  .interview-prereq-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: interview-prereq-fadeIn 0.2s ease-out;
    padding: 20px;
    /* Add these properties to prevent any movement */
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    pointer-events: all;
  }

  .interview-prereq-content {
    background: white;
    border-radius: 12px;
    padding: 32px;
    max-width: 800px;
    width: 95%;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
    animation: interview-prereq-slideIn 0.2s ease-out;
    position: relative;
    /* Add these properties to prevent any movement */
    transform: translateZ(0);
    -webkit-transform: translateZ(0);
    will-change: transform;
  }
  
  @keyframes interview-prereq-fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes interview-prereq-slideIn {
    from {
      transform: translateY(-20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }
`;

const InterviewPrerequisitesDialog = ({ open, onClose, onProceed }) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [open]);

  if (!open) return null;

  const handleOverlayClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };
  
  return (
    <div 
      className="interview-prereq-overlay" 
      onClick={handleOverlayClick}
      style={{ position: 'fixed', isolation: 'isolate' }}
    >       
      <div 
        className="interview-prereq-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="interview-prereq-header">
          <div className="interview-prereq-header-with-icon">
            <AlertCircle size={28} className="interview-prereq-header-icon" />
            <h2 className="interview-prereq-title">Important Interview Prerequisites</h2>
          </div>
          <div className="interview-prereq-description">
            <p className="interview-prereq-intro">
              Please ensure you meet all the following requirements before proceeding with your AI-powered video interview:
            </p>
            
            <div className="interview-prereq-list">
              <div className="interview-prereq-item">
                <Clock className="interview-prereq-icon" />
                <div className="interview-prereq-text">
                  <h3>One-Time Opportunity</h3>
                  <p>You can only take this interview once. Make sure you're well-prepared before starting.</p>
                </div>
              </div>

              <div className="interview-prereq-item">
                <Wifi className="interview-prereq-icon" />
                <div className="interview-prereq-text">
                  <h3>Stable Internet Connection</h3>
                  <p>A stable internet connection is required for continuous video streaming.</p>
                </div>
              </div>

              <div className="interview-prereq-item">
                <Volume2 className="interview-prereq-icon" />
                <div className="interview-prereq-text">
                  <h3>Quiet Environment</h3>
                  <p>Find a quiet space with minimal background noise for clear audio recording.</p>
                </div>
              </div>

              <div className="interview-prereq-item">
                <Sun className="interview-prereq-icon" />
                <div className="interview-prereq-text">
                  <h3>Proper Lighting</h3>
                  <p>Set up in a well-lit area where your face is clearly visible.</p>
                </div>
              </div>

              <div className="interview-prereq-item">
                <Camera className="interview-prereq-icon" />
                <div className="interview-prereq-text">
                  <h3>Profile Photo</h3>
                  <p>Your profile photo must be uploaded for face verification purposes.</p>
                </div>
              </div>

              <div className="interview-prereq-item">
                <Monitor className="interview-prereq-icon" />
                <div className="interview-prereq-text">
                  <h3>Required Equipment</h3>
                  <p>Use a desktop or laptop computer with a working webcam and microphone.</p>
                </div>
              </div>
            </div>

            <div className="interview-prereq-note">
              <CheckCircle2 className="interview-prereq-note-icon" />
              <p>
                The system will analyze both your responses and non-verbal cues, including confidence levels. 
                Please be natural and professional throughout the interview.
              </p>
            </div>
          </div>
        </div>
        <div className="interview-prereq-footer">
          <button className="interview-prereq-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="interview-prereq-confirm" onClick={onProceed}>
            Proceed to Interview
          </button>
        </div>
        <style jsx global>{fixedStyles}</style>

      </div>
      <style jsx>{`
        .interview-prereq-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: interview-prereq-fadeIn 0.2s ease-out;
          padding: 20px;
        }

        .interview-prereq-content {
          background: white;
          border-radius: 12px;
          padding: 32px;
          max-width: 800px;
          width: 95%;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
          animation: interview-prereq-slideIn 0.2s ease-out;
          position: relative;
        }

        .interview-prereq-header-with-icon {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 24px;
        }

        .interview-prereq-header-icon {
          color: rgb(6, 93, 223);
        }

        .interview-prereq-title {
          font-size: 28px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
        }

        .interview-prereq-description {
          font-size: 16px;
          color: #374151;
          line-height: 1.6;
        }

        .interview-prereq-intro {
          margin-bottom: 24px;
          font-size: 17px;
        }

        .interview-prereq-list {
          display: grid;
          gap: 20px;
        }

        .interview-prereq-item {
          display: flex;
          gap: 16px;
          padding: 16px;
          border-radius: 8px;
          background: #f8f9fc;
          transition: all 0.2s ease;
        }

        .interview-prereq-item:hover {
          background: #f3f4f8;
          transform: translateY(-1px);
        }

        .interview-prereq-icon {
          color: rgb(6, 93, 223);
          min-width: 24px;
          height: 24px;
          margin-top: 4px;
        }

        .interview-prereq-text h3 {
          font-size: 17px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 8px 0;
        }

        .interview-prereq-text p {
          font-size: 15px;
          color: #4b5563;
          margin: 0;
        }

        .interview-prereq-note {
          display: flex;
          gap: 12px;
          background-color: #f0f9ff;
          padding: 16px;
          border-radius: 8px;
          margin-top: 24px;
          align-items: flex-start;
        }

        .interview-prereq-note-icon {
          color: #0369a1;
          min-width: 20px;
          height: 20px;
          margin-top: 2px;
        }

        .interview-prereq-note p {
          margin: 0;
          font-size: 15px;
          color: #0c4a6e;
        }

        .interview-prereq-footer {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
        }

        .interview-prereq-cancel,
        .interview-prereq-confirm {
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .interview-prereq-cancel {
          background: transparent;
          border: 1px solid #d1d5db;
          color: #374151;
        }

        .interview-prereq-cancel:hover {
          background: #f3f4f6;
          border-color: #9ca3af;
        }

        .interview-prereq-confirm {
          background: rgb(6, 93, 223);
          border: none;
          color: white;
        }

        .interview-prereq-confirm:hover {
          background: rgb(5, 75, 180);
          transform: translateY(-1px);
        }

        @keyframes interview-prereq-fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes interview-prereq-slideIn {
          from {
            transform: translateY(-20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        @media (max-width: 640px) {
          .interview-prereq-content {
            padding: 24px;
          }

          .interview-prereq-title {
            font-size: 24px;
          }

          .interview-prereq-intro {
            font-size: 16px;
          }

          .interview-prereq-text h3 {
            font-size: 16px;
          }

          .interview-prereq-text p {
            font-size: 14px;
          }
        }
      `}</style>
    </div>
  );
};

export default InterviewPrerequisitesDialog;