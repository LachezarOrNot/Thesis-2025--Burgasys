import React, { useEffect, useRef, useState } from 'react';
import {
  Users,
  X,
  Link as LinkIcon,
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

// MiroTalk SFU - free, unlimited, no login, no API key. Uses public instance at sfu.mirotalk.com
const MIROTALK_DOMAIN = 'sfu.mirotalk.com';

const VideoCall: React.FC<VideoCallProps> = ({
  eventId,
  onClose,
  userName = 'Guest',
  isMinimized = false,
  onToggleMinimize
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [showCameraWarning, setShowCameraWarning] = useState(false);

  const roomName = `eventbeta-${eventId.replace(/[^a-z0-9]/gi, '-').replace(/-+/g, '-').replace(/^-|-$/g, '').toLowerCase()}`.slice(0, 128) || `eventbeta-${Date.now()}`;

  const joinUrl = `https://${MIROTALK_DOMAIN}/join?room=${encodeURIComponent(roomName)}&name=${encodeURIComponent(userName)}&audio=1&video=0&chat=1&duration=unlimited`;

  useEffect(() => {
    const iframe = containerRef.current?.querySelector('iframe');
    if (iframe) {
      const onLoad = () => {
        setIsLoading(false);
        setShowCameraWarning(true);
        setTimeout(() => setShowCameraWarning(false), 5000);
      };
      iframe.addEventListener('load', onLoad);
      return () => iframe.removeEventListener('load', onLoad);
    }
  }, [joinUrl]);

  const leaveCall = () => {
    onClose();
  };

  const copyInviteLink = async () => {
    try {
      await navigator.clipboard.writeText(joinUrl);
      alert('Link copied!');
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
      setShowCameraWarning(true);
      setTimeout(() => setShowCameraWarning(false), 5000);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // Minimized view
  if (isMinimized && onToggleMinimize) {
    return (
      <div className="fixed bottom-4 right-4 z-50 w-80 h-60 bg-black rounded-2xl shadow-2xl overflow-hidden border-2 border-white/20">
        <iframe
          src={joinUrl}
          allow="camera; microphone; display-capture; fullscreen; autoplay"
          className="w-full h-full border-0"
          title="Video call"
        />
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
      </div>
    );
  }

  // Full screen view
  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/80 to-transparent p-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            <span className="text-white font-semibold text-sm md:text-base">Live Call</span>
            <div className="flex items-center gap-1.5 bg-white/10 px-2.5 py-1 rounded-full backdrop-blur-sm">
              <Users className="w-3.5 h-3.5 text-white" />
              <span className="text-white text-xs font-medium">MiroTalk</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyInviteLink}
              className="hidden md:flex items-center gap-1.5 bg-blue-500/80 hover:bg-blue-500 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full transition-all"
            >
              <LinkIcon className="w-3 h-3" />
              <span>Copy Link</span>
            </button>
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

      {showCameraWarning && !isLoading && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 max-w-md mx-4 bg-yellow-500/90 backdrop-blur-sm text-yellow-900 px-4 py-3 rounded-lg shadow-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-semibold text-sm">Camera is off</p>
            <p className="text-xs mt-1">Click the camera icon in the call to enable video. Audio-only mode is active.</p>
          </div>
          <button
            onClick={() => setShowCameraWarning(false)}
            className="ml-auto text-yellow-900 hover:text-yellow-950"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div ref={containerRef} className="w-full h-full">
        <iframe
          src={joinUrl}
          allow="camera; microphone; speaker-selection; display-capture; fullscreen; clipboard-read; clipboard-write; autoplay; picture-in-picture"
          className="w-full h-full border-0"
          title="Video call"
        />
      </div>

      {isLoading && (
        <div className="absolute inset-0 bg-black flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-12 h-12 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <h2 className="text-white text-lg mb-2">Connecting...</h2>
            <p className="text-gray-400 text-sm">Joining the call</p>
            <p className="text-gray-500 text-xs mt-2">No login required</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
