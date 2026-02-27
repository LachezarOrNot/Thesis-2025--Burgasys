import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';
import { databaseService } from '../services/database';
import ChatRoom from '../components/ChatRoom';
import { MapPin, Calendar, Users, Clock, ArrowLeft, Share2, MessageCircle, Info, CheckCircle, AlertCircle, Edit, Globe, Navigation } from 'lucide-react';
import { format, isValid } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import EventMap from '../components/EventMap';
import ToastNotification from '../components/ToastNotification';

// --- START: DATE FIX & HELPER ---
const processDate = (date: any): Date | null => {
  if (!date) return null;

  if (typeof date.toDate === 'function') {
    return date.toDate();
  }

  if (typeof date === 'object' && typeof date.seconds === 'number') {
    return new Date(date.seconds * 1000);
  }

  if (date instanceof Date) {
    return isValid(date) ? date : null;
  }

  if (typeof date === 'string' || typeof date === 'number') {
    const parsed = new Date(date);
    return isValid(parsed) ? parsed : null;
  }

  console.warn('Unrecognized date format:', date);
  return null;
};

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
  const location = useLocation() as { state?: any };

  const [event, setEvent] = useState<Event | null>(null);
  const [organizerName, setOrganizerName] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [isRegistered, setIsRegistered] = useState(false);

  const [toastMessage, setToastMessage] = useState('');
  const [showToast, setShowToast] = useState(false);

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

  useEffect(() => {
    if (location.state?.toast?.message) {
      setToastMessage(location.state.toast.message);
      setShowToast(true);
    }
  }, [location.state]);

  useEffect(() => {
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

      // Load organizer name if organization is linked
      if (eventData?.organiser_org_id) {
        try {
          const org = await databaseService.getOrganization(eventData.organiser_org_id);
          setOrganizerName(org?.name || null);
        } catch (orgError) {
          console.error('Error loading organizer:', orgError);
          setOrganizerName(null);
        }
      } else {
        setOrganizerName(null);
      }
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
      loadEvent();
    } catch (error: any) {
      console.error('Error registering for event:', error);
      setRegistrationStatus('error');
      alert(error.message || 'Failed to register for event');
    }
  };

  const handleShare = async () => {
    if (!event) return;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: event.name,
          text: event.description,
          url: window.location.href,
        });
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Link copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const getDirections = () => {
    if (!event || !event.lat || !event.lng) return;
    
    const url = `https://www.google.com/maps/dir/?api=1&destination=${event.lat},${event.lng}&destination_place_id=${encodeURIComponent(event.location)}`;
    window.open(url, '_blank');
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('eventDetail.eventNotFound')}
          </h2>
          <button
            onClick={() => navigate('/events')}
            className="mt-4 text-primary-500 hover:text-primary-600 font-medium"
          >
            {t('eventDetail.backToEvents')}
          </button>
        </div>
      </div>
    );
  }

  const isOwner = user?.uid === event.createdBy;
  const capacityReached = event.capacity ? (event.registeredUsers?.length || 0) >= event.capacity : false;
  const hasValidLocation = event.lat && event.lng && event.lat !== 0 && event.lng !== 0;
  const eventEndDate = processDate(event.end_datetime);
  const isPastEvent = event.status === 'finished' || (eventEndDate !== null && eventEndDate < new Date());

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-12 relative">
      <ToastNotification
        message={toastMessage}
        type="success"
        visible={showToast}
        onClose={() => setShowToast(false)}
      />
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
              className="px-4 py-2 bg-white/90 dark:bg-gray-900/90 rounded-lg shadow-lg font-medium text-gray-900 dark:text-white hover:bg-white transition-colors flex items-center gap-2"
            >
              <Edit className="w-4 h-4" />
              Edit Event
            </button>
          )}
          <button 
            onClick={handleShare}
            className="p-2 bg-white/90 dark:bg-gray-900/90 rounded-full shadow-lg hover:text-primary-500 transition-colors"
          >
            <Share2 className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Event Title Overlay */}
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                  event.status === 'published'
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : event.status === 'draft'
                    ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                    : event.status === 'pending_approval'
                    ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    : event.status === 'finished'
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                }`}
              >
                {event.status.replace('_', ' ')}
              </span>
              {event.tags?.slice(0, 2).map(tag => (
                <span
                  key={tag}
                  className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 rounded-full text-xs font-medium"
                >
                  {tag}
                </span>
              ))}
              {event.tags && event.tags.length > 2 && (
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 rounded-full text-xs font-medium">
                  +{event.tags.length - 2} more
                </span>
              )}
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
              {event.name}
            </h1>
            {event.subtitle && (
              <p className="text-xl text-gray-200">
                {event.subtitle}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 relative z-10">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-col lg:flex-row gap-8">
              {/* Left Column: Main Info */}
              <div className="flex-1">
                {/* Event Details Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                      <Calendar className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {t('eventDetail.date')}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {formatDateSafe(event.start_datetime)}
                        {formatDateSafe(event.start_datetime) !== formatDateSafe(event.end_datetime) &&
                          ` - ${formatDateSafe(event.end_datetime)}`}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {formatTimeSafe(event.start_datetime)} - {formatTimeSafe(event.end_datetime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                      <MapPin className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {t('eventDetail.location')}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">{event.location}</p>
                      
                      {hasValidLocation && (
                        <button
                          onClick={getDirections}
                          className="mt-2 text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
                        >
                          <Navigation className="w-4 h-4" />
                          {t('eventDetail.getDirections', 'Get Directions')}
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                      <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {t('eventDetail.capacity', 'Capacity')}
                      </p>
                      <p className="text-gray-600 dark:text-gray-400">
                        {event.capacity ? (
                          <>
                            {event.registeredUsers?.length || 0} / {event.capacity}{' '}
                            {t('eventDetail.capacityRegistered', 'registered')}
                            {capacityReached && (
                              <span className="text-red-500 ml-2 text-sm">
                                ({t('eventDetail.full', 'Full')})
                              </span>
                            )}
                          </>
                        ) : (
                          t('eventDetail.unlimitedCapacity', 'Unlimited capacity')
                        )}
                      </p>
                      {event.allow_registration === false && (
                        <p className="text-sm text-red-500 dark:text-red-400 mt-1">
                          {t('eventDetail.registrationClosed', 'Registration closed')}
                        </p>
                      )}
                    </div>
                  </div>

                  {event.organiser_org_id && (
                    <div className="flex items-start gap-4">
                      <div className="p-3 bg-primary-50 dark:bg-primary-900/30 rounded-lg">
                        <Users className="w-6 h-6 text-primary-600 dark:text-primary-400" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">
                          {t('eventDetail.organizer', 'Organizer')}
                        </p>
                        <p className="text-gray-600 dark:text-gray-400">
                          {organizerName ? (
                            <Link
                              to={`/organizations/${event.organiser_org_id}`}
                              className="text-primary-600 dark:text-primary-400 hover:underline font-medium"
                            >
                              {organizerName}
                            </Link>
                          ) : (
                            t('eventDetail.unknownOrganization', 'Unknown organization')
                          )}
                        </p>
                      </div>
                    </div>
                  )}
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
                        {t('eventDetail.tabDetails', 'Details')}
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
                          {t('eventDetail.tabChat', 'Chat')}
                        </div>
                      </button>
                    )}
                  </nav>
                </div>

                {/* Tab Content */}
                <div className="min-h-[200px]">
                  {activeTab === 'details' && (
                    <div className="space-y-8">
                      {/* Description */}
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                          {t('eventDetail.aboutEvent')}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-400 whitespace-pre-line leading-relaxed">
                          {event.description || t('eventDetail.noDescription', 'No description provided.')}
                        </p>
                      </div>

                      {/* Location Map - Full Width in Main Content */}
                      {hasValidLocation && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            {t('eventDetail.eventLocation', 'Event Location')}
                          </h3>
                          <div className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
                            <EventMap
                              latitude={event.lat}
                              longitude={event.lng}
                              eventName={event.name}
                              location={event.location}
                              height="400px"
                            />
                          </div>
                          <div className="mt-3 flex items-center justify-between">
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              <MapPin className="w-4 h-4 inline mr-1" />
                              {event.location}
                            </p>
                            <button
                              onClick={getDirections}
                              className="text-sm text-primary-500 hover:text-primary-600 font-medium flex items-center gap-1"
                            >
                              <Navigation className="w-4 h-4" />
                              {t('eventDetail.openInMaps', 'Open in Maps')}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Event Images */}
                      {event.images && event.images.length > 1 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            {t('eventDetail.photos', 'Event Photos')}
                          </h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                            {event.images.slice(1).map((image, index) => (
                              <div key={index} className="relative group">
                                <img
                                  src={image}
                                  alt={`Event image ${index + 2}`}
                                  className="w-full h-48 object-cover rounded-lg shadow-sm"
                                />
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tags */}
                      {event.tags && event.tags.length > 0 && (
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                            {t('eventDetail.tags', 'Tags')}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {event.tags.map(tag => (
                              <span
                                key={tag}
                                className="px-4 py-2 bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-300 rounded-full text-sm font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {activeTab === 'chat' && isRegistered && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-[600px]">
                      <ChatRoom eventId={event.id} eventStatus={event.status} />
                    </div>
                  )}
                </div>
              </div>

              {/* Right Column: Registration Card */}
              <div className="w-full lg:w-80 xl:w-96 shrink-0">
                <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6 sticky top-24">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    {t('eventDetail.registration.title', 'Registration')}
                  </h3>

                  {isRegistered ? (
                    <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 text-center mb-4">
                      <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
                      <p className="text-green-800 dark:text-green-200 font-medium">
                        {t('eventDetail.registration.registered', 'You are registered!')}
                      </p>
                      <p className="text-sm text-green-600 dark:text-green-400 mt-1">
                        {t(
                          'eventDetail.registration.registeredDescription',
                          'See you at the event. Check the Discussion tab for updates.'
                        )}
                      </p>
                    </div>
                  ) : isPastEvent ? (
                    <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-center mb-4">
                      <AlertCircle className="w-10 h-10 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-900 dark:text-gray-100 font-medium">
                        {t('eventDetail.registration.pastTitle', 'Event has ended')}
                      </p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {t(
                          'eventDetail.registration.pastDescription',
                          'This event is in the past. Registration is no longer available.'
                        )}
                      </p>
                    </div>
                  ) : (
                    <>
                      {registrationStatus === 'error' && (
                        <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {t(
                            'eventDetail.registration.error',
                            'Something went wrong. Please try again.'
                          )}
                        </div>
                      )}

                      {capacityReached ? (
                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 text-center">
                          <AlertCircle className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                          <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                            {t('eventDetail.registration.fullTitle', 'Event is Full')}
                          </p>
                          <button className="mt-4 w-full py-2 px-4 border border-yellow-500 text-yellow-600 dark:text-yellow-400 rounded-lg hover:bg-yellow-50 dark:hover:bg-yellow-900/30 transition-colors">
                            {t('eventDetail.registration.joinWaitlist', 'Join Waitlist')}
                          </button>
                        </div>
                      ) : !event.allow_registration ? (
                        <div className="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-center">
                          <AlertCircle className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                          <p className="text-gray-800 dark:text-gray-200 font-medium">
                            {t('eventDetail.registration.closedTitle', 'Registration Closed')}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {t(
                              'eventDetail.registration.closedDescription',
                              'Registration is not available for this event.'
                            )}
                          </p>
                        </div>
                      ) : (
                        <button
                          onClick={handleRegister}
                          disabled={registrationStatus === 'loading'}
                          className="w-full py-3 px-4 rounded-lg font-semibold text-lg transition-all transform active:scale-95 bg-primary-500 hover:bg-primary-600 text-white shadow-lg hover:shadow-primary-500/30"
                        >
                          {registrationStatus === 'loading' ? (
                            <div className="flex items-center justify-center gap-2">
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                              {t('eventDetail.registering')}
                            </div>
                          ) : (
                            t('eventDetail.registerForEvent')
                          )}
                        </button>
                      )}

                      <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-4">
                        {t(
                          'eventDetail.registration.disclaimer',
                          'By registering, you agree to share your basic profile info with the organizers.'
                        )}
                      </p>
                    </>
                  )}

                  {/* Additional Info */}
                  <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                      {t('eventDetail.infoTitle', 'Event Information')}
                    </h4>
                    <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                      <li className="flex justify-between">
                        <span>{t('eventDetail.infoStatus', 'Status:')}</span>
                        <span className="font-medium capitalize">{event.status.replace('_', ' ')}</span>
                      </li>
                      <li className="flex justify-between">
                        <span>{t('eventDetail.infoCreated', 'Created:')}</span>
                        <span>{formatDateSafe(event.createdAt)}</span>
                      </li>
                      {hasValidLocation && (
                        <li className="flex flex-col gap-1 pt-2">
                          <span className="font-medium text-gray-700 dark:text-gray-300">
                            {t('eventDetail.infoCoordinates', 'Coordinates:')}
                          </span>
                          <span className="font-mono text-xs text-gray-500 dark:text-gray-400">
                            {event.lat.toFixed(6)}, {event.lng.toFixed(6)}
                          </span>
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 space-y-2">
                    <button
                      onClick={handleShare}
                      className="w-full py-2.5 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2 font-medium"
                    >
                      <Share2 className="w-4 h-4" />
                      {t('eventDetail.share', 'Share Event')}
                    </button>

                    {hasValidLocation && (
                      <button
                        onClick={getDirections}
                        className="w-full py-2.5 px-4 bg-gray-800 hover:bg-gray-900 dark:bg-gray-700 dark:hover:bg-gray-600 text-white rounded-lg transition-colors flex items-center justify-center gap-2 font-medium"
                      >
                        <Navigation className="w-4 h-4" />
                        {t('eventDetail.getDirections', 'Get Directions')}
                      </button>
                    )}
                  </div>
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