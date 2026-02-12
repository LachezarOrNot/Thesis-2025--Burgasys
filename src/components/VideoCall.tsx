import React, { useEffect, useRef, useState } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Users,
  X,
  Copy,
  Link,
  Camera,
  WifiOff
} from 'lucide-react';

interface VideoCallProps {
  eventId: string;
  onClose: () => void;
  userName?: string;
}

declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

// -----------------------------------------------------------
// CONFIGURATION
// -----------------------------------------------------------
// 'meet.jit.si' now requires login. We use a community instance
// that allows anonymous room creation.
// Options: 'meet.guifi.net', 'jitsi.riot.im', 'meet.golem.de'
const JITSI_DOMAIN = 'meet.guifi.net';
// -----------------------------------------------------------

const VideoCall: React.FC<VideoCallProps> = ({ 
  eventId, 
  onClose, 
  userName = 'Guest'
}) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [participantCount, setParticipantCount] = useState(1);
  const [inviteLink, setInviteLink] = useState('');
  const [connectionState, setConnectionState] = useState('Connecting...');

  // Generate a clean, unique room name
  const roomName = `eventbeta-${eventId.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;

  useEffect(() => {
    let mounted = true;
    let scriptLoadTimeout: NodeJS.Timeout;

    const loadJitsiScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        const existingScript = document.querySelector(`script[src*="${JITSI_DOMAIN}/external_api.js"]`);
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Failed to load Jitsi script')));
          return;
        }

        const script = document.createElement('script');
        // Load the script from the specific domain we are using to ensure compatibility
        script.src = `https://${JITSI_DOMAIN}/external_api.js`;
        script.async = true;
        
        script.onload = () => {
          if (window.JitsiMeetExternalAPI) {
            resolve();
          } else {
            reject(new Error('Jitsi API not available after script load'));
          }
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Jitsi script from CDN'));
        };
        
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
          lang: 'en',
          
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            enableClosePage: false,
            // These flags help bypass moderation screens on some instances
            requireDisplayName: false,
            enableLobby: false, 
            
            // Resolution settings for better performance
            resolution: 720,
            constraints: {
              video: {
                height: { ideal: 720, max: 1080, min: 240 },
                width: { ideal: 1280, max: 1920, min: 320 }
              }
            },
          },

          interfaceConfigOverwrite: {
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats',
              'shortcuts', 'tileview', 'videobackgroundblur', 'download', 'help',
              'mute-everyone'
            ],
          },
          
          userInfo: {
            displayName: userName,
          }
        };

        // Initialize the API
        // @ts-ignore
        const api = new window.JitsiMeetExternalAPI(JITSI_DOMAIN, options);
        apiRef.current = api;

        const shareableLink = `https://${JITSI_DOMAIN}/${roomName}`;
        if (mounted) {
          setInviteLink(shareableLink);
        }

        // Event Listeners
        api.on('videoConferenceJoined', () => {
          if (!mounted) return;
          setIsLoading(false);
          setHasError(false);
          setConnectionState('Connected');
        });

        api.on('videoConferenceLeft', () => {
          if (!mounted) return;
          onClose();
        });

        api.on('participantJoined', () => {
          if (!mounted) return;
          setParticipantCount(prev => prev + 1);
        });

        api.on('participantLeft', () => {
          if (!mounted) return;
          setParticipantCount(prev => Math.max(1, prev - 1));
        });

        api.on('readyToClose', () => {
          if (!mounted) return;
          onClose();
        });

        // Safety timeout
        scriptLoadTimeout = setTimeout(() => {
          if (mounted && isLoading) {
            setIsLoading(false);
            setConnectionState('Connected');
          }
        }, 10000);

      } catch (error: any) {
        console.error('Failed to initialize Jitsi:', error);
        if (mounted) {
          setErrorMessage(error.message || 'Failed to initialize video call');
          setHasError(true);
          setIsLoading(false);
          setConnectionState('Failed');
        }
      }
    };

    initializeJitsi();

    return () => {
      mounted = false;
      clearTimeout(scriptLoadTimeout);
      if (apiRef.current) {
        apiRef.current.dispose();
        apiRef.current = null;
      }
    };
  }, [eventId, userName, roomName, onClose]);

  const leaveCall = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('hangup');
    } else {
      onClose();
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      alert('Link copied!');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-gray-900">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-white font-bold text-lg">Live Call</span>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white text-sm">{participantCount}</span>
            </div>
            {inviteLink && (
              <button 
                onClick={copyInviteLink} 
                className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1 rounded-lg transition-colors"
              >
                <Link className="w-3 h-3" /> Copy Link
              </button>
            )}
          </div>
          <button
            onClick={leaveCall}
            className="p-2 bg-red-600 hover:bg-red-700 rounded-lg text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Jitsi Container */}
      <div ref={jitsiContainerRef} className="w-full h-full" />

      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-white text-xl">Connecting...</h2>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-30">
          <div className="bg-gray-800 p-8 rounded-xl max-w-md text-center border border-red-500/30">
            <WifiOff className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-white font-bold text-xl mb-2">Connection Failed</h3>
            <p className="text-gray-400 mb-6">{errorMessage}</p>
            <button onClick={onClose} className="bg-white/10 hover:bg-white/20 text-white px-6 py-2 rounded-lg">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;