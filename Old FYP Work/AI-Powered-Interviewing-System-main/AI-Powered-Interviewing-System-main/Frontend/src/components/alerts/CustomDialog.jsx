import React, { useEffect } from 'react';

const CustomDialog = ({ open, onClose, onConfirm, title, description }) => {
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
          <button className="alert-dialog-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="alert-dialog-confirm" onClick={onConfirm}>
            Delete
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
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease-out;
        }

        .alert-dialog-content {
          background: white;
          border-radius: 8px;
          padding: 24px;
          max-width: 400px;
          width: 90%;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
          animation: slideIn 0.2s ease-out;
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
          justify-content: flex-end;
          gap: 12px;
          margin-top: 24px;
        }

        .alert-dialog-cancel,
        .alert-dialog-confirm {
          padding: 8px 16px;
          border-radius: 4px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
        }

        .alert-dialog-cancel {
          background: transparent;
          border: 1px solid #ddd;
          color: #666;
        }

        .alert-dialog-cancel:hover {
          background: #f5f5f5;
        }

        .alert-dialog-confirm {
          background:rgb(6, 93, 223);
          border: none;
          color: white;
        }

        .alert-dialog-confirm:hover {
          background: #b91c1c;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
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

export default CustomDialog;