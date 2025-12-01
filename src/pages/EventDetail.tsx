import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';
import { databaseService } from '../services/database';
import ChatRoom from '../components/ChatRoom';
import { MapPin, Calendar, Users, Clock, ArrowLeft, Share2, MessageCircle, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { format, isValid } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTranslation } from 'react-i18next';

// --- START: DATE FIX & HELPER ---
// Fixed helper to intelligently convert Firestore Timestamps, Strings, or JS Dates
const processDate = (date: any): Date | null => {
  if (!date) return null;

  // 1. Check if it's a Firestore Timestamp (has .toDate() method)
  if (typeof date.toDate === 'function') {
    return date.toDate();
  }

  // 2. Check if it's a raw object with seconds (common in serialized Firestore data)
  if (typeof date === 'object' && typeof date.seconds === 'number') {
    return new Date(date.seconds * 1000);
  }

  // 3. Check if it's already a JS Date object
  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }

  // 4. Try parsing string/number ONLY if it's a primitive type
  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date);
    return isValid(parsed) ? parsed : null;
  }

  // If we got here, it's an unrecognized format
  console.warn('Unrecognized date format:', date);
  return null;
};

// Safe date formatting with validation
const formatDateSafe = (date: any): string => {
  const dateObj = processDate(date);
  if (!dateObj) return 'N/A';
  return format(dateObj, 'MMMM dd, yyyy');
};

