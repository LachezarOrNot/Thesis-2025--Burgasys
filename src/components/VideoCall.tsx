import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Users,
  X,
  Mic,
  MicOff,
  Video as VideoIcon,
  VideoOff,
  Monitor
} from 'lucide-react';
// IMPORTANT: Install the Agora Web SDK first:
// npm install agora-rtc-sdk-ng
import type {
  IAgoraRTCClient,
  ILocalAudioTrack,
  ILocalVideoTrack
} from 'agora-rtc-sdk-ng';
import AgoraRTC from 'agora-rtc-sdk-ng';

interface VideoCallProps {
  eventId: string;
  onClose: () => void;
  userName?: string;
}

const AGORA_APP_ID = import.meta.env.VITE_AGORA_APP_ID as string | undefined;
const AGORA_TEMP_TOKEN = import.meta.env.VITE_AGORA_TEMP_TOKEN as string | undefined;

const VideoCall: React.FC<VideoCallProps> = ({ eventId, onClose, userName = 'Guest' }) => {
  const localVideoRef = useRef<HTMLDivElement | null>(null);
  const remoteVideoRef = useRef<HTMLDivElement | null>(null);

  const clientRef = useRef<IAgoraRTCClient | null>(null);
  const localAudioTrackRef = useRef<ILocalAudioTrack | null>(null);
  const localVideoTrackRef = useRef<ILocalVideoTrack | null>(null);
  const screenTrackRef = useRef<ILocalVideoTrack | null>(null);

  const [isJoining, setIsJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(false);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [isCameraEnabled, setIsCameraEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<any[]>([]);
  const [hasRemoteParticipant, setHasRemoteParticipant] = useState(false);

  const channelName = useMemo(() => {
    const slug = eventId
      .replace(/[^a-zA-Z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .toLowerCase();
    return `eventbeta-${slug || 'default'}`;
  }, [eventId]);

  const leaveCallInternal = async () => {
    try {
      if (clientRef.current) {
        await clientRef.current.unpublish();
        await clientRef.current.leave();
        clientRef.current.removeAllListeners();
      }

      if (localAudioTrackRef.current) {
        localAudioTrackRef.current.stop();
        localAudioTrackRef.current.close();
      }
      if (localVideoTrackRef.current) {
        localVideoTrackRef.current.stop();
        localVideoTrackRef.current.close();
      }
      if (screenTrackRef.current) {
        screenTrackRef.current.stop();
        screenTrackRef.current.close();
      }

      localAudioTrackRef.current = null;
      localVideoTrackRef.current = null;
      screenTrackRef.current = null;
      clientRef.current = null;
      setRemoteUsers([]);
      setIsJoined(false);
      setIsScreenSharing(false);
    } catch (err) {
      console.error('Error leaving Agora call:', err);
    }
  };

  useEffect(() => {
    return () => {
      void leaveCallInternal();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const joinCall = async () => {
    if (!AGORA_APP_ID) {
      setError(
        'Agora is not configured. Please set VITE_AGORA_APP_ID (and optionally VITE_AGORA_TEMP_TOKEN) in your .env file.'
      );
      return;
    }

    if (isJoined || isJoining) return;

    try {
      setIsJoining(true);
      setError(null);

      const client = AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' });
      clientRef.current = client;

      const refreshRemoteUsers = () => {
        const list = Array.from(client.remoteUsers || []);
        setRemoteUsers(list);
        setHasRemoteParticipant(list.length > 0);
      };

      client.on('user-published', async (user: any, mediaType: 'audio' | 'video') => {
        try {
          await client.subscribe(user, mediaType);
          if (mediaType === 'video') {
            if (remoteVideoRef.current && user.videoTrack) {
              user.videoTrack.play(remoteVideoRef.current);
            }
          }
          if (mediaType === 'audio') {
            user.audioTrack?.play();
          }
          refreshRemoteUsers();
        } catch (err) {
          console.error('Error subscribing to remote user:', err);
        }
      });

      client.on('user-joined', () => {
        refreshRemoteUsers();
      });

      client.on('user-unpublished', (user: any, mediaType: 'audio' | 'video') => {
        if (mediaType === 'video') {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.innerHTML = '';
          }
        }
        refreshRemoteUsers();
      });

      client.on('user-left', () => {
        refreshRemoteUsers();
      });

      const uid = `${userName || 'guest'}-${Math.floor(Math.random() * 1_000_000)}`;

      await client.join(AGORA_APP_ID, channelName, AGORA_TEMP_TOKEN || null, uid);
      refreshRemoteUsers();

      // Subscribe to already-present users who may have published before we joined
      for (const u of Array.from(client.remoteUsers || [])) {
        try {
          if (u.hasVideo) {
            await client.subscribe(u, 'video');
            if (remoteVideoRef.current && u.videoTrack) {
              u.videoTrack.play(remoteVideoRef.current);
            }
          }
          if (u.hasAudio) {
            await client.subscribe(u, 'audio');
            u.audioTrack?.play();
          }
        } catch (subErr) {
          console.warn('Failed subscribing to existing remote user:', subErr);
        }
      }

      // Try to get both mic and camera; if that fails due to missing devices,
      // gracefully fall back to audio-only so the user can still join.
      let micTrack: ILocalAudioTrack | null = null;
      let camTrack: ILocalVideoTrack | null = null;

      try {
        const tracks = await AgoraRTC.createMicrophoneAndCameraTracks();
        micTrack = tracks[0];
        camTrack = tracks[1];
      } catch (mediaErr: any) {
        console.error('Error creating mic+camera tracks, falling back to audio-only:', mediaErr);
        // Agora wraps underlying NotFoundError as DEVICE_NOT_FOUND
        setError('No camera detected. Joining call with audio only.');
        try {
          micTrack = await AgoraRTC.createMicrophoneAudioTrack();
        } catch (audioErr: any) {
          console.error('Error creating microphone track:', audioErr);
          setError('No usable microphone/camera devices were found on this device.');
          throw audioErr;
        }
      }

      if (!micTrack) {
        throw new Error('Microphone track is required to join the call.');
      }

      localAudioTrackRef.current = micTrack;
      if (camTrack) {
        localVideoTrackRef.current = camTrack;
      }

      if (localVideoRef.current && camTrack) {
        camTrack.play(localVideoRef.current);
      }

      const publishTracks = camTrack ? [micTrack, camTrack] : [micTrack];
      await client.publish(publishTracks);

      setIsJoined(true);
      setIsMicEnabled(true);
      setIsCameraEnabled(!!camTrack);
      setIsScreenSharing(false);
    } catch (err: any) {
      console.error('Error joining Agora call:', err);
      if (err?.name === 'NotAllowedError') {
        setError('Permission denied for camera/microphone. Please allow access and try again.');
      } else if (err?.name === 'NotFoundError') {
        setError('No camera/microphone device found on this device.');
      } else {
        setError('Failed to start the call. Please check your devices and network and try again.');
      }
      await leaveCallInternal();
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeave = async () => {
    await leaveCallInternal();
    onClose();
  };

  const toggleMic = async () => {
    const track = localAudioTrackRef.current;
    if (!track) {
      setError('No active microphone track.');
      return;
    }
    const next = !isMicEnabled;
    await track.setEnabled(next);
    setIsMicEnabled(next);
  };

  const toggleCamera = async () => {
    const track = localVideoTrackRef.current;
    if (!track) {
      setError('No active camera track.');
      return;
    }
    const next = !isCameraEnabled;
    await track.setEnabled(next);
    setIsCameraEnabled(next);
  };

  const stopScreenShare = async () => {
    if (!clientRef.current) return;

    if (screenTrackRef.current) {
      await clientRef.current.unpublish(screenTrackRef.current);
      screenTrackRef.current.stop();
      screenTrackRef.current.close();
      screenTrackRef.current = null;
    }

    if (localVideoTrackRef.current) {
      await clientRef.current.publish(localVideoTrackRef.current);
      if (localVideoRef.current) {
        localVideoTrackRef.current.play(localVideoRef.current);
      }
    }

    setIsScreenSharing(false);
  };

  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      await stopScreenShare();
      return;
    }

    if (!clientRef.current) {
      setError('Join the call before starting screen share.');
      return;
    }

    if (!AgoraRTC.createScreenVideoTrack) {
      setError('Screen sharing is not supported in this browser or environment.');
      return;
    }

    try {
      const screenTrack = (await AgoraRTC.createScreenVideoTrack(
        {},
        'auto'
      )) as ILocalVideoTrack;

      screenTrackRef.current = screenTrack;

      if (localVideoTrackRef.current) {
        await clientRef.current.unpublish(localVideoTrackRef.current);
        localVideoTrackRef.current.stop();
      }

      await clientRef.current.publish(screenTrack);

      if (localVideoRef.current) {
        screenTrack.play(localVideoRef.current);
      }

      screenTrack.on('track-ended', () => {
        void stopScreenShare();
      });

      setIsScreenSharing(true);
    } catch (err: any) {
      console.error('Error starting screen share:', err);
      if (err?.name === 'NotAllowedError') {
        setError('Screen share permission was denied.');
      } else {
        setError('Could not start screen sharing. This may not be supported on this device.');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      {/* Soft background grid / glow */}
      <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-screen">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-purple-500/25 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-0 w-96 h-96 bg-blue-500/25 rounded-full blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.15),transparent_60%)]" />
      </div>
      {/* Top bar */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-slate-950/90 to-transparent p-4">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-pulse shadow-[0_0_10px_rgba(52,211,153,0.9)]" />
            <span className="text-white font-semibold text-sm md:text-base">Live call</span>
            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm border border-white/10">
              <Users className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-medium">
                {channelName}
              </span>
            </div>
          </div>

          {/* No close button here, main hang-up is in bottom controls */}
          <div className="flex items-center gap-2" />
        </div>
      </div>

      {/* Main videos */}
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative w-full max-w-5xl h-[70vh] md:h-[75vh] px-4 md:px-8">
          {/* Remote video - always fills the main area */}
          <div className="absolute inset-0 rounded-2xl bg-black overflow-hidden border border-white/10 shadow-2xl">
            <div ref={remoteVideoRef} className="w-full h-full" />
            {!hasRemoteParticipant && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-4">
                <div className="w-12 h-12 rounded-full border-2 border-white/40 border-t-transparent animate-spin mb-4" />
                <p className="text-white font-medium text-sm md:text-base">
                  Waiting for others to join the call...
                </p>
                <p className="text-gray-400 text-xs mt-2">
                  Ask participants to open the event chat and join the call.
                </p>
              </div>
            )}
          </div>

          {/* Local preview as picture-in-picture overlay */}
          <div className="absolute bottom-6 right-6 w-40 md:w-64 h-32 md:h-40 rounded-2xl overflow-hidden border border-white/30 bg-black/80 shadow-xl">
            <div ref={localVideoRef} className="w-full h-full" />
            {!isJoined && !isJoining && (
              <div className="absolute inset-0 flex items-center justify-center text-center px-3">
                <button
                  onClick={joinCall}
                  className="px-4 py-2 rounded-full bg-blue-500 hover:bg-blue-600 text-white text-xs font-semibold shadow-lg"
                >
                  Join call
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom controls */}
      {isJoined && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3 bg-black/70 backdrop-blur-md px-4 py-2 rounded-full shadow-2xl">
          <button
            onClick={toggleMic}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isMicEnabled ? 'bg-white text-black' : 'bg-red-600 text-white'
            }`}
            title={isMicEnabled ? 'Mute microphone' : 'Unmute microphone'}
          >
            {isMicEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleCamera}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isCameraEnabled ? 'bg-white text-black' : 'bg-yellow-500 text-black'
            }`}
            title={isCameraEnabled ? 'Turn camera off' : 'Turn camera on'}
          >
            {isCameraEnabled ? (
              <VideoIcon className="w-4 h-4" />
            ) : (
              <VideoOff className="w-4 h-4" />
            )}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
              isScreenSharing ? 'bg-blue-500 text-white' : 'bg-white text-black'
            }`}
            title={isScreenSharing ? 'Stop screen sharing' : 'Share screen (desktop only)'}
          >
            <Monitor className="w-4 h-4" />
          </button>

          {/* End call button (next to share screen) */}
          <button
            onClick={handleLeave}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-red-600 hover:bg-red-500 text-white font-semibold text-xs px-4 transition-colors"
            title="End call"
          >
            End
          </button>
        </div>
      )}

      {/* Joining overlay */}
      {isJoining && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h2 className="text-white text-lg mb-2">Connecting...</h2>
            <p className="text-gray-400 text-sm">Setting up secure audio &amp; video via Agora</p>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-red-600/90 text-white px-4 py-2 rounded-full text-xs shadow-lg max-w-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default VideoCall;
