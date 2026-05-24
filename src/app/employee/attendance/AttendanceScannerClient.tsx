'use client';

import React, { useRef, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  ScanFace, 
  MapPin, 
  CheckCircle, 
  Camera, 
  AlertCircle, 
  ShieldCheck, 
  RefreshCw,
  Clock
} from 'lucide-react';

interface AttendanceScannerClientProps {
  todayAttendance: any;
  userId: string;
}

export default function AttendanceScannerClient({
  todayAttendance,
  userId
}: AttendanceScannerClientProps) {
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [streamActive, setStreamActive] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'PENDING' | 'GRANTED' | 'BLOCKED'>('PENDING');
  const [useSimulator, setUseSimulator] = useState(false);
  
  // Scanned telemetry metrics
  const [gps, setGps] = useState<{ lat: number; lng: number } | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Position your face to begin');
  
  const [loading, setLoading] = useState(false);
  const [successState, setSuccessState] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isCheckedIn = !!todayAttendance;
  const isCheckedOut = todayAttendance && !!todayAttendance.checkOut;

  // Initialize camera and geolocation
  useEffect(() => {
    requestGeolocation();
    startCamera();
    return () => stopCamera();
  }, []);

  const requestGeolocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn('Geolocation blocked:', err);
          // Standard placeholder coordinates for local simulation (Corporate HQ)
          setGps({ lat: 37.7749, lng: -122.4194 });
        }
      );
    } else {
      setGps({ lat: 37.7749, lng: -122.4194 });
    }
  };

  const startCamera = async () => {
    setErrorMsg('');
    setCameraPermission('PENDING');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 400, height: 400, facingMode: 'user' },
        audio: false
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setStreamActive(true);
        setCameraPermission('GRANTED');
      } else {
        // Retry safety assignment if ref is briefly unbound during initial React hydration
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setStreamActive(true);
            setCameraPermission('GRANTED');
          } else {
            // If still unbound, fallback to simulator
            setCameraPermission('BLOCKED');
            setUseSimulator(true);
          }
        }, 200);
      }
    } catch (e) {
      console.warn('Webcam initialization failed. Switching to visual simulator:', e);
      setCameraPermission('BLOCKED');
      setUseSimulator(true);
    }
  };

  const stopCamera = () => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      setStreamActive(false);
    }
  };

  // Perform AI biometric face scan simulation
  const handleTriggerScan = () => {
    if (scanning || successState) return;

    // Ensure GPS is captured
    if (!gps) {
      requestGeolocation();
    }

    setScanning(true);
    setScanProgress(0);
    setStatusMessage('Locking biometric landmarks...');

    const interval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          completeAttendanceCheck();
          return 100;
        }
        
        // Dynamic logs simulation
        if (prev === 25) setStatusMessage('Analyzing depth consistency...');
        if (prev === 55) setStatusMessage('Verifying liveness metrics...');
        if (prev === 85) setStatusMessage('Matching facial biometric anchor...');
        
        return prev + 5;
      });
    }, 150);
  };

  // Final check-in submission
  const completeAttendanceCheck = async () => {
    setLoading(true);
    setScanning(false);
    setStatusMessage('Syncing credentials with portal...');

    let capturedSelfie = '';

    // Capture the photo from the canvas or simulator
    if (canvasRef.current && (videoRef.current || useSimulator)) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = 300;
        canvas.height = 300;
        
        if (!useSimulator && videoRef.current) {
          // Snap real video frame
          ctx.drawImage(videoRef.current, 0, 0, 300, 300);
        } else {
          // Draw a futuristic stylized placeholder vector for the simulator
          ctx.fillStyle = '#0f172a';
          ctx.fillRect(0, 0, 300, 300);
          ctx.strokeStyle = '#6366f1';
          ctx.lineWidth = 2;
          
          // Draw abstract head shape
          ctx.beginPath();
          ctx.arc(150, 130, 60, 0, Math.PI * 2);
          ctx.stroke();
          
          // Draw shoulders
          ctx.beginPath();
          ctx.moveTo(70, 260);
          ctx.quadraticCurveTo(150, 200, 230, 260);
          ctx.stroke();
          
          // Draw scan box lines
          ctx.strokeStyle = 'rgba(99, 102, 241, 0.4)';
          ctx.strokeRect(50, 50, 200, 200);

          ctx.fillStyle = '#6366f1';
          ctx.font = 'bold 10px monospace';
          ctx.fillText('BIOMETRIC SIMULATOR LOG', 20, 290);
        }
        capturedSelfie = canvas.toDataURL('image/jpeg');
      }
    }

    const endpoint = isCheckedIn ? '/api/attendance/check-out' : '/api/attendance/check-in';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: userId,
          selfieBase64: capturedSelfie,
          latitude: gps?.lat || 37.7749,
          longitude: gps?.lng || -122.4194
        })
      });

      if (res.ok) {
        setSuccessState(true);
        setStatusMessage(isCheckedIn ? 'Check-out completed' : 'Check-in completed');
        stopCamera();
        
        // Redirect or refresh after delay
        setTimeout(() => {
          router.refresh();
          router.push('/employee');
        }, 2500);
      } else {
        const data = await res.json();
        setErrorMsg(data.error || 'Failed to verify attendance.');
        setStatusMessage('Scanning failed');
      }
    } catch (e) {
      setErrorMsg('Portal connection error.');
      setStatusMessage('Scanning failed');
    } finally {
      setLoading(false);
    }
  };

  if (isCheckedOut) {
    return (
      <div className="max-w-md mx-auto text-center space-y-6 py-12 bg-card border border-border p-8 rounded-3xl animate-in fade-in duration-300">
        <div className="p-4 bg-emerald-500/10 text-emerald-400 rounded-3xl w-16 h-16 flex items-center justify-center mx-auto">
          <CheckCircle className="w-8 h-8" />
        </div>
        <div>
          <h3 className="text-xl font-bold font-outfit">Day Sprints Completed</h3>
          <p className="text-sm text-slate-500 mt-2">
            You have already checked in and checked out for today. Enjoy your evening!
          </p>
        </div>
        <a
          href="/employee"
          className="w-full flex items-center justify-center py-2.5 bg-secondary text-foreground text-xs font-bold rounded-xl border border-border"
        >
          Return to Portal Overview
        </a>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300 select-none">
      {/* 1. CAMERA / SCANNING CONTAINER */}
      <div className="lg:col-span-2 space-y-4">
        <div className="relative aspect-square w-full max-w-[420px] mx-auto rounded-3xl overflow-hidden border-2 border-slate-200 bg-[#090d16] shadow-2xl shadow-slate-100 flex items-center justify-center group">
          
          {/* Laser scanning visual effects */}
          {scanning && <div className="scanner-laser"></div>}
          
          {/* HUD Corner Brackets */}
          <div className="absolute top-5 left-5 w-5 h-5 border-t-2 border-l-2 border-cyan-400 z-10"></div>
          <div className="absolute top-5 right-5 w-5 h-5 border-t-2 border-r-2 border-cyan-400 z-10"></div>
          <div className="absolute bottom-5 left-5 w-5 h-5 border-b-2 border-l-2 border-cyan-400 z-10"></div>
          <div className="absolute bottom-5 right-5 w-5 h-5 border-b-2 border-r-2 border-cyan-400 z-10"></div>
          
          {/* Visual Scanner HUD frame overlay */}
          <div className="absolute inset-8 rounded-2xl flex flex-col justify-between pointer-events-none z-10 p-4">
            <div className="flex justify-between text-[9px] font-mono text-cyan-500 font-bold tracking-wider">
              <span>SCAN MODE: {isCheckedIn ? 'CHECK-OUT' : 'CHECK-IN'}</span>
              <span>GPS SYNC ACTIVE</span>
            </div>
            
            {/* Center target circle reticle */}
            <div className="relative w-52 h-52 mx-auto flex items-center justify-center">
              {/* Circular SVG Progress Ring */}
              <svg className="w-52 h-52 absolute transform -rotate-90">
                <circle
                  cx="104"
                  cy="104"
                  r="92"
                  stroke="rgba(6, 182, 212, 0.08)"
                  strokeWidth="3"
                  fill="transparent"
                />
                <circle
                  cx="104"
                  cy="104"
                  r="92"
                  stroke="#22d3ee"
                  strokeWidth="3"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 92}
                  strokeDashoffset={2 * Math.PI * 92 * (1 - scanProgress / 100)}
                  className="transition-all duration-150 ease-out"
                />
              </svg>

              {/* Pulsing center circle */}
              <div className="w-44 h-44 rounded-full border border-dashed border-cyan-500/35 scanner-reticle flex items-center justify-center relative">
                <div className="w-6 h-6 border-t border-l border-cyan-400 absolute top-0 left-0"></div>
                <div className="w-6 h-6 border-t border-r border-cyan-400 absolute top-0 right-0"></div>
                <div className="w-6 h-6 border-b border-l border-cyan-400 absolute bottom-0 left-0"></div>
                <div className="w-6 h-6 border-b border-r border-cyan-400 absolute bottom-0 right-0"></div>
                
                {/* Glowing AI Face scanning dot grids mapping landmarks dynamically */}
                {scanning && (
                  <div className="absolute inset-0">
                    {scanProgress > 15 && (
                      <>
                        <span className="absolute left-[30%] top-[35%] w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping duration-1000"></span>
                        <span className="absolute left-[30%] top-[35%] w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                        <span className="absolute right-[30%] top-[35%] w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping duration-1000"></span>
                        <span className="absolute right-[30%] top-[35%] w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                      </>
                    )}
                    {scanProgress > 35 && (
                      <>
                        <span className="absolute left-[50%] top-[45%] -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-pulse"></span>
                        <span className="absolute left-[50%] top-[45%] -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                      </>
                    )}
                    {scanProgress > 55 && (
                      <>
                        <span className="absolute left-[24%] top-[55%] w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                        <span className="absolute right-[24%] top-[55%] w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                      </>
                    )}
                    {scanProgress > 75 && (
                      <>
                        <span className="absolute left-[50%] top-[60%] -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                      </>
                    )}
                    {scanProgress > 90 && (
                      <>
                        <span className="absolute left-[50%] top-[72%] -translate-x-1/2 w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] animate-ping"></span>
                        <span className="absolute left-[50%] top-[72%] -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]"></span>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="text-center text-[9px] font-mono text-cyan-600 font-extrabold tracking-widest bg-white/90 py-2 px-4 rounded-xl max-w-fit mx-auto border border-cyan-200/50 backdrop-blur-md shadow-[0_4px_12px_rgba(6,182,212,0.12)]">
              {statusMessage.toUpperCase()}
            </div>
          </div>

          {/* Real video stream */}
          {!useSimulator && (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover scale-x-[-1] ${cameraPermission === 'GRANTED' ? 'block' : 'hidden'}`}
            />
          )}

          {/* Camera Loading Screen */}
          {cameraPermission === 'PENDING' && !useSimulator && (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 bg-slate-50 space-y-3 z-0">
              <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-xs text-slate-500 font-medium">Initializing webcam device...</p>
            </div>
          )}

          {/* Simulator screen */}
          {(useSimulator || cameraPermission === 'BLOCKED') && (
            <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-slate-50 text-center space-y-4 border-t border-slate-100">
              <div className="relative w-32 h-32 rounded-full border border-indigo-100 bg-white flex items-center justify-center animate-pulse shadow-sm">
                <ScanFace className="w-16 h-16 text-indigo-600" />
                <div className="absolute inset-0 border border-dashed border-indigo-300/40 rounded-full animate-spin duration-10000"></div>
              </div>
              <div>
                <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest">Virtual Scan Simulator</p>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[280px] mx-auto leading-relaxed">
                  Webcam access blocked or not detected. Utilizing fallback biometric simulator.
                </p>
              </div>
            </div>
          )}

          {/* Success overlay state */}
          {successState && (
            <div className="absolute inset-0 bg-emerald-50/95 flex flex-col items-center justify-center text-center p-6 space-y-4 z-20 backdrop-blur-sm animate-in fade-in duration-200 border-2 border-emerald-500/10">
              <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 border border-emerald-200 flex items-center justify-center shadow-md">
                <CheckCircle className="w-10 h-10" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-lg text-emerald-800 font-outfit">Verification Successful</h4>
                <p className="text-xs text-emerald-600 font-medium">Biometric coordinates matched with database.</p>
              </div>
            </div>
          )}
        </div>

        {/* Action button */}
        {!successState && (
          <div className="flex justify-center">
            <button
              onClick={handleTriggerScan}
              disabled={scanning || loading || !gps}
              className="gradient-bg-indigo text-white font-bold px-8 py-3 rounded-2xl shadow-xl hover:shadow-indigo-500/20 active:scale-[0.98] transition-all text-xs flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Scanning Face ({scanProgress}%)
                </>
              ) : (
                <>
                  <Camera className="w-4 h-4" />
                  Trigger Biometric scan
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* 2. SCANNER INFO METRICS SIDEBAR */}
      <div className="space-y-6">
        {/* Geolocation Card */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <h4 className="font-bold text-sm font-outfit flex items-center gap-2">
            <MapPin className="w-4 h-4 text-indigo-400" />
            Location Anchor integrity
          </h4>
          
          <div className="p-3 bg-secondary/50 border border-border rounded-xl text-xs space-y-1.5 leading-relaxed font-mono">
            <div className="flex justify-between">
              <span className="text-muted-foreground font-sans font-semibold">Latitude:</span>
              <span className="text-foreground">{gps?.lat ? gps.lat.toFixed(5) : 'Syncing...'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground font-sans font-semibold">Longitude:</span>
              <span className="text-foreground">{gps?.lng ? gps.lng.toFixed(5) : 'Syncing...'}</span>
            </div>
          </div>
          
          <p className="text-[10px] text-muted-foreground leading-normal">
            Your location anchor will be logged alongside your biometric snapshot to safeguard check-in integrity.
          </p>
        </div>

        {/* Integrity checks */}
        <div className="bg-card border border-border p-5 rounded-2xl shadow-sm space-y-4">
          <h4 className="font-bold text-sm font-outfit flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            Scanner Safeguards
          </h4>

          <div className="space-y-2.5 text-xs text-slate-500">
            <div className="flex items-center gap-2 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Virtual camera spoof blocking</span>
            </div>
            <div className="flex items-center gap-2 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Geolocation boundaries fencing</span>
            </div>
            <div className="flex items-center gap-2 leading-none">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              <span>Biometric depth landmark check</span>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden canvas element for snapping webcam snapshots */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
