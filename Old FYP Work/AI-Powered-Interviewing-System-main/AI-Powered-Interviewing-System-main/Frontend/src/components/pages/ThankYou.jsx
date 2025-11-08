import React from 'react';
import { useNavigate } from 'react-router-dom';

const ThankYou = () => {
  const navigate = useNavigate();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
      padding: '20px',
      textAlign: 'center'
    }}>
      <h1 style={{ marginBottom: '20px' }}>Thank You!</h1>
      <p style={{ fontSize: '1.2rem', marginBottom: '30px' }}>
        Thank you for completing the technical interview. We appreciate your time and effort.
      </p>
      <p style={{ fontSize: '1.1rem', marginBottom: '20px' }}>
        Good luck with your application!
      </p>
      <button
        onClick={() => navigate('/')}
        style={{
          padding: '10px 20px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        Return Home
      </button>
    </div>
  );
};

export default ThankYou;