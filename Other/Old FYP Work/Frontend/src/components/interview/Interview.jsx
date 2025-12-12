import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo.png';
import "../../styles/Interview.css"; // Assuming Chatbot.css styles Interview

// Placeholder logo component
const CompanyLogo = () => (
    <div
        style={{
            width: '100px', // Adjust width to fit the logo
            height: '100px', // Adjust height to fit the logo
            backgroundColor: '#3498db', // Background color for the container
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '10%', // Optional: Makes the container circular
            overflow: 'hidden', // Ensures the logo doesn't overflow the container
            marginLeft:'10px'
        }}
    >
        {/* Logo */}
        <img
            src={logo} // Replace `logo` with the actual path or imported image
            alt="TalentScout Logo"
            style={{
                maxWidth: '100%', // Ensures the logo scales proportionally
                maxHeight: '100%', // Prevents overflow from the container
            }}
        />
    </div>
);


// Timer Component
const InterviewTimer = ({ duration = 300 }) => {
    const [timeRemaining, setTimeRemaining] = useState(duration);
    const [isRunning, setIsRunning] = useState(true);

    useEffect(() => {
        let interval;
        if (isRunning && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => prev - 1);
            }, 1000);
        }
        return () => clearInterval(interval);
    }, [isRunning, timeRemaining]);

    const minutes = Math.floor(timeRemaining / 60);
    const seconds = timeRemaining % 60;

    return (
        <div style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '10px',
            backgroundColor: timeRemaining < 60 ? '#ff6b6b' : '#4ecdc4',
            borderRadius: '10px',
            color: 'white'
        }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold' }}>
                {`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`}
            </div>
            <div>Time Remaining</div>
            
        </div>
    );
};

// Webcam Placeholder
// Remove any duplicate React imports at the top
// Just keep these if you don't already have them

// Create axios instance with default config
// Create axios instance with default config
// Create a separate axios instance for frame uploads
const frameApi = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true
});

