import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import logo from '../../assets/logo.png';
import "../../styles/Interview.css";

const CompanyLogo = () => (
    <div style={{
        width: '100px',
        height: '100px',
        backgroundColor: '#3498db',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '10%',
        overflow: 'hidden',
        marginLeft:'10px'
    }}>
        <img
            src={logo}
            alt="TalentScout Logo"
            style={{
                maxWidth: '100%',
                maxHeight: '100%',
            }}
        />
    </div>
);

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

const frameApi = axios.create({
    baseURL: 'http://localhost:8000',
    withCredentials: true
});

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
            return;
        }
    
        const video = videoRef.current;
        const canvas = canvasRef.current;
        
        if (video.readyState !== video.HAVE_ENOUGH_DATA) {
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
    
            const now = new Date();
            const timestamp = now.toISOString();
            const safeTimestamp = now.getTime();
            
            const formData = new FormData();
            formData.append('frame', blob, `frame_${safeTimestamp}.jpg`);
            formData.append('job_id', jobId);
            formData.append('candidate_id', candidateId);
            formData.append('timestamp', timestamp);
    
            const csrfToken = document.cookie
                .split('; ')
                .find(row => row.startsWith('csrftoken='))
                ?.split('=')[1];
    
            if (!csrfToken) {
                await setupCSRF();
            }
    
            await frameApi.post('/api/chat/save-frame/', formData, {
                headers: {
                    'X-CSRFToken': document.cookie
                        .split('; ')
                        .find(row => row.startsWith('csrftoken='))
                        ?.split('=')[1] || '',
                    'Content-Type': 'multipart/form-data'
                }
            });
        } catch (error) {
            console.error('Error capturing/sending frame:', error.message);
        }
    };

    useEffect(() => {
        let mounted = true;
        let frameInterval;

        const startWebcam = async () => {
            try {
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
            <li>Click "Submit Answer" when you finish speaking.</li>
            <li>You can click "Skip Reading" to skip the AI voice.</li>
        </ul>
    </div>
);

const Chat = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const { jobId, candidateId, jobTitle } = location.state || {};
    const [displayedQuestion, setDisplayedQuestion] = useState('');
    const [currentAnswer, setCurrentAnswer] = useState('');
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [currentTranscript, setCurrentTranscript] = useState('');
    const [isMuted, setIsMuted] = useState(false);
    const recognitionRef = useRef(null);
    const synthesisRef = useRef(null);
    const typingIntervalRef = useRef(null);
    const [questionCount, setQuestionCount] = useState(0);
    const [interviewEnded, setInterviewEnded] = useState(false);
    const [lastIntent, setLastIntent] = useState('');
    const [candidateName, setCandidateName] = useState('');

    useEffect(() => {
        if (!jobId || !candidateId) {
            console.error('Missing required parameters');
            navigate('/applied-jobs');
            return;
        }
    
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
            if (typingIntervalRef.current) {
                clearInterval(typingIntervalRef.current);
            }
        };
    }, [jobId, candidateId]);

    const animateText = (text) => {
        if (!text) return;
        
        let index = 0;
        setDisplayedQuestion('');
        
        if (typingIntervalRef.current) {
            clearInterval(typingIntervalRef.current);
        }

        const textToAnimate = text.toString();

        typingIntervalRef.current = setInterval(() => {
            if (index < textToAnimate.length) {
                setDisplayedQuestion(textToAnimate.substring(0, index + 1));
                index++;
            } else {
                clearInterval(typingIntervalRef.current);
            }
        }, 50);
    };

    const resetInterview = useCallback(async () => {
        try {
            console.log('Resetting interview with jobId:', jobId, 'candidateId:', candidateId);
            
            const response = await axios.post('http://localhost:8000/api/chat/chat/', {
                reset: true,
                job_id: jobId,
                candidate_id: candidateId,
                candidateName: '',
            });
            
            console.log('Reset response:', response.data);
            
            if (response.data?.reset && response.data?.response) {
                const questionText = response.data.response.trim();
                
                if (response.data.candidateName) {
                    setCandidateName(response.data.candidateName);
                }
                
                animateText(questionText);
                speakMessageOnly(questionText);
                
                setQuestionCount(0);
                setInterviewEnded(false);
                setLastIntent('');
            } else {
                console.error('Invalid reset response:', response.data);
            }
        } catch (error) {
            console.error('Error resetting interview:', error);
            console.error('Error details:', error.response?.data);
        }
    }, [jobId, candidateId]);

    const speakMessageOnly = (message) => {
        if (!synthesisRef.current || !message) {
            console.warn('Speech synthesis not available or no message');
            setTimeout(() => {
                setIsSpeaking(false);
                startListening();
            }, 1000);
            return;
        }

        if (recognitionRef.current && isListening) {
            recognitionRef.current.stop();
            setIsListening(false);
        }

        synthesisRef.current.cancel();
        
        const cleanMessage = message.toString().trim();
        const utterance = new SpeechSynthesisUtterance(cleanMessage);
        utterance.rate = 1.1;
        utterance.lang = 'en-GB';
        
        const voices = synthesisRef.current.getVoices();
        const britishVoice = voices.find(voice => 
            voice.lang === 'en-GB' && !voice.localService
        );
        
        if (britishVoice) {
            utterance.voice = britishVoice;
        }

        setIsSpeaking(true);
        
        const speechTimeout = setTimeout(() => {
            console.warn('Speech timeout - forcing listening to restart');
            setIsSpeaking(false);
            startListening();
        }, cleanMessage.length * 100 + 2000);
        
        utterance.onend = () => {
            clearTimeout(speechTimeout);
            console.log('Speech ended normally');
            setIsSpeaking(false);
            setTimeout(() => {
                startListening();
            }, 500);
        };

        utterance.onerror = (event) => {
            clearTimeout(speechTimeout);
            console.error('Speech synthesis error:', event);
            setIsSpeaking(false);
            setTimeout(() => {
                startListening();
            }, 500);
        };

        try {
            synthesisRef.current.speak(utterance);
            console.log('Started speaking:', cleanMessage.substring(0, 50) + '...');
        } catch (error) {
            clearTimeout(speechTimeout);
            console.error('Error starting speech:', error);
            setIsSpeaking(false);
            setTimeout(() => {
                startListening();
            }, 500);
        }
    };

    const skipSpeech = () => {
        console.log('Skipping speech');
        if (synthesisRef.current) {
            synthesisRef.current.cancel();
        }
        setIsSpeaking(false);
        setTimeout(() => {
            startListening();
        }, 300);
    };
    
    const startListening = () => {
        if (!recognitionRef.current) return;
        
        setCurrentTranscript('');
        
        try {
            if (isListening) {
                recognitionRef.current.stop();
            }
        } catch (e) {
            console.log('Recognition already stopped');
        }
        
        setTimeout(() => {
            try {
                recognitionRef.current.start();
                setIsListening(true);
                console.log('Speech recognition started');
            } catch (e) {
                console.error('Error starting recognition:', e);
                setTimeout(() => {
                    try {
                        recognitionRef.current.start();
                        setIsListening(true);
                    } catch (retryError) {
                        console.error('Retry failed:', retryError);
                    }
                }, 500);
            }
        }, 100);
    };

    useEffect(() => {
        if (recognitionRef.current) {
            recognitionRef.current.onend = () => {
                console.log('Recognition ended, isListening:', isListening);
                if (isListening && !isSpeaking) {
                    console.log('Restarting recognition...');
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.error('Error restarting recognition:', e);
                    }
                }
            };

            recognitionRef.current.onerror = (event) => {
                console.error('Speech recognition error:', event.error);
                if (event.error === 'no-speech' && isListening && !isSpeaking) {
                    console.log('No speech detected, restarting...');
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.error('Error restarting after no-speech:', e);
                    }
                }
            };
        }
    }, [isListening, isSpeaking]);

    const stopListeningAndSend = async () => {
        console.log('Mute/Submit button clicked');
        
        setIsMuted(true);
        
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                console.log('Recognition already stopped');
            }
            setIsListening(false);
        }
    
        const trimmedTranscript = currentTranscript.trim();
        console.log('Transcript to send:', trimmedTranscript);
        
        if (trimmedTranscript) {
            setCurrentAnswer(trimmedTranscript);
    
            try {
                console.log('Sending message:', trimmedTranscript);
                
                const response = await axios.post('http://localhost:8000/api/chat/chat/', {
                    message: trimmedTranscript,
                    job_id: jobId,
                    candidate_id: candidateId,
                    candidateName: candidateName
                });
    
                console.log('Response received:', response.data);
                
                setLastIntent(response.data.intent);
                setQuestionCount(response.data.question_count);
    
                if (response.data.intent === 'Quit_interview' || 
                    response.data.interview_ended === true || 
                    response.data.question_count >= 10) {
                    
                    console.log('Interview ending...');
                    setInterviewEnded(true);
                    animateText(response.data.response);
                    speakMessageOnly(response.data.response);
                    
                    setTimeout(() => {
                        navigate('/applied-jobs');
                    }, 10000);
                    return;
                }
    
                const nextQuestion = response.data.response;
                console.log('Next question:', nextQuestion);
                
                setCurrentAnswer('');
                setCurrentTranscript('');
                setIsMuted(false);
                
                animateText(nextQuestion);
                speakMessageOnly(nextQuestion);
                
            } catch (error) {
                console.error('Error sending message:', error);
                console.error('Error details:', error.response?.data);
                
                setIsMuted(false);
                setTimeout(() => {
                    startListening();
                }, 1000);
            }
        } else {
            console.log('No transcript to send, restarting listening');
            setIsMuted(false);
            setTimeout(() => {
                startListening();
            }, 500);
        }
    };

    return (
        <div style={{
            fontFamily: 'Arial, sans-serif',
            background: 'linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)',
            minHeight: '100vh',
            padding: '20px'
        }}>
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '20px'
            }}>
                <CompanyLogo />
                <div style={{ textAlign: 'center' }}>
                    <h2>Technical Interview</h2>
                    <div>Candidate: {candidateName || 'Loading...'} | Position: {jobTitle}</div>
                    <div style={{ marginTop: '10px', color: questionCount >= 8 ? '#ff6b6b' : '#4ecdc4', fontWeight: 'bold' }}>
                        Questions: {questionCount}/10
                    </div>
                </div>
                <div>{new Date().toLocaleString()}</div>
            </div>

            <Instructions />

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
                    <div style={{ marginBottom: '20px' }}>
                        <InterviewTimer duration={600} />
                        
                        <div style={{ marginTop: '15px' }}>
                            <div style={{ 
                                display: 'flex', 
                                justifyContent: 'space-between',
                                marginBottom: '5px',
                                fontSize: '14px',
                                fontWeight: 'bold'
                            }}>
                                <span>Interview Progress</span>
                                <span style={{ color: questionCount >= 8 ? '#ff6b6b' : '#4ecdc4' }}>
                                    {questionCount}/10 Questions
                                </span>
                            </div>
                            <div style={{
                                width: '100%',
                                height: '10px',
                                backgroundColor: '#e0e0e0',
                                borderRadius: '5px',
                                overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: `${(questionCount / 10) * 100}%`,
                                    height: '100%',
                                    backgroundColor: questionCount >= 8 ? '#ff6b6b' : '#4ecdc4',
                                    transition: 'width 0.5s ease'
                                }}></div>
                            </div>
                        </div>
                    </div>

                    <div style={{
                        height: '200px',
                        overflowY: 'auto',
                        border: '1px solid #ddd',
                        padding: '10px',
                        borderRadius: '8px',
                        marginBottom: '10px',
                        backgroundColor: '#fafafa'
                    }}>
                        <div style={{ marginBottom: '10px' }}>
                            <strong>Question:</strong> {displayedQuestion}
                            {isSpeaking && <span style={{ 
                                animation: 'blink 1s infinite',
                                marginLeft: '5px'
                            }}>|</span>}
                        </div>
                        <div>
                            <strong>Your Answer:</strong> {currentAnswer}
                        </div>
                        
                        <div style={{ 
                            marginTop: '10px', 
                            fontSize: '12px', 
                            color: '#999',
                            borderTop: '1px solid #eee',
                            paddingTop: '10px'
                        }}>
                            Status: {isSpeaking ? '🔊 Speaking' : isListening ? '🎤 Listening' : isMuted ? '⏳ Processing' : '⏸️ Idle'}
                        </div>
                    </div>

                    {isListening && !isMuted && (
                        <div style={{
                            textAlign: 'center',
                            margin: '10px 0',
                            padding: '10px',
                            backgroundColor: '#e8f5e9',
                            borderRadius: '8px',
                            border: '2px solid #4caf50'
                        }}>
                            <div style={{ 
                                fontWeight: 'bold', 
                                color: '#2e7d32',
                                marginBottom: '5px'
                            }}>
                                🎤 Listening... Speak your answer
                            </div>
                            <div style={{
                                fontStyle: 'italic',
                                color: '#555',
                                fontSize: '14px'
                            }}>
                                {currentTranscript || 'Waiting for your response...'}
                            </div>
                        </div>
                    )}

                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        marginTop: '20px',
                        gap: '10px'
                    }}>
                        <button
                            onClick={stopListeningAndSend}
                            disabled={!isListening || interviewEnded || isMuted}
                            style={{
                                padding: '15px 30px',
                                backgroundColor: (!isListening || interviewEnded || isMuted) ? '#ccc' : '#ff4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '8px',
                                cursor: (!isListening || interviewEnded || isMuted) ? 'not-allowed' : 'pointer',
                                fontSize: '16px',
                                fontWeight: 'bold',
                                transition: 'all 0.3s ease'
                            }}
                        >
                            {isMuted ? 'Processing...' : (isListening ? '🎤 Submit Answer' : 'Waiting...')}
                        </button>
                        
                        {isSpeaking && (
                            <button
                                onClick={skipSpeech}
                                style={{
                                    padding: '15px 30px',
                                    backgroundColor: '#ff9800',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    fontSize: '16px',
                                    fontWeight: 'bold',
                                    transition: 'all 0.3s ease'
                                }}
                            >
                                ⏭️ Skip Reading
                            </button>
                        )}
                        
                        {isMuted && !isSpeaking && (
                            <div style={{
                                padding: '15px',
                                backgroundColor: '#4ecdc4',
                                color: 'white',
                                borderRadius: '8px',
                                fontWeight: 'bold'
                            }}>
                                AI is thinking...
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Chat;  