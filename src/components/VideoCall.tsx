import React, { useEffect, useRef, useState } from 'react';
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
  X,
  WifiOff,
  Copy,
  Link
} from 'lucide-react';

interface VideoCallProps {
  eventId: string;
  onClose: () => void;
  userName?: string;
}

// Declare Jitsi types
declare global {
  interface Window {
    JitsiMeetExternalAPI: any;
  }
}

const VideoCall: React.FC<VideoCallProps> = ({ 
  eventId, 
  onClose, 
  userName = 'Guest'
}) => {
  const jitsiContainerRef = useRef<HTMLDivElement>(null);
  const apiRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  const [isAudioMuted, setIsAudioMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const initializingRef = useRef(false);

  // Generate a clean room name
  const roomName = `eventbeta-${eventId.replace(/[^a-z0-9]/gi, '-').toLowerCase()}-${Date.now().toString(36)}`;

  useEffect(() => {
    let mounted = true;
    let loadTimeout: NodeJS.Timeout;

    const loadJitsiScript = (): Promise<void> => {
      return new Promise((resolve, reject) => {
        // Check if script already exists
        if (window.JitsiMeetExternalAPI) {
          resolve();
          return;
        }

        // Check if script is already being loaded
        const existingScript = document.querySelector('script[src*="external_api.js"]');
        if (existingScript) {
          existingScript.addEventListener('load', () => resolve());
          existingScript.addEventListener('error', () => reject(new Error('Script load failed')));
          return;
        }

        const script = document.createElement('script');
        script.src = 'https://meet.jit.si/external_api.js';
        script.async = true;
        
        script.onload = () => {
          if (window.JitsiMeetExternalAPI) {
            resolve();
          } else {
            reject(new Error('JitsiMeetExternalAPI not available after script load'));
          }
        };
        
        script.onerror = () => {
          reject(new Error('Failed to load Jitsi script'));
        };
        
        document.head.appendChild(script);
      });
    };

    const createJitsiMeeting = async () => {
      if (!mounted || !jitsiContainerRef.current || initializingRef.current) {
        return;
      }

      initializingRef.current = true;

      try {
        // Clear container
        if (jitsiContainerRef.current) {
          jitsiContainerRef.current.innerHTML = '';
        }

        const domain = 'meet.jit.si';
        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: jitsiContainerRef.current,
          configOverwrite: {
            startWithAudioMuted: false,
            startWithVideoMuted: false,
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            enableWelcomePage: false,
            enableClosePage: false,
            disableInviteFunctions: false,
            hideConferenceSubject: false,
            resolution: 720,
            constraints: {
              video: {
                height: {
                  ideal: 720,
                  max: 1080,
                  min: 240
                }
              }
            }
          },
          interfaceConfigOverwrite: {
            DISABLE_JOIN_LEAVE_NOTIFICATIONS: false,
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            SHOW_BRAND_WATERMARK: false,
            SHOW_POWERED_BY: false,
            APP_NAME: 'EventBeta',
            NATIVE_APP_NAME: 'EventBeta',
            PROVIDER_NAME: 'EventBeta',
            MOBILE_APP_PROMO: false
          },
          userInfo: {
            displayName: userName
          }
        };

        const api = new window.JitsiMeetExternalAPI(domain, options);
        apiRef.current = api;
        
        if (mounted) {
          setInviteLink(`https://meet.jit.si/${roomName}`);
        }

        // Set loading timeout
        loadTimeout = setTimeout(() => {
          if (mounted && isLoading) {
            setIsLoading(false);
          }
        }, 5000);

        // Event listeners
        api.addEventListeners({
          readyToClose: () => {
            if (mounted) {
              console.log('Ready to close');
              onClose();
            }
          },
          participantJoined: (participant: any) => {
            if (mounted) {
              console.log('Participant joined:', participant);
              setParticipantCount(prev => prev + 1);
            }
          },
          participantLeft: (participant: any) => {
            if (mounted) {
              console.log('Participant left:', participant);
              setParticipantCount(prev => Math.max(1, prev - 1));
            }
          },
          audioMuteStatusChanged: (data: any) => {
            if (mounted) {
              setIsAudioMuted(data.muted);
            }
          },
          videoMuteStatusChanged: (data: any) => {
            if (mounted) {
              setIsVideoMuted(data.muted);
            }
          },
          screenSharingStatusChanged: (data: any) => {
            if (mounted) {
              setIsScreenSharing(data.on);
            }
          },
          videoConferenceJoined: (data: any) => {
            if (mounted) {
              console.log('Video conference joined:', data);
              setIsLoading(false);
              setHasError(false);
              clearTimeout(loadTimeout);
            }
          },
          videoConferenceLeft: () => {
            if (mounted) {
              console.log('Video conference left');
              onClose();
            }
          },
          errorOccurred: (error: any) => {
            if (mounted) {
              console.error('Jitsi error:', error);
              setErrorMessage(error?.message || 'Unknown error occurred');
              setHasError(true);
              setIsLoading(false);
            }
          }
        });

        // Get initial participant count after a delay
        setTimeout(() => {
          if (mounted && api) {
            api.getNumberOfParticipants().then((count: number) => {
              if (mounted) {
                setParticipantCount(count > 0 ? count : 1);
              }
            }).catch((err: any) => {
              console.error('Error getting participant count:', err);
            });
          }
        }, 2000);

      } catch (error: any) {
        console.error('Failed to create Jitsi meeting:', error);
        if (mounted) {
          setErrorMessage(error?.message || 'Failed to initialize video call');
          setHasError(true);
          setIsLoading(false);
        }
      } finally {
        initializingRef.current = false;
      }
    };

    const initializeJitsi = async () => {
      if (!mounted) return;

      setIsLoading(true);
      setHasError(false);
      setErrorMessage('');

      try {
        await loadJitsiScript();
        if (mounted) {
          await createJitsiMeeting();
        }
      } catch (error: any) {
        console.error('Jitsi initialization error:', error);
        if (mounted) {
          setErrorMessage(error?.message || 'Failed to load video call');
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
        } catch (err) {
          console.error('Error disposing Jitsi API:', err);
        }
        apiRef.current = null;
      }
    };
  }, [eventId, userName, roomName, onClose]);

  const toggleAudio = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleAudio');
    }
  };

  const toggleVideo = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleVideo');
    }
  };

  const toggleScreenShare = () => {
    if (apiRef.current) {
      apiRef.current.executeCommand('toggleShareScreen');
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      jitsiContainerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const leaveCall = () => {
    if (apiRef.current) {
      try {
        apiRef.current.executeCommand('hangup');
        setTimeout(() => {
          if (apiRef.current) {
            apiRef.current.dispose();
            apiRef.current = null;
          }
          onClose();
        }, 100);
      } catch (err) {
        console.error('Error leaving call:', err);
        onClose();
      }
    } else {
      onClose();
    }
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(inviteLink);
      // Could add a toast notification here instead of alert
      const button = document.activeElement as HTMLButtonElement;
      const originalText = button?.textContent;
      if (button) {
        button.textContent = '✓ Copied!';
        setTimeout(() => {
          if (button.textContent === '✓ Copied!') {
            button.textContent = originalText;
          }
        }, 2000);
      }
    } catch (err) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = inviteLink;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      document.body.appendChild(textArea);
      textArea.select();
      try {
        document.execCommand('copy');
        alert('Invite link copied!');
      } catch (e) {
        alert('Failed to copy link');
      }
      document.body.removeChild(textArea);
    }
  };

  const openInviteLink = () => {
    window.open(inviteLink, '_blank', 'noopener,noreferrer');
  };

  const retryConnection = () => {
    setHasError(false);
    setIsLoading(true);
    setErrorMessage('');
    
    if (apiRef.current) {
      try {
        apiRef.current.dispose();
      } catch (err) {
        console.error('Error disposing API during retry:', err);
      }
      apiRef.current = null;
    }
    
    // Force re-render to trigger useEffect
    window.location.reload();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/95 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-white font-bold">Live Call</span>
            </div>
            <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg backdrop-blur-sm">
              <Users className="w-4 h-4 text-white" />
              <span className="text-white">{participantCount}</span>
            </div>
            {inviteLink && !isLoading && (
              <div className="flex items-center gap-2">
                <button
                  onClick={copyInviteLink}
                  className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
                  title="Copy invite link"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copy Link
                </button>
                <button
                  onClick={openInviteLink}
                  className="text-sm bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 font-medium"
                  title="Open invite link in new tab"
                >
                  <Link className="w-3.5 h-3.5" />
                  Share
                </button>
              </div>
            )}
          </div>
          
          <button
            onClick={leaveCall}
            className="p-2 bg-red-500 hover:bg-red-600 rounded-lg transition-all hover:scale-105"
            title="Close"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>
      </div>

      {/* Jitsi Container */}
      <div 
        ref={jitsiContainerRef} 
        className="w-full h-full"
        style={{ paddingTop: '72px', paddingBottom: '96px' }}
      />

      {/* Custom Controls Overlay */}
      {!isLoading && !hasError && (
        <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 to-transparent p-6">
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {/* Audio toggle */}
            <button
              onClick={toggleAudio}
              className={`p-4 rounded-full transition-all hover:scale-105 ${
                !isAudioMuted 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-red-500 hover:bg-red-600'
              }`}
              title={isAudioMuted ? 'Unmute' : 'Mute'}
            >
              {!isAudioMuted ? (
                <Mic className="w-6 h-6 text-white" />
              ) : (
                <MicOff className="w-6 h-6 text-white" />
              )}
            </button>
            
            {/* Video toggle */}
            <button
              onClick={toggleVideo}
              className={`p-4 rounded-full transition-all hover:scale-105 ${
                !isVideoMuted 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-red-500 hover:bg-red-600'
              }`}
              title={isVideoMuted ? 'Start Video' : 'Stop Video'}
            >
              {!isVideoMuted ? (
                <Video className="w-6 h-6 text-white" />
              ) : (
                <VideoOff className="w-6 h-6 text-white" />
              )}
            </button>
            
            {/* Leave call */}
            <button
              onClick={leaveCall}
              className="p-5 bg-red-500 hover:bg-red-600 rounded-full transition-all hover:scale-105 shadow-lg"
              title="Leave Call"
            >
              <PhoneOff className="w-6 h-6 text-white" />
            </button>
            
            {/* Screen share */}
            <button
              onClick={toggleScreenShare}
              className={`p-4 rounded-full transition-all hover:scale-105 ${
                isScreenSharing 
                  ? 'bg-blue-500 hover:bg-blue-600' 
                  : 'bg-gray-700 hover:bg-gray-600'
              }`}
              title={isScreenSharing ? 'Stop Sharing' : 'Share Screen'}
            >
              {isScreenSharing ? (
                <MonitorOff className="w-6 h-6 text-white" />
              ) : (
                <Monitor className="w-6 h-6 text-white" />
              )}
            </button>
            
            {/* Fullscreen */}
            <button
              onClick={toggleFullscreen}
              className="p-4 bg-gray-700 hover:bg-gray-600 rounded-full transition-all hover:scale-105"
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
            >
              {isFullscreen ? (
                <Minimize2 className="w-6 h-6 text-white" />
              ) : (
                <Maximize2 className="w-6 h-6 text-white" />
              )}
            </button>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-30">
          <div className="text-center max-w-md mx-4">
            <div className="w-20 h-20 border-4 border-white/20 border-t-white rounded-full animate-spin mx-auto mb-6"></div>
            <h2 className="text-white font-bold text-2xl mb-2">Starting Video Call</h2>
            <p className="text-gray-400 text-sm mb-6">Please allow camera and microphone access</p>
            <div className="bg-gray-900/50 rounded-lg p-4 mb-4 text-left">
              <p className="text-gray-300 text-sm mb-2">Connecting to room:</p>
              <p className="text-gray-500 text-xs font-mono break-all">{roomName}</p>
            </div>
            <p className="text-gray-500 text-xs">Powered by Jitsi Meet</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {hasError && (
        <div className="absolute inset-0 bg-black/95 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="bg-gray-900 rounded-2xl p-8 max-w-lg w-full border border-gray-800 shadow-2xl">
            <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <WifiOff className="w-8 h-8 text-red-500" />
            </div>
            <h3 className="text-white font-bold text-2xl mb-3 text-center">Connection Error</h3>
            <p className="text-gray-300 mb-6 text-center">
              Unable to start the video call. Please check the following:
            </p>
            
            {errorMessage && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 mb-6">
                <p className="text-red-400 text-sm font-mono">{errorMessage}</p>
              </div>
            )}
            
            <div className="bg-gray-800/70 rounded-xl p-5 mb-8 space-y-3">
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl">•</span>
                <span className="text-gray-300 text-sm">Camera and microphone permissions are allowed</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl">•</span>
                <span className="text-gray-300 text-sm">Your network firewall isn't blocking WebRTC</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl">•</span>
                <span className="text-gray-300 text-sm">Ad blockers or privacy extensions are disabled</span>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-red-400 text-xl">•</span>
                <span className="text-gray-300 text-sm">Your browser supports WebRTC (Chrome, Firefox, Safari, Edge)</span>
              </div>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={retryConnection}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3.5 rounded-xl font-semibold transition-all hover:scale-[1.02]"
              >
                Try Again
              </button>
              <button
                onClick={() => window.open(`https://meet.jit.si/${roomName}`, '_blank')}
                className="w-full bg-gray-700 hover:bg-gray-600 text-white py-3.5 rounded-xl font-semibold transition-all hover:scale-[1.02]"
              >
                Open in Jitsi Directly
              </button>
              <button
                onClick={leaveCall}
                className="w-full bg-red-500/20 hover:bg-red-500/30 border border-red-500/50 text-red-400 py-3.5 rounded-xl font-semibold transition-all"
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