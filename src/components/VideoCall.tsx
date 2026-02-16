import React, { useEffect, useRef, useState } from 'react';
import {
  Users,
  X,
  Link as LinkIcon,
  WifiOff,
  Maximize2,
  Minimize2,
  AlertCircle
} from 'lucide-react';

interface VideoCallProps {
  eventId: string;
  onClose: () => void;
  userName?: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const JITSI_DOMAIN = 'meet.jit.si';

const VideoCall: React.FC<VideoCallProps> = ({ 
  eventId, 
  onClose, 
  userName = 'Guest',
  isMinimized = false,
  onToggleMinimize
}) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const [inviteLink, setInviteLink] = useState('');
  const [showCameraWarning, setShowCameraWarning] = useState(false);

  const roomName = `eventbeta-${eventId.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;

  useEffect(() => {
    let mounted = true;
    let loadTimeout: NodeJS.Timeout;

    const loadJitsiScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const existingScript = document.querySelector('script[src*="external_api.js"]');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Failed to load')));
          return;
        }

        const script = document.createElement('script');
        script.src = `https://${JITSI_DOMAIN}/external_api.js`;
        script.async = true;
        
        script.onload = () => {
          if (window.JitsiMeetExternalAPI) {
            resolve();
          } else {
            reject(new Error('API not available'));
          }
        };
        
