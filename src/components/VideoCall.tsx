import React, { useEffect, useRef, useState } from 'react';
import AgoraRTC, {
  IAgoraRTCClient,
  ICameraVideoTrack,
  IMicrophoneAudioTrack,
  IAgoraRTCRemoteUser,
  UID,
  IRemoteVideoTrack,
  IRemoteAudioTrack,
  ILocalVideoTrack
} from 'agora-rtc-sdk-ng';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  Users,
  Maximize2,
  Minimize2,
  VolumeX,
  Camera,
  X,
  User
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface VideoCallProps {
  eventId: string;
  onClose: () => void;
  appId: string;
  token?: string;
}

interface RemoteUser {
  uid: UID;
  videoTrack?: IRemoteVideoTrack;
  audioTrack?: IRemoteAudioTrack;
  hasVideo: boolean;
  hasAudio: boolean;
}

const VideoCall: React.FC<VideoCallProps> = ({ eventId, onClose, appId, token }) => {
  const { user } = useAuth();
  const [client] = useState<IAgoraRTCClient>(() => AgoraRTC.createClient({ mode: 'rtc', codec: 'vp8' }));
  
  const [localVideoTrack, setLocalVideoTrack] = useState<ICameraVideoTrack | null>(null);
  const [localAudioTrack, setLocalAudioTrack] = useState<IMicrophoneAudioTrack | null>(null);
  const [remoteUsers, setRemoteUsers] = useState<Map<UID, RemoteUser>>(new Map());
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(false);
  const [isAudioEnabled, setIsAudioEnabled] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string>('');
  const [showJoinOptions, setShowJoinOptions] = useState(true);
  
  const localVideoRef = useRef<HTMLDivElement>(null);
  const screenShareTrackRef = useRef<ILocalVideoTrack | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Join the channel immediately on mount
  useEffect(() => {
    const joinChannel = async () => {
      try {
        setIsConnecting(true);
        
        // Setup event listeners
        client.on('user-published', handleUserPublished);
        client.on('user-unpublished', handleUserUnpublished);
        client.on('user-left', handleUserLeft);
        
        // Join the channel
        await client.join(appId, eventId, token || null, user?.uid || null);
        
        console.log('Joined channel successfully');
        setIsConnecting(false);
        
      } catch (err) {
        console.error('Failed to join channel:', err);
        setError('Failed to join the call. Please try again.');
        setIsConnecting(false);
      }
    };

    joinChannel();

    return () => {
      cleanup();
    };
  }, []);

  // Handle remote user published
  const handleUserPublished = async (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    try {
      await client.subscribe(user, mediaType);
      
      setRemoteUsers(prev => {
        const newMap = new Map(prev);
        const existingUser = newMap.get(user.uid) || {
          uid: user.uid,
          hasVideo: false,
          hasAudio: false
        };
        
        if (mediaType === 'video' && user.videoTrack) {
          existingUser.videoTrack = user.videoTrack as IRemoteVideoTrack;
          existingUser.hasVideo = true;
          
          setTimeout(() => {
            const container = document.getElementById(`remote-${user.uid}`);
            if (container && user.videoTrack) {
              user.videoTrack.play(container);
            }
          }, 100);
        }
        
        if (mediaType === 'audio' && user.audioTrack) {
          existingUser.audioTrack = user.audioTrack as IRemoteAudioTrack;
          existingUser.hasAudio = true;
          user.audioTrack?.play();
        }
        
        newMap.set(user.uid, existingUser);
        return newMap;
      });
    } catch (err) {
      console.error('Error handling user published:', err);
    }
  };

  // Handle remote user unpublished
  const handleUserUnpublished = (user: IAgoraRTCRemoteUser, mediaType: 'audio' | 'video') => {
    setRemoteUsers(prev => {
      const newMap = new Map(prev);
      const existingUser = newMap.get(user.uid);
      
      if (existingUser) {
        if (mediaType === 'video') {
          existingUser.hasVideo = false;
          existingUser.videoTrack = undefined;
        }
        if (mediaType === 'audio') {
          existingUser.hasAudio = false;
          existingUser.audioTrack = undefined;
        }
        newMap.set(user.uid, existingUser);
      }
      
      return newMap;
    });
  };

  // Handle user left
  const handleUserLeft = (user: IAgoraRTCRemoteUser) => {
    setRemoteUsers(prev => {
      const newMap = new Map(prev);
      newMap.delete(user.uid);
      return newMap;
    });
  };

  // Join without media (listen only) - DEFAULT OPTION
  const joinWithoutMedia = () => {
    setShowJoinOptions(false);
    // User joins as listener without any tracks
  };

  // Try to enable audio
  const enableAudio = async () => {
    try {
      const audioTrack = await AgoraRTC.createMicrophoneAudioTrack();
      setLocalAudioTrack(audioTrack);
      await client.publish(audioTrack);
      setIsAudioEnabled(true);
    } catch (err) {
      console.error('Failed to enable audio:', err);
      setError('Could not access microphone. You can still listen to the call.');
    }
  };

  // Try to enable video
  const enableVideo = async () => {
    try {
      const videoTrack = await AgoraRTC.createCameraVideoTrack();
      setLocalVideoTrack(videoTrack);
      
      if (localVideoRef.current) {
        videoTrack.play(localVideoRef.current);
      }
      
      await client.publish(videoTrack);
      setIsVideoEnabled(true);
    } catch (err) {
      console.error('Failed to enable video:', err);
      setError('Could not access camera. You can still listen to the call.');
    }
  };

  // Toggle video
  const toggleVideo = async () => {
    if (isVideoEnabled) {
      // Disable video
      if (localVideoTrack) {
        await localVideoTrack.setEnabled(false);
      }
      setIsVideoEnabled(false);
    } else {
      // Enable video
      await enableVideo();
    }
  };

  // Toggle audio
  const toggleAudio = async () => {
    if (isAudioEnabled) {
      // Disable audio
      if (localAudioTrack) {
        await localAudioTrack.setEnabled(false);
      }
      setIsAudioEnabled(false);
    } else {
      // Enable audio
      await enableAudio();
    }
  };

  // Toggle screen share
  const toggleScreenShare = async () => {
    if (isScreenSharing) {
      try {
        if (screenShareTrackRef.current) {
          await client.unpublish(screenShareTrackRef.current);
          screenShareTrackRef.current.stop();
          screenShareTrackRef.current.close();
          screenShareTrackRef.current = null;
        }
        
        if (localVideoTrack) {
          await client.publish(localVideoTrack);
        }
        
        setIsScreenSharing(false);
      } catch (err) {
        console.error('Error stopping screen share:', err);
      }
    } else {
      try {
        const screenTrack = await AgoraRTC.createScreenVideoTrack({}, 'disable') as ILocalVideoTrack;
        screenShareTrackRef.current = screenTrack;
        
        if (localVideoTrack) {
          await client.unpublish(localVideoTrack);
        }
        
        await client.publish(screenTrack);
        setIsScreenSharing(true);
      } catch (err) {
        console.error('Error starting screen share:', err);
      }
    }
  };

  // Toggle fullscreen
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  // Leave call
  const leaveCall = async () => {
    await cleanup();
    onClose();
  };

  // Cleanup function
  const cleanup = async () => {
    try {
      if (localAudioTrack) {
        localAudioTrack.stop();
        localAudioTrack.close();
      }
      if (localVideoTrack) {
        localVideoTrack.stop();
        localVideoTrack.close();
      }
      if (screenShareTrackRef.current) {
        screenShareTrackRef.current.stop();
        screenShareTrackRef.current.close();
      }
      
      client.removeAllListeners();
      await client.leave();
    } catch (err) {
      console.error('Error during cleanup:', err);
    }
  };

  // Calculate grid layout
  const getGridClass = () => {
    const totalUsers = remoteUsers.size + (localVideoTrack || localAudioTrack ? 1 : 0);
    if (totalUsers === 0) return 'grid-cols-1';
    if (totalUsers === 1) return 'grid-cols-1';
    if (totalUsers === 2) return 'grid-cols-2';
    if (totalUsers <= 4) return 'grid-cols-2 grid-rows-2';
    return 'grid-cols-2 grid-rows-2';
  };

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black"
    >
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-10 bg-black/80 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              <span className="text-white font-bold">Live Call</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white">{remoteUsers.size + (localVideoTrack || localAudioTrack ? 1 : 0)}</span>
            </div>
          </div>
          
          <button
            onClick={leaveCall}
            className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Video Grid */}
      <div className={`h-full w-full grid ${getGridClass()} gap-2 p-4 pt-16`}>
        {/* Local Video - Only show if enabled */}
        {(localVideoTrack || localAudioTrack) && (
          <div className="relative bg-gray-900 rounded-xl overflow-hidden">
            <div ref={localVideoRef} className="w-full h-full"></div>
            
            {!isVideoEnabled && localVideoTrack && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white">Camera Off</p>
                  <p className="text-gray-400 text-sm">{user?.displayName || 'You'}</p>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-lg">
              <p className="text-white text-sm">{user?.displayName || 'You'}</p>
            </div>
            
            {!isAudioEnabled && localAudioTrack && (
              <div className="absolute top-2 right-2 bg-red-500 p-1 rounded">
                <MicOff className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        )}

        {/* Remote Videos */}
        {Array.from(remoteUsers.values()).map((remoteUser) => (
          <div
            key={remoteUser.uid}
            className="relative bg-gray-900 rounded-xl overflow-hidden"
          >
            <div id={`remote-${remoteUser.uid}`} className="w-full h-full"></div>
            
            {!remoteUser.hasVideo && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
                <div className="text-center">
                  <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-2">
                    <User className="w-8 h-8 text-white" />
                  </div>
                  <p className="text-white">
                    {remoteUser.hasAudio ? 'Audio Only' : 'Listening'}
                  </p>
                  <p className="text-gray-400 text-sm">User {remoteUser.uid}</p>
                </div>
              </div>
            )}
            
            <div className="absolute bottom-2 left-2 bg-black/50 px-3 py-1 rounded-lg">
              <p className="text-white text-sm">User {remoteUser.uid}</p>
            </div>
            
            {!remoteUser.hasAudio && (
              <div className="absolute top-2 right-2 bg-red-500 p-1 rounded">
                <VolumeX className="w-4 h-4 text-white" />
              </div>
            )}
          </div>
        ))}

        {/* Empty state - no users */}
        {remoteUsers.size === 0 && !localVideoTrack && !localAudioTrack && !showJoinOptions && (
          <div className="flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-white text-xl font-bold mb-2">Waiting for others to join</h3>
              <p className="text-gray-400">You're the first one here. Others will appear when they join.</p>
            </div>
          </div>
        )}
      </div>

      {/* Join Options Overlay */}
      {showJoinOptions && !isConnecting && (
        <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-20">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-md w-full mx-4">
            <div className="w-20 h-20 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-10 h-10 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white text-center mb-2">Join the Call</h2>
            <p className="text-gray-300 text-center mb-8">
              You can join now and enable your camera/microphone later
            </p>
            
            <div className="space-y-4">
              <button
                onClick={joinWithoutMedia}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-colors"
              >
                Join Now (Listen Only)
              </button>
              
              <div className="flex gap-4">
                <button
                  onClick={async () => {
                    setShowJoinOptions(false);
                    await enableAudio();
                  }}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  With Mic
                </button>
                
                <button
                  onClick={async () => {
                    setShowJoinOptions(false);
                    await enableVideo();
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg font-medium transition-colors"
                >
                  With Camera
                </button>
              </div>
              
              <button
                onClick={async () => {
                  setShowJoinOptions(false);
                  await enableAudio();
                  await enableVideo();
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-4 rounded-xl font-bold text-lg transition-colors"
              >
                Join with Camera & Mic
              </button>
            </div>
            
            <p className="text-gray-400 text-sm text-center mt-6">
              You can always enable your camera or microphone later during the call
            </p>
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 z-10 bg-black/80 p-4">
        <div className="flex items-center justify-center gap-3">
          {/* Audio toggle */}
          <button
            onClick={toggleAudio}
            className={`p-3 rounded-lg ${
              isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isAudioEnabled ? (
              <Mic className="w-5 h-5 text-white" />
            ) : (
              <MicOff className="w-5 h-5 text-white" />
            )}
          </button>
          
          {/* Video toggle */}
          <button
            onClick={toggleVideo}
            className={`p-3 rounded-lg ${
              isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-500 hover:bg-red-600'
            }`}
          >
            {isVideoEnabled ? (
              <Video className="w-5 h-5 text-white" />
            ) : (
              <VideoOff className="w-5 h-5 text-white" />
            )}
          </button>
          
          {/* Leave call */}
          <button
            onClick={leaveCall}
            className="p-3 bg-red-500 hover:bg-red-600 rounded-lg"
          >
            <PhoneOff className="w-5 h-5 text-white" />
          </button>
          
          {/* Screen share (only if video is enabled) */}
          {isVideoEnabled && (
            <button
              onClick={toggleScreenShare}
              className={`p-3 rounded-lg ${
                isScreenSharing ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
            >
              {isScreenSharing ? (
                <MonitorOff className="w-5 h-5 text-white" />
              ) : (
                <Monitor className="w-5 h-5 text-white" />
              )}
            </button>
          )}
          
          {/* Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-3 bg-gray-700 hover:bg-gray-600 rounded-lg"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-white" />
            ) : (
              <Maximize2 className="w-5 h-5 text-white" />
            )}
          </button>
        </div>
      </div>

      {/* Connecting State */}
      {isConnecting && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-white font-bold">Joining call...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-30">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md mx-4">
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <X className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Error</h3>
            <p className="text-gray-300 mb-6">{error}</p>
            <div className="flex gap-3">
              <button
                onClick={() => setError('')}
                className="flex-1 bg-gray-700 hover:bg-gray-600 text-white py-2 rounded-lg"
              >
                Continue
              </button>
              <button
                onClick={leaveCall}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg"
              >
                Leave
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;