import React, { useState, useRef, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import axiosInstance from '../api/axiosConfig';
import '../../styles/FaceVerification.css';

const FaceVerification = () => {
  const [stream, setStream] = useState(null);
  const [isCapturing, setIsCapturing] = useState(true);
  const [error, setError] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const [profileImage, setProfileImage] = useState(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();
  const jobDetails = location.state;

  // Add this ref to store the current profile image URL
  const profileImageRef = useRef(null);
  
  useEffect(() => {
    const fetchProfileImage = async () => {
      try {
        const response = await axiosInstance.get('job_posting/current-candidate/profile/');
        console.log("Profile response:", response.data);
        
        if (!response.data.profile_image) {
          console.log('please upload image ....');
          setError('Please upload your profile image before proceeding with the interview.');
          setIsCapturing(false);
          return;
        }

        // Set the profile image URL in both state and ref
        const imageUrl = response.data.profile_image;
        setProfileImage(imageUrl);
        profileImageRef.current = imageUrl;
        
        console.log('Profile image set to:', imageUrl);
        
        // Start camera after profile image is confirmed
        startCamera();
      } catch (err) {
        console.error("Error fetching profile:", err);
        if (err.response?.status === 404) {
          setError('Candidate profile not found. Please ensure you have created a profile.');
        } else {
          setError('Error fetching profile details. Please try again.');
        }
        setIsCapturing(false);
      }
    };

    fetchProfileImage();

    // Cleanup function to stop camera when component unmounts
    return () => {
      stopCamera();
    };
  }, []);

  // This useEffect will run whenever profileImage changes
  useEffect(() => {
    if (profileImage) {
      console.log('Profile image has been updated:', profileImage);
      // Update the ref when state changes
      profileImageRef.current = profileImage;
    }
  }, [profileImage]);

  useEffect(() => {
    let timer;
    if (isCapturing && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (countdown === 0) {
      captureFrame();
    }
    return () => clearInterval(timer);
  }, [countdown, isCapturing]);

  // New function to stop camera
  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },  // Match backend target size
          height: { ideal: 480 }, // Match backend target size
          facingMode: "user",
          frameRate: { ideal: 30 }
        } 
      });
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      setCountdown(3);
    } catch (err) {
      setError('Unable to access camera. Please ensure camera permissions are granted.');
      setIsCapturing(false);
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;
    
    const currentProfileImage = profileImageRef.current;
    if (!currentProfileImage) {
      setError('Profile image not available. Please refresh and try again.');
      setIsCapturing(false);
      return;
    }
  
    setIsVerifying(true);
  
    const canvas = canvasRef.current;
    const video = videoRef.current;
    
    // Set canvas size to match video feed
    canvas.width = 640;  // Match backend target size
    canvas.height = 480; // Match backend target size
    
    // Draw video frame to canvas with proper scaling
    const ctx = canvas.getContext('2d');
    ctx.drawImage(
      video, 
      0, 0, video.videoWidth, video.videoHeight,  // Source dimensions
      0, 0, canvas.width, canvas.height           // Destination dimensions
    );
  
    // Get blob with higher quality
    canvas.toBlob(async (blob) => {
      const formData = new FormData();
      formData.append('ref_image', blob, 'capture.jpg');
      formData.append('target_image', currentProfileImage);
      
      // Ensure we're sending the full URL as it appears in the console
      // formData.append('target_image', currentProfileImage);
      
      console.log("Sending request with:", {
        ref_image: "blob object",
        target_image: currentProfileImage
      });
      
      try {
        const verifyResponse = await axiosInstance.post('confidence_prediction/verify-face/', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          // Add timeout to prevent hanging requests
          timeout: 30000
        });
  
        console.log("Verification response:", verifyResponse.data);
  
        if (verifyResponse.data.match) {
          stopCamera(); // Stop camera on success
          setVerificationStatus('success');
          setTimeout(() => {
            navigate('/chat', {
              state: jobDetails
            });
          }, 3000);
        } else {
          setVerificationStatus('failed');
          setIsCapturing(false);
          stopCamera(); // Stop camera on failure
          if (verifyResponse.data.error) {
            setError(verifyResponse.data.error);
          } else {
            setError('Face verification failed. Please try again with better lighting and clear view of your face.');
          }
        }
      } catch (err) {
        console.error("Error processing images:", err);
        setVerificationStatus('failed');
        stopCamera(); // Stop camera on error
        
        // Improved error handling
        if (err.response) {
          console.error("Server responded with error:", err.response.data);
          setError(err.response.data.error || `Server error: ${err.response.status}`);
        } else if (err.request) {
          console.error("No response received:", err.request);
          setError('No response from server. Please check your connection and try again.');
        } else {
          console.error("Request setup error:", err.message);
          setError('Error preparing request: ' + err.message);
        }
        
        setIsCapturing(false);
      } finally {
        setIsVerifying(false);
      }
    }, 'image/jpeg', 0.9); // Added quality parameter to ensure smaller file size
  };

  const handleRetry = () => {
    setError(null);
    setVerificationStatus(null);
    setIsCapturing(true);
    setCountdown(3);
    startCamera();
  };

  return (
    <div className="verification-container">
      <div className="verification-card">
        <div className="verification-header">
          <h2>Face Verification</h2>
          <p className="verification-subtitle">
            Please center your face within the frame for verification
          </p>
        </div>
        
        {error && (
          <div className="alert alert-error">
            <div className="alert-icon">⚠️</div>
            <div className="alert-content">
              <p>{error}</p>
            </div>
          </div>
        )}

        {verificationStatus === 'success' && (
          <div className="alert alert-success">
            <div className="alert-icon">✓</div>
            <div className="alert-content">
              <p>Identity verified successfully!</p>
              <p className="alert-secondary">Redirecting to your interview...</p>
            </div>
          </div>
        )}

        <div className="video-frame">
          {isCapturing && (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                className="video-feed"
              />
              {countdown > 0 && (
                <div className="countdown-overlay">
                  <div className="countdown-circle">
                    <div className="countdown-number">{countdown}</div>
                  </div>
                  <p>Capturing in...</p>
                </div>
              )}
              {isVerifying && (
                <div className="verifying-overlay">
                  <Loader2 className="spin" size={48} />
                  <p>Verifying your identity...</p>
                  <p className="verification-tip">Please don't move until verification is complete</p>
                </div>
              )}
              <div className="camera-frame">
                <div className="frame-corner top-left"></div>
                <div className="frame-corner top-right"></div>
                <div className="frame-corner bottom-left"></div>
                <div className="frame-corner bottom-right"></div>
                <div className="face-guide"></div>
              </div>
            </>
          )}
          <canvas ref={canvasRef} style={{ display: 'none' }} />
        </div>

        {!isCapturing && verificationStatus === 'failed' && (
          <button onClick={handleRetry} className="retry-button">
            Try Again
          </button>
        )}
      </div>
    </div>
  );
};

export default FaceVerification;