        script.onerror = () => reject(new Error('Failed to load script'));
        document.head.appendChild(script);
      });
    };

    const initializeJitsi = async () => {
      if (!mounted) return;

      try {
        await loadJitsiScript();

        if (!mounted || !jitsiContainerRef.current) return;

        jitsiContainerRef.current.innerHTML = '';

        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          
          configOverwrite: {
            // Start with video OFF by default to avoid camera errors
            startWithAudioMuted: false,
            startWithVideoMuted: true, // User can enable manually
            
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            enableClosePage: false,
            
            // Disable all moderation
            disableModeratorIndicator: true,
            disableRemoteMute: true,
            enableLobby: false,
            
            // Allow continuing even without devices
            requireDisplayName: false,
            
            // More permissive constraints
            constraints: {
              video: {
                height: { ideal: 360, max: 720, min: 180 },
                width: { ideal: 640, max: 1280, min: 320 }
              }
            },
            
            // P2P settings for better connectivity
            p2p: {
              enabled: true,
              stunServers: [
                { urls: 'stun:meet-jit-si-turnrelay.jitsi.net:443' }
              ]
            },
          },

          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            MOBILE_APP_PROMO: false,
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            
            TOOLBAR_BUTTONS: [
              'microphone', 
              'camera', 
              'desktop', 
              'fullscreen',
              'hangup', 
              'chat', 
              'settings', 
              'raisehand',
              'videoquality', 
              'filmstrip', 
              'tileview'
            ],
          },
          
          userInfo: {
            displayName: userName,
          }
        };

        console.log('Initializing Jitsi with room:', roomName);
        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, options);
        apiRef.current = api;

        const shareableLink = `https://${JITSI_DOMAIN}/${roomName}`;
        if (mounted) {
          setInviteLink(shareableLink);
        }

        // Event listeners
        api.on('videoConferenceJoined', (event: any) => {
          if (!mounted) return;
          console.log('Successfully joined conference:', event);
          setIsLoading(false);
          setHasError(false);
          
          // Show camera warning if starting with video off
          setShowCameraWarning(true);
          setTimeout(() => setShowCameraWarning(false), 5000);
        });

        api.on('videoConferenceLeft', () => {
          if (!mounted) return;
          console.log('Left conference');
          onClose();
        });

        api.on('participantJoined', (participant: any) => {
          if (!mounted) return;
          console.log('Participant joined:', participant);
          setParticipantCount(prev => prev + 1);
        });

        api.on('participantLeft', (participant: any) => {
          if (!mounted) return;
          console.log('Participant left:', participant);
          setParticipantCount(prev => Math.max(1, prev - 1));
        });

        api.on('readyToClose', () => {
          if (!mounted) return;
          console.log('Ready to close');
          onClose();
        });

        api.on('errorOccurred', (error: any) => {
          console.error('Jitsi error occurred:', error);
          // Don't fail the whole call for device errors
          if (error.name !== 'gum.not_found') {
            if (mounted && error.isFatal) {
              setErrorMessage(error.message || 'Connection error');
              setHasError(true);
              setIsLoading(false);
            }
          }
        });

        // Safety timeout - assume success if loading too long
        loadTimeout = setTimeout(() => {
          if (mounted && isLoading) {
            console.log('Load timeout - assuming success');
            setIsLoading(false);
            setShowCameraWarning(true);
            setTimeout(() => setShowCameraWarning(false), 5000);
          }
        }, 8000);

      } catch (error: any) {
        console.error('Failed to initialize Jitsi:', error);
        if (mounted) {
          setErrorMessage(error.message || 'Failed to connect');
          setHasError(true);
          setIsLoading(false);
        }
      }
    };

    initializeJitsi();

    return () => {
      mounted = false;
      clearTimeout(loadTimeout);
      if (apiRef.current) {
        try {
          apiRef.current.dispose();
        } catch (e) {
          console.error('Error disposing Jitsi:', e);
        }
        apiRef.current = null;
      }
    };
  }, [eventId, userName, roomName, onClose, isLoading]);

  const leaveCall = () => {
    if (apiRef.current) {
      try {
        apiRef.current.executeCommand('hangup');
      } catch (e) {
        console.error('Error hanging up:', e);
      }
    }
    onClose();
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert('Link copied!');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // Minimized view
  if (isMinimized && onToggleMinimize) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 h-60 bg-black rounded-2xl shadow-2xl overflow-hidden border-2 border-white/20">
        <div ref={jitsiContainerRef} className="w-full h-full" />
        <div className="absolute top-2 right-2 flex gap-2">
          <button
            onClick={onToggleMinimize}
            className="p-2 bg-black/50 hover:bg-black/70 backdrop-blur-sm rounded-full transition-all"
          >
            <Maximize2 className="w-4 h-4 text-white" />
          </button>
          <button
            onClick={leaveCall}
            className="p-2 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm rounded-full transition-all"
          >
            <X className="w-4 h-4 text-white" />
          </button>
        </div>
        <div className="absolute bottom-2 left-2 bg-black/70 backdrop-blur-sm px-3 py-1 rounded-full">
          <span className="text-white text-xs font-medium flex items-center gap-1">
            <Users className="w-3 h-3" />
            {participantCount}
          </span>
        </div>
      </div>
    );
  }

  // Full screen view
  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white font-semibold text-sm md:text-base">Live Call</span>
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <Users className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-medium">{participantCount}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {inviteLink && !isLoading && (
              <button 
                onClick={copyInviteLink} 
                className="hidden md:flex items-center gap-1.5 bg-blue-500/80 hover:bg-blue-500 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full transition-all"
              >
                <LinkIcon className="w-3 h-3" />
                <span>Copy Link</span>
              </button>
            )}
            {onToggleMinimize && (
              <button
                onClick={onToggleMinimize}
                className="p-2 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full transition-all"
              >
                <Minimize2 className="w-4 h-4 text-white" />
              </button>
            )}
            <button
              onClick={leaveCall}
              className="p-2 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm rounded-full transition-all"
            >
              <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
            </button>
          </div>
        </div>
      </div>

      {/* Camera Warning Banner */}
      {showCameraWarning && !isLoading && !hasError && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 max-w-md mx-4 bg-yellow-500/90 backdrop-blur-sm text-yellow-900 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3 animate-in slide-in-from-top">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Camera is off</p>
            <p className="text-xs mt-1">Click the camera icon to enable video. Audio-only mode is active.</p>
          </div>
          <button 
            onClick={() => setShowCameraWarning(false)}
            className="ml-auto text-yellow-900 hover:text-yellow-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Jitsi Container */}
      <div ref={jitsiContainerRef} className="w-full h-full" />

      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-white text-lg mb-2">Connecting...</h2>
            <p className="text-gray-400 text-sm">Setting up your call</p>
            <p className="text-gray-500 text-xs mt-2">Camera will be off by default</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-30 p-4">
          <div className="bg-gray-900 p-6 rounded-2xl max-w-sm w-full text-center border border-red-500/30">
            <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-2">Connection Failed</h3>
            <p className="text-gray-400 text-sm mb-4">{errorMessage}</p>
            <div className="space-y-2">
              <button 
                onClick={() => window.location.reload()} 
                className="w-full bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-full text-sm font-medium"
              >
                Try Again
              </button>
              <button 
                onClick={onClose} 
                className="w-full bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-full text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;