const formatTimeSafe = (date: any): string => {
  const dateObj = processDate(date);
  if (!dateObj) return 'N/A';
  return format(dateObj, 'HH:mm');
};
// --- END: DATE FIX & HELPER ---

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useTranslation();

  const [event, setEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  useEffect(() => {
    // Check if current user is already registered
    if (event && user) {
      const registered = event.registeredUsers?.includes(user.uid) || false;
      setIsRegistered(registered);
    }
  }, [event, user]);

  const loadEvent = async () => {
    try {
      setLoading(true);
      const eventData = await databaseService.getEvent(id!);
      setEvent(eventData);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!event || !user) {
      navigate('/login');
      return;
    }

    setRegistrationStatus('loading');
    try {
      await databaseService.registerForEvent(event.id, user.uid);
      setRegistrationStatus('success');
      setIsRegistered(true);
      // Reload event to update counts
      loadEvent();
    } catch (error: any) {
      console.error('Error registering for event:', error);
      setRegistrationStatus('error');
      alert(error.message || 'Failed to register for event');
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Event not found</h2>
          <button
            onClick={() => navigate('/events')}
            className="mt-4 text-primary-500 hover:text-primary-600 font-medium"
          >
            Return to Events
          </button>
        </div>
      </div>
    );
  }

  // --- DEBUGGING LOG ADDED HERE ---
  console.log('--- EventDetail Date Debug ---');
  console.log('Raw start_datetime:', event.start_datetime);
  console.log('Raw end_datetime:', event.end_datetime);
  console.log('Formatted Start Date:', formatDateSafe(event.start_datetime));
  console.log('--- End Date Debug ---');
  // ---------------------------------

  const isOwner = user?.uid === event.createdBy;
  const capacityReached = event.capacity ? (event.registeredUsers?.length || 0) >= event.capacity : false;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12">
      {/* Header Image Area */}
      <div className="relative h-64 md:h-96 w-full bg-gray-200 dark:bg-gray-800">
        {event.images && event.images.length > 0 ? (
          <img
            src={event.images[0]}
            alt={event.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-primary-500 to-purple-600">
            <Calendar className="w-20 h-20 text-white opacity-50" />
          </div>
        )}

        {/* Back Button */}
        <button
          onClick={() => navigate('/events')}
          className="absolute top-6 left-6 p-2 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-colors"
        >
          <ArrowLeft className="w-6 h-6 text-gray-900 dark:text-white" />
        </button>

        {/* Action Buttons */}
        <div className="absolute top-6 right-6 flex gap-2">
          {isOwner && (
            <button
              onClick={() => navigate(`/events/${event.id}/edit`)}
              className="px-4 py-2 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow-lg font-medium text-gray-900 dark:text-white hover:bg-white transition-colors"
            >
              Edit Event
            </button>
          )}
          <button className="p-2 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-lg hover:text-primary-500 transition-colors">
            <Share2 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row gap-8">
              {/* Left Column: Main Info */}
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-4">
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                      event.status === 'published'
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : event.status === 'draft'
                        ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}
                  >
                    {event.status.replace('_', ' ')}
                  </span>
                  {event.tags && event.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 rounded-full text-xs font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>

                <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {event.name}
                </h1>

                {event.subtitle && (
                  <p className="text-xl text-gray-600 dark:text-gray-400 mb-6">
                    {event.subtitle}
                  </p>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                      <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Date</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {/* Using the fixed formatDateSafe function */}
                        {formatDateSafe(event.start_datetime)}
                        {formatDateSafe(event.start_datetime) !== formatDateSafe(event.end_datetime) &&
                          ` - ${formatDateSafe(event.end_datetime)}`}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                      <Clock className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Time</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {/* Using the fixed formatTimeSafe function */}
                        {formatTimeSafe(event.start_datetime)} - {formatTimeSafe(event.end_datetime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                      <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Location</p>
                      <p className="text-gray-600 dark:text-gray-400">{event.location}</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                      <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">Capacity</p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {event.capacity ? (
                          <>
                            {event.registeredUsers?.length || 0} / {event.capacity} registered
                            {capacityReached && <span className="text-red-500 ml-2 text-sm">(Full)</span>}
                          </>
                        ) : (
                          'Unlimited capacity'
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Tabs Navigation */}
                <div className="border-b border-gray-200 dark:border-gray-700 mb-6">
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('details')}
                      className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                        activeTab === 'details'
                          ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                          : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Info className="w-4 h-4" />
                        About
                      </div>
                    </button>
                    {isRegistered && (
                      <button
                        onClick={() => setActiveTab('chat')}
                        className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                          activeTab === 'chat'
                            ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                            : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4" />
                          Discussion
                        </div>
                      </button>
                    )}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px]">
                  {activeTab === 'details' && (
                    <div className="prose dark:prose-invert max-w-none">
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">Description</h3>
                      <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line">
                        {event.description}
                      </p>
                    </div>
                  )}

                  {activeTab === 'chat' && isRegistered && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-[500px]">
                      <ChatRoom eventId={event.id} eventStatus={event.status} />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Registration Card */}
              <div className="w-full md:w-80 lg:w-96 shrink-0">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 sticky top-24">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Registration
                  </h3>

                  {isRegistered ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center mb-4">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-green-800 dark:text-green-200 font-medium">You are registered!</p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        See you at the event. Check the Discussion tab for updates.
                      </p>
                    </div>
                  ) : (
                    <>
                      {registrationStatus === 'error' && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          Something went wrong. Please try again.
                        </div>
                      )}

                      {capacityReached ? (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                          <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                          <p className="text-yellow-800 dark:text-yellow-200 font-medium">Event is Full</p>
                          <button className="mt-4 w-full py-2 px-4 border border-yellow-500 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-colors">
                            Join Waitlist
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={handleRegister}
                          disabled={registrationStatus === 'loading' || !event.allow_registration}
                          className={`w-full py-3 px-4 rounded-lg font-semibold text-lg transition-all transform active:scale-95 ${
                            !event.allow_registration
                              ? 'bg-gray-300 cursor-not-allowed text-gray-500'
                              : 'bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-primary-500/30'
                          }`}
                        >
                          {registrationStatus === 'loading' ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              Registering...
                            </div>
                          ) : !event.allow_registration ? (
                            'Registration Closed'
                          ) : (
                            'Register Now'
                          )}
                        </button>
                      )}

                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                        By registering, you agree to share your basic profile info with the organizers.
                      </p>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;