// Add interceptor for authentication
frameApi.interceptors.request.use((config) => {
    const token = localStorage.getItem('access');
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

const WebcamFeed = () => {
    const videoRef = useRef(null);
    const streamRef = useRef(null);
    const canvasRef = useRef(document.createElement('canvas'));
    const location = useLocation();
    const { jobId, candidateId } = location.state || {};

    // Function to get CSRF token and set up cookie
    const setupCSRF = async () => {
        try {
            await frameApi.get('/api/chat/get-csrf-token/', {
                withCredentials: true
            });
        } catch (error) {
            console.error('Error fetching CSRF token:', error);
        }
    };

    const captureFrame = async () => {
        if (!videoRef.current || !streamRef.current) {
            console.log('Video or stream not ready');
            return;
        }
    
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
            console.log('Video not ready for capture');
            return;
        }
    
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        
        try {
            const blob = await new Promise((resolve, reject) => {
                canvas.toBlob((blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Canvas to Blob conversion failed'));
                }, 'image/jpeg', 0.8);
            });
    
            // Create a safe timestamp format
            const now = new Date();
            const timestamp = now.toISOString();
            const safeTimestamp = now.getTime(); // Use milliseconds timestamp instead
            
            const formData = new FormData();
            formData.append('frame', blob, `frame_${safeTimestamp}.jpg`);
            formData.append('job_id', jobId);
            formData.append('candidate_id', candidateId);
            formData.append('timestamp', timestamp);
    
            // Get CSRF token from cookie
            const csrfToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('csrftoken='))
                ?.split('=')[1];
    
            if (!csrfToken) {
                await setupCSRF();
            }
    
            const response = await frameApi.post('/api/chat/save-frame/', formData, {
                headers: {
                    'X-CSRFToken': document.cookie
                        .split('; ')
                        .find(row => row.startsWith('csrftoken='))
                        ?.split('=')[1] || '',
                    'Content-Type': 'multipart/form-data'
                }
            });
    
            console.log('Frame saved:', response.data);
        } catch (error) {
            console.error('Error capturing/sending frame:', error.message);
            // } else {
            //     console.error('Error capturing/sending frame:', error.message);
            // }
        }
    };

    useEffect(() => {
        let mounted = true;
        let frameInterval;

        const startWebcam = async () => {
            try {
                // Set up CSRF token first
                await setupCSRF();

                if (!jobId || !candidateId) {
                    throw new Error('Job ID or Candidate ID missing');
                }

                if (streamRef.current) {
                    stopWebcam();
                }

                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: { ideal: 1280 },
                        height: { ideal: 720 },
                        facingMode: 'user'
                    }
                });
                
                if (!mounted) {
                    stream.getTracks().forEach(track => track.stop());
                    return;
                }

                streamRef.current = stream;
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    
                    videoRef.current.onloadedmetadata = () => {
                        videoRef.current.play();
                        frameInterval = setInterval(captureFrame, 5000);
                    };
                }
            } catch (err) {
                console.error("Error accessing webcam:", err.message);
                if (err.name === 'NotAllowedError') {
                    alert('Please allow camera access to continue with the interview.');
                } else if (err.name === 'NotReadableError') {
                    alert('Could not access your camera. Please make sure no other application is using it.');
                }
            }
        };

        const stopWebcam = () => {
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(track => track.stop());
                streamRef.current = null;
            }
            if (videoRef.current) {
                videoRef.current.srcObject = null;
            }
            if (frameInterval) {
                clearInterval(frameInterval);
            }
        };

        startWebcam();

        return () => {
            mounted = false;
            stopWebcam();
        };
    }, [jobId, candidateId]);

    return (
        <div style={{height: '400px'}} className="relative w-full bg-gray-200 rounded-lg overflow-hidden">
            <video
                ref={videoRef}
                autoPlay
                playsInline
                style={{height: '400px'}}
                className="w-full object-cover"
            />
            {(!jobId || !candidateId) && (
                <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 text-white">
                    <p>Missing job or candidate information</p>
                </div>
            )}
        </div>
    );
};
// Instructions for Candidates
const Instructions = () => (
    <div style={{
        backgroundColor: '#f7f9fc',
        padding: '15px',
        borderRadius: '10px',
        marginBottom: '20px'
    }}>
        <h4>Instructions for the Candidate</h4>
        <ul>
            <li>Ensure your microphone and camera are working properly.</li>
            <li>Answer the questions clearly and concisely.</li>
            <li>Wait for the next question after completing your response.</li>
            <li>You can not reset the interview once instead get started.</li>
        </ul>
    </div>
);

const Chat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { jobId, candidateId, jobTitle } = location.state || {};
    const [currentQuestion, setCurrentQuestion] = useState('');
    const [displayedQuestion, setDisplayedQuestion] = useState(''); // New state for animated text
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const recognitionRef = useRef(null);
    const synthesisRef = useRef(null);
    const typingSpeedRef = useRef(null); // Reference for typing interval
    const [questionCount, setQuestionCount] = useState(0);
    const [interviewEnded, setInterviewEnded] = useState(false);
    const [lastIntent, setLastIntent] = useState('');
    const [candidateName, setCandidateName] = useState('');


    useEffect(() => {
        // Check if we have the required parameters
        if (!jobId || !candidateId) {
            console.error('Missing required parameters');
            navigate('/applied-jobs');
            return;
        }
    // Initialize speech recognition and synthesis
    
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            recognitionRef.current = new SpeechRecognition();
            recognitionRef.current.continuous = true;
            recognitionRef.current.interimResults = true;
            recognitionRef.current.lang = 'en-US';

            recognitionRef.current.onresult = (event) => {
                let interimTranscript = '';
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (event.results[i].isFinal) {
                        interimTranscript += event.results[i][0].transcript;
                    }
                }
                setCurrentTranscript(prevTranscript => prevTranscript + ' ' + interimTranscript);
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
            };
        }

        synthesisRef.current = window.speechSynthesis;
        resetInterview();

        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            if (synthesisRef.current) {
                synthesisRef.current.cancel();
            }
            if (typingSpeedRef.current) {
                clearInterval(typingSpeedRef.current);
            }
        };
    }, [jobId, candidateId]);

    // Ref to store the typing animation interval

// Function to handle typing animation with text integrity
const animateText = (text) => {
    if (!text) return; // Guard clause for empty text
    
    let index = 0;
    setDisplayedQuestion('');
    
    // Clear any existing interval
    if (typingSpeedRef.current) {
        clearInterval(typingSpeedRef.current);
    }

    // Create a clean copy of the text to animate
    const textToAnimate = text.toString();

    // Create new interval for typing animation
    typingSpeedRef.current = setInterval(() => {
        if (index < textToAnimate.length) {
            setDisplayedQuestion(textToAnimate.substring(0, index + 1));
            index++;
        } else {
            clearInterval(typingSpeedRef.current);
        }
    }, 50);
};

// Reset interview function with proper error handling
const resetInterview = useCallback(async () => {
    try {
        const response = await axios.post('http://localhost:8000/api/chat/chat/', {
            reset: true,
            job_id: jobId,
            candidate_id: candidateId,
            candidateName: candidateName,
        });
        
        if (response.data?.reset && response.data?.response) {
            const questionText = response.data.response.trim();
            setCurrentQuestion(questionText);
            animateText(questionText);
            speakMessage(questionText);
            setQuestionCount(0);
            setInterviewEnded(false);
            setLastIntent('');
            if (response.data.candidateName) {
                setCandidateName(response.data.candidateName);
            }
        }
    } catch (error) {
        console.error('Error resetting interview:', error);
    }
}, [jobId, candidateId, candidateName]);

// Speak message function with improved text handling
const speakMessage = (message) => {
    if (!synthesisRef.current || !message) return;

    // Cancel any ongoing speech
    synthesisRef.current.cancel();
    
    // Create clean copy of message
    const cleanMessage = message.toString().trim();
    
    const utterance = new SpeechSynthesisUtterance(cleanMessage);
    utterance.rate = 1.1;
    
    // Set specific language for accent (British English in this example)
    utterance.lang = 'en-GB';
    
    // Try to find a specific voice for the desired accent
    const voices = synthesisRef.current.getVoices();
    
    // Look for a British English voice
    const britishVoice = voices.find(voice => 
        voice.lang === 'en-GB' && !voice.localService
    );
    
    // If a British voice is found, use it
    if (britishVoice) {
        utterance.voice = britishVoice;
    }

    let index = 0;
    const interval = 50;
    
    // Clear existing text before animation
    setCurrentQuestion('');

    // Use substring for more reliable text handling
    const typingInterval = setInterval(() => {
        if (index <= cleanMessage.length) {
            setCurrentQuestion(cleanMessage.substring(0, index));
            index++;
        } else {
            clearInterval(typingInterval);
        }
    }, interval);

    setIsSpeaking(true);
    
    utterance.onend = () => {
        setIsSpeaking(false);
        startListening();
    };

    synthesisRef.current.speak(utterance);
};
    
const startListening = () => {
    if (recognitionRef.current) {
        setCurrentTranscript('');
        recognitionRef.current.start();
        setIsListening(true);
    }
};

// Ensure it restarts when it stops
useEffect(() => {
    if (recognitionRef.current) {
        recognitionRef.current.onend = () => {
            if (isListening) {
                recognitionRef.current.start();  // Restart listening if not muted
            }
        };

        recognitionRef.current.onerror = (event) => {
            console.error('Speech recognition error:', event.error);
            if (event.error === 'no-speech' && isListening) {
                recognitionRef.current.start();  // Restart on no-speech errors
            }
        };
    }
}, [isListening]);


    const stopListeningAndSend = async () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
            setIsListening(false);
        }
    
        const trimmedTranscript = currentTranscript.trim();
        if (trimmedTranscript) {
            setCurrentAnswer(trimmedTranscript);
    
            try {
                const response = await axios.post('http://localhost:8000/api/chat/chat/', {
                    message: trimmedTranscript,
                    job_id: jobId,
                    candidate_id: candidateId,
                    candidateName: candidateName
                });
    
                setLastIntent(response.data.intent);
                setQuestionCount(response.data.question_count);
    
                if (response.data.intent === 'Quit_interview' || response.data.interview_ended) {
                    setInterviewEnded(true);
                    animateText(response.data.response);
                    speakMessage(response.data.response);
                    setTimeout(() => {
                        navigate('/thank-you');
                    }, 8000);
                    return;
                }
    
                const nextQuestion = response.data.response;
                setCurrentQuestion(nextQuestion);
                animateText(nextQuestion);
                setCurrentAnswer('');
                speakMessage(nextQuestion);
            } catch (error) {
                console.error('Error sending message:', error);
            }
    
            setCurrentTranscript('');
        }
    };


    // ... Keep all  existing styles ...

    return (
        <div style={{
            fontFamily: 'Arial, sans-serif',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: '100vh',
            padding: '20px'
        }}>
            
            {/* Header */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <CompanyLogo />
                <div style={{ textAlign: 'center' }}>
                <div style={{ textAlign: 'center' }}>
                    <h2>Technical Interview</h2>
                    {console.log("candidate name is",{candidateName})}
                    <div>Candidate: {candidateName || 'Loading...'} | Position: {jobTitle}</div>
                </div>
                </div>
                <div>{new Date().toLocaleString()}</div>
            </div>

            {/* Instructions */}
            <Instructions />

            {/* Main Interview Container */}
            <div style={{
                display: 'flex',
                gap: '20px',
                backgroundColor: 'white',
                borderRadius: '15px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                padding: '20px'
            }}>
               
                <div style={{ flex: 2 }}>
                    <WebcamFeed />
                </div>

                <div style={{ flex: 3 }}>
                    <InterviewTimer duration={600} />

                    <div style={{
                        height: '200px',
                        overflowY: 'auto',
                        border: '1px solid #ddd',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '10px'
                    }}>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>Question:</strong> {displayedQuestion}
                            {isSpeaking && <span className="cursor">|</span>}
                        </div>
                        <div>
                            <strong>Your Answer:</strong> {currentAnswer}
                        </div>
                    </div>

                    {isListening && (
                        <div style={{
                            textAlign: 'center',
                            margin: '10px 0',
                            fontStyle: 'italic',
                            color: 'gray'
                        }}>
                            {currentTranscript || 'Listening...'}
                        </div>
                    )}

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '20px'
                    }}>
                        <button
                    onClick={stopListeningAndSend}
                    disabled={!isListening || interviewEnded}
                    style={{
                        padding: '10px 20px',
                        backgroundColor: !isListening || interviewEnded ? '#ccc' : 'red',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        marginRight: '10px'
                    }}
                >
                    Mute
                </button>

                        {/* <button
                            onClick={resetInterview}
                            style={{
                                padding: '10px 20px',
                                backgroundColor: '#4CAF50',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: 'pointer'
                            }}
                        >
                            Reset Interview
                        </button> */}
                        
                    </div>
                    
                </div>
                {/* <div className="text-end">
                        <h2>Technical Interview</h2>
                        <div>Questions Asked: {questionCount}/9</div>
                    </div> */}
            </div>
            
        </div>
        
    );
    // Inside Chat component, after the existing useEffect
useEffect(() => {
    // Function to load voices
    const loadVoices = () => {
        // Voices are loaded
        console.log('Voices loaded:', synthesisRef.current.getVoices().length);
    };

    // Check if synthesis is available
    if (synthesisRef.current) {
        // Chrome loads voices asynchronously
        synthesisRef.current.onvoiceschanged = loadVoices;
        
        // For browsers that load voices synchronously
        if (synthesisRef.current.getVoices().length > 0) {
            loadVoices();
        }
    }
}, []);
};



export default Chat;