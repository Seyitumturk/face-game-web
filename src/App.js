import React, { useEffect, useRef, useState } from 'react';
import * as tf from '@tensorflow/tfjs';
import * as faceDetection from '@tensorflow-models/face-detection';
import './App.css';

function App() {
  const videoRef = useRef(null);
  const [ballPosition, setBallPosition] = useState(50);
  const [detector, setDetector] = useState(null);
  const [error, setError] = useState(null);

  // Initialize face detector
  useEffect(() => {
    const initializeDetector = async () => {
      try {
        await tf.ready();
        const model = faceDetection.SupportedModels.MediaPipeFaceDetector;
        const detector = await faceDetection.createDetector(model, {
          runtime: 'tfjs',
          refineLandmarks: true,
        });
        setDetector(detector);
        startVideo();
      } catch (err) {
        console.error('Error initializing detector:', err);
        setError('Failed to initialize face detector');
      }
    };

    initializeDetector();
  }, []);

  // Start video stream
  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error('Error accessing camera:', err);
      setError('Failed to access camera');
    }
  };

  // Handle face detection
  useEffect(() => {
    if (!detector || !videoRef.current) return;

    let animationFrameId;
    
    const detectFaces = async () => {
      try {
        if (videoRef.current.readyState === 4) {
          const faces = await detector.estimateFaces(videoRef.current);
          
          if (faces.length > 0) {
            // Get the y position of the right eye and eyebrow
            const rightEye = faces[0].keypoints[159]; // Right eye upper edge
            const rightEyebrow = faces[0].keypoints[52]; // Right eyebrow
            
            // Calculate the distance between eyebrow and eye
            const distance = Math.abs(rightEyebrow.y - rightEye.y);
            
            // Threshold for raised eyebrows (adjust as needed)
            if (distance > 20) {
              setBallPosition(prev => Math.max(0, prev - 10));
            } else {
              setBallPosition(prev => Math.min(400, prev + 5));
            }
          }
        }
        
        animationFrameId = requestAnimationFrame(detectFaces);
      } catch (err) {
        console.error('Detection error:', err);
        setError('Face detection error');
      }
    };

    detectFaces();

    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [detector]);

  return (
    <div className="App">
      <h1>Eyebrow Ball Game</h1>
      <p>Raise your eyebrows to move the ball up!</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <div className="game-container">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="video-feed"
        />
        <div 
          className="ball"
          style={{ 
            bottom: `${ballPosition}px`,
            height: '30px',
            backgroundColor: '#61dafb',
            borderRadius: '50%'
          }}
        />
      </div>
    </div>
  );
}

export default App; 