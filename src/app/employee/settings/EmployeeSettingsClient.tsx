'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Mail, 
  Lock, 
  Calendar, 
  Camera, 
  Upload, 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  RefreshCw, 
  Video,
  X,
  Sparkles,
  Smartphone
} from 'lucide-react';

interface EmployeeSettingsClientProps {
  initialUser: {
    id: string;
    name: string;
    email: string;
    photo: string | null;
    gender: string | null;
    dob: string | null;
  };
}

export default function EmployeeSettingsClient({ initialUser }: EmployeeSettingsClientProps) {
  const { update } = useSession();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Form Fields State
  const [name, setName] = useState(initialUser.name);
  const [email] = useState(initialUser.email); // Corporate email read-only for standard security
  const [gender, setGender] = useState(initialUser.gender || '');
  const [dob, setDob] = useState(initialUser.dob || '');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [photo, setPhoto] = useState(initialUser.photo || '');

  // Media Capture State
  const [showCamera, setShowCamera] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState('');
  const [streamObj, setStreamObj] = useState<MediaStream | null>(null);

  const [fileLoading, setFileLoading] = useState(false);
  const [saveLoading, setSaveLoading] = useState(false);
  const [status, setStatus] = useState<{ type: 'SUCCESS' | 'ERROR'; text: string } | null>(null);

  // Sync form fields when server refreshes initialUser props (after save + router.refresh())
  useEffect(() => {
    setName(initialUser.name);
    setGender(initialUser.gender || '');
    setDob(initialUser.dob || '');
    setPhoto(initialUser.photo || '');
  }, [initialUser]);

  // Manage camera cleanup
  useEffect(() => {
    return () => {
      if (streamObj) {
        streamObj.getTracks().forEach((track) => track.stop());
      }
    };
  }, [streamObj]);

  const startWebcam = async () => {
    setCameraError('');
    setCameraActive(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 320, height: 320, facingMode: 'user' },
        audio: false
      });
      setStreamObj(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setCameraActive(true);
      } else {
        // Hydration delay handler
        setTimeout(() => {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setCameraActive(true);
          }
        }, 100);
      }
    } catch (err: any) {
      console.warn('Failed to access camera device:', err);
      setCameraError('Webcam device blocked or unavailable.');
    }
  };

  const stopWebcam = () => {
    if (streamObj) {
      streamObj.getTracks().forEach((track) => track.stop());
      setStreamObj(null);
    }
    setCameraActive(false);
    setShowCamera(false);
  };

  const captureWebcamFrame = async () => {
    if (!videoRef.current || !canvasRef.current) return;

    setFileLoading(true);
    setStatus(null);

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 300;
    canvas.height = 300;
    ctx.drawImage(videoRef.current, 0, 0, 300, 300);

    const selfieBase64 = canvas.toDataURL('image/jpeg');
    const base64Data = selfieBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create physical blob upload payload
    const fileBlob = new Blob([buffer], { type: 'image/jpeg' });
    const file = new File([fileBlob], 'avatar_snapshot.jpg', { type: 'image/jpeg' });

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setPhoto(data.filePath);
        setStatus({ type: 'SUCCESS', text: 'Live biometric camera photo snapped and set! Click Save Changes to sync.' });
        stopWebcam();
      } else {
        const data = await res.json();
        setStatus({ type: 'ERROR', text: data.error || 'Failed to parse snap.' });
      }
    } catch (err) {
      setStatus({ type: 'ERROR', text: 'Upload failed.' });
    } finally {
      setFileLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileLoading(true);
    setStatus(null);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        setPhoto(data.filePath);
        setStatus({ type: 'SUCCESS', text: 'Profile picture uploaded from media! Click Save Changes to sync.' });
      } else {
        const data = await res.json();
        setStatus({ type: 'ERROR', text: data.error || 'Failed to save media upload.' });
      }
    } catch (err) {
      setStatus({ type: 'ERROR', text: 'Media upload failed.' });
    } finally {
      setFileLoading(false);
    }
  };

  const handleFormSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setStatus({ type: 'ERROR', text: 'Full corporate name cannot be blank.' });
      return;
    }

    if (password) {
      if (password.length < 6) {
        setStatus({ type: 'ERROR', text: 'Security password must have at least 6 characters.' });
        return;
      }
      if (password !== confirmPassword) {
        setStatus({ type: 'ERROR', text: 'Security confirmation passwords do not match.' });
        return;
      }
    }

    setSaveLoading(true);
    setStatus(null);

    try {
      const res = await fetch('/api/employee/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          photo: photo || null,
          gender: gender || null,
          dob: dob || null,
          password: password || undefined,
        }),
      });

      if (res.ok) {
        // Synchronize browser cookie session parameters instantly
        await update({
          name: name.trim(),
          photo: photo || null,
          gender: gender || null,
          dob: dob || null,
        });

        setPassword('');
        setConfirmPassword('');
        setStatus({ type: 'SUCCESS', text: 'Your personal settings ledger was successfully saved and synced!' });
        router.refresh();
      } else {
        const data = await res.json();
        setStatus({ type: 'ERROR', text: data.error || 'Failed to update personal settings.' });
      }
    } catch (err) {
      setStatus({ type: 'ERROR', text: 'Internal database synchronization failure.' });
    } finally {
      setSaveLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-300">
      
      {/* Left Columns: Core Demographic & Settings Form */}
      <div className="lg:col-span-2 space-y-6">
        {status && (
          <div className={`flex items-start gap-2.5 p-4 border rounded-2xl text-xs leading-relaxed ${
            status.type === 'SUCCESS' 
              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
              : 'bg-rose-50 border-rose-200 text-rose-700'
          }`}>
            {status.type === 'SUCCESS' ? (
              <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            )}
            <span>{status.text}</span>
          </div>
        )}

        <form onSubmit={handleFormSave} className="bg-card border border-border p-6 md:p-8 rounded-3xl shadow-sm space-y-6">
          <div className="border-b border-border pb-4">
            <h3 className="text-base font-bold font-outfit text-slate-800 uppercase tracking-wide">Demographics Registry</h3>
            <p className="text-xs text-muted-foreground mt-0.5">Edit your primary identity fields.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            {/* Name Input */}
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-semibold block">Full Identity Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Your Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={saveLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-900 placeholder:text-slate-400 font-medium"
                  required
                />
              </div>
            </div>

            {/* Email (Read-only lock) */}
            <div className="space-y-1 opacity-75">
              <label className="text-xs text-slate-700 font-semibold block flex items-center gap-1">
                Corporate Mail Account
                <Lock className="w-3 h-3 text-slate-400" />
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl outline-none text-xs text-slate-500 select-none font-mono"
                />
              </div>
            </div>

            {/* Gender Select */}
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-semibold block">Gender Identity</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                disabled={saveLoading}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-900 font-semibold"
              >
                <option value="">-- Choose Gender --</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-Binary">Non-Binary</option>
                <option value="Other">Other / Prefer Not to Say</option>
              </select>
            </div>

            {/* Date of Birth Input */}
            <div className="space-y-1">
              <label className="text-xs text-slate-700 font-semibold block">Date of Birth (DOB)</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="date"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  disabled={saveLoading}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-900 font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Password Credentials */}
          <div className="border-t border-slate-100 pt-6 space-y-4">
            <div>
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Modify Security Password</h3>
              <p className="text-[10px] text-muted-foreground mt-0.5">Leave blank if you do not wish to reset your login credential keys.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold block">New Password Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={saveLoading}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs text-slate-700 font-semibold block">Confirm Password Key</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={saveLoading}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:border-indigo-500 focus:bg-white focus:ring-1 focus:ring-indigo-500 outline-none text-xs text-slate-900 placeholder:text-slate-400"
                  />
                </div>
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={saveLoading || fileLoading}
            className="w-full flex items-center justify-center gap-2 gradient-bg-indigo text-white font-extrabold py-3 rounded-2xl hover:shadow-lg hover:shadow-indigo-500/20 active:scale-[0.99] transition-all text-xs cursor-pointer disabled:opacity-50"
          >
            {saveLoading ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              'Save Profile Changes'
            )}
          </button>
        </form>
      </div>

      {/* Right Column: High-Tech Avatar Camera & Media Card */}
      <div className="space-y-6">
        <div className="bg-card border border-border p-6 rounded-3xl shadow-sm space-y-6 flex flex-col items-center text-center">
          <div className="border-b border-border pb-4 w-full">
            <h3 className="text-sm font-bold font-outfit text-slate-800 uppercase tracking-wide">Avatar Configuration</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Sync camera snap or media file.</p>
          </div>

          {/* Current Avatar display with high-tech glowing outlines */}
          <div className="relative group select-none">
            {photo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photo}
                alt="Avatar"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-xl ring-2 ring-indigo-500/10 group-hover:ring-indigo-500/35 transition-all duration-300"
              />
            ) : (
              <div className="w-32 h-32 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-300 shadow-inner">
                <User className="w-16 h-16" />
              </div>
            )}
            
            {fileLoading && (
              <div className="absolute inset-0 bg-slate-950/60 rounded-full flex items-center justify-center text-white backdrop-blur-[2px]">
                <RefreshCw className="w-6 h-6 animate-spin" />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h4 className="font-bold text-xs text-slate-800 font-outfit">Identification Photograph</h4>
            <p className="text-[9px] text-muted-foreground max-w-[200px] mx-auto leading-normal">
              Capture a live webcam biometric portrait or upload a static file from your local media storage.
            </p>
          </div>

          {/* Action triggers */}
          <div className="w-full grid grid-cols-2 gap-3 pt-2">
            {/* Trigger file input */}
            <label className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-slate-200 bg-slate-50/50 hover:bg-slate-50 text-slate-600 hover:border-slate-400 hover:text-slate-800 transition-all cursor-pointer select-none">
              <Upload className="w-4 h-4 text-slate-500" />
              <span className="text-[9px] font-bold tracking-wide">From Media</span>
              <input
                type="file"
                accept="image/jpeg,image/png"
                onChange={handleFileUpload}
                className="hidden"
                disabled={fileLoading || saveLoading}
              />
            </label>

            {/* Trigger Camera Viewfinder */}
            <button
              type="button"
              onClick={() => {
                setShowCamera(true);
                startWebcam();
              }}
              disabled={fileLoading || saveLoading}
              className="flex flex-col items-center justify-center gap-1.5 p-3 rounded-2xl border border-indigo-100 bg-indigo-50/20 hover:bg-indigo-50/70 text-indigo-600 hover:border-indigo-400 hover:text-indigo-800 transition-all cursor-pointer"
            >
              <Camera className="w-4 h-4 text-indigo-500" />
              <span className="text-[9px] font-bold tracking-wide">Live Camera</span>
            </button>
          </div>
        </div>

        {/* Live Camera Viewfinder Overlay Card (when open) */}
        {showCamera && (
          <div className="bg-card border-2 border-indigo-500/20 p-5 rounded-3xl shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest font-mono flex items-center gap-1">
                <Video className="w-3.5 h-3.5 animate-pulse" />
                Live Camera Feed
              </span>
              <button
                type="button"
                onClick={stopWebcam}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative aspect-square w-full rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center">
              {/* Sci-fi scanner lasers sweeps when camera is active */}
              {cameraActive && <div className="scanner-laser"></div>}

              {/* Viewfinder corner brackets */}
              <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-indigo-400 z-10"></div>
              <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-indigo-400 z-10"></div>
              <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-indigo-400 z-10"></div>
              <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-indigo-400 z-10"></div>

              {cameraError ? (
                <div className="text-center p-6 space-y-2">
                  <AlertCircle className="w-10 h-10 text-rose-500 mx-auto" />
                  <p className="text-xs font-semibold text-rose-400">{cameraError}</p>
                </div>
              ) : (
                <>
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className={`w-full h-full object-cover scale-x-[-1] ${cameraActive ? 'block' : 'hidden'}`}
                  />
                  {!cameraActive && (
                    <div className="text-center space-y-2">
                      <RefreshCw className="w-6 h-6 text-indigo-400 animate-spin mx-auto" />
                      <p className="text-[10px] text-slate-400">Mounting camera lens...</p>
                    </div>
                  )}
                </>
              )}
            </div>

            {cameraActive && (
              <button
                type="button"
                onClick={captureWebcamFrame}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-indigo-600 text-white font-bold rounded-xl shadow-md hover:bg-indigo-500 active:scale-[0.98] transition-all text-xs cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Capture & Set Snapshot
              </button>
            )}
          </div>
        )}
      </div>

      {/* Hidden canvas for video frames processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
