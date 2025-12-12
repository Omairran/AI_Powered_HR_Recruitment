import React, { useEffect } from 'react';

const CustomAlert = ({ open, onClose, title, description }) => {
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

  return (
    <div className="alert-dialog-overlay" onClick={() => onClose()}>
      <div className="alert-dialog-content" onClick={e => e.stopPropagation()}>
        <div className="alert-dialog-header">
          <h2 className="alert-dialog-title">{title}</h2>
          <p className="alert-dialog-description">{description}</p>
        </div>
        <div className="alert-dialog-footer">
          <button className="alert-dialog-button" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
      <style jsx>{`
        .alert-dialog-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          pointer-events: none;
        }

        .alert-dialog-content {
          background: white;
          border-radius: 8px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.2s ease-out;
          pointer-events: auto;
        }

        .alert-dialog-header {
          margin-bottom: 20px;
        }

        .alert-dialog-title {
          font-size: 20px;
          font-weight: 600;
          margin: 0 0 8px 0;
          color: #1a1a1a;
        }

        .alert-dialog-description {
          font-size: 14px;
          color: #666;
          margin: 0;
          line-height: 1.5;
        }

        .alert-dialog-footer {
          display: flex;
          justify-content: center;
          margin-top: 24px;
        }

        .alert-dialog-button {
          padding: 8px 32px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          background: rgb(6, 93, 223);
          border: none;
          color: white;
        }

        .alert-dialog-button:hover {
          background: #1a4b8f;
        }

        @keyframes slideIn {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomAlert;