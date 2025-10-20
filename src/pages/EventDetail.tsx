import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Event } from '../types';
import { databaseService } from '../services/database';
import ChatRoom from '../components/ChatRoom';
import { MapPin, Calendar, Users, Clock, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format, isValid } from 'date-fns';
import LoadingSpinner from '../components/LoadingSpinner';

const EventDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [activeTab, setActiveTab] = useState('details');
  const [loading, setLoading] = useState(true);
  const [registrationStatus, setRegistrationStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  useEffect(() => {
    if (id) {
      loadEvent();
    }
  }, [id]);

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

  // Safe date formatting with validation
  const formatDateSafe = (date: any): string => {
    if (!date) return 'Date not set';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return isValid(dateObj) ? format(dateObj, 'MMMM dd, yyyy') : 'Invalid date';
    } catch {
      return 'Date error';
    }
  };

  const formatTimeSafe = (date: any): string => {
    if (!date) return 'Time not set';
    
    try {
      const dateObj = date instanceof Date ? date : new Date(date);
      return isValid(dateObj) ? format(dateObj, 'HH:mm') : 'Invalid time';
    } catch {
      return 'Time error';
    }
  };

  const handleRegister = async () => {
    if (!event || !user) return;

    setRegistrationStatus('loading');
    try {
      await databaseService.registerForEvent(event.id, user.uid);
      setRegistrationStatus('success');
      loadEvent(); // Reload event to update registration count
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
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Event not found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The event you're looking for doesn't exist.</p>
          <Link to="/events" className="text-primary-500 hover:text-primary-600">
            Back to events
          </Link>
        </div>
      </div>
    );
  }

  const isRegistered = event.registeredUsers?.includes(user?.uid || '');
  const registeredCount = event.registeredUsers?.length || 0;
  const isFull = event.capacity && registeredCount >= event.capacity;
  const canRegister = event.status === 'published' && event.allow_registration && !isFull && !isRegistered && user;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        <Link 
          to="/events" 
          className="inline-flex items-center text-primary-500 hover:text-primary-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to events
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-6">
            {event.images && event.images.length > 0 && (
              <img 
                src={event.images[0]} 
                alt={event.name}
                className="w-full lg:w-1/3 h-64 object-cover rounded-lg"
                onError={(e) => {
                  // Hide image if it fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            )}
            <div className="flex-1">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                    {event.name}
                  </h1>
                  {event.subtitle && (
                    <p className="text-xl text-gray-600 dark:text-gray-300 mb-4">
                      {event.subtitle}
                    </p>
                  )}
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  event.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
                  event.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
                  event.status === 'finished' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
                  'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                }`}>
                  {event.status ? event.status.replace('_', ' ') : 'unknown'}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Calendar className="w-5 h-5 mr-3" />
                  <div>
                    <p className="font-medium">Date</p>
                    <p>{formatDateSafe(event.start_datetime)}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Clock className="w-5 h-5 mr-3" />
                  <div>
                    <p className="font-medium">Time</p>
                    <p>{formatTimeSafe(event.start_datetime)} - {formatTimeSafe(event.end_datetime)}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <MapPin className="w-5 h-5 mr-3" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p>{event.location || 'Location not specified'}</p>
                  </div>
                </div>
                <div className="flex items-center text-gray-600 dark:text-gray-400">
                  <Users className="w-5 h-5 mr-3" />
                  <div>
                    <p className="font-medium">Attendees</p>
                    <p>
                      {registeredCount}
                      {event.capacity && ` / ${event.capacity}`}
                      {isFull && ' (Full)'}
                    </p>
                  </div>
                </div>
              </div>

              {event.tags && event.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-6">
                  {event.tags.map(tag => (
                    <span 
                      key={tag}
                      className="px-3 py-1 bg-primary-100 dark:bg-primary-900 text-primary-800 dark:text-primary-200 rounded-full text-sm"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              {!user && (
                <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg mb-4">
                  Please sign in to register for this event
                </div>
              )}

              {canRegister && (
                <button
                  onClick={handleRegister}
                  disabled={registrationStatus === 'loading'}
                  className="bg-primary-500 hover:bg-primary-600 text-white px-8 py-3 rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {registrationStatus === 'loading' ? 'Registering...' : 'Register for Event'}
                </button>
              )}
              {isRegistered && (
                <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-3 rounded-lg">
                  You are registered for this event
                </div>
              )}
              {isFull && !isRegistered && (
                <div className="bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 px-4 py-3 rounded-lg">
                  This event is full. You can join the waitlist.
                </div>
              )}
              {registrationStatus === 'error' && (
                <div className="bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 px-4 py-3 rounded-lg">
                  Failed to register. Please try again.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md mb-6">
          <div className="border-b dark:border-gray-600">
            <nav className="flex -mb-px">
              {['details', 'chat'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                    activeTab === tab
                      ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'details' && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">About this event</h3>
                <div className="prose dark:prose-invert max-w-none">
                  <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{event.description}</p>
                </div>
              </div>
            )}
            
            {activeTab === 'chat' && (
              <ChatRoom 
                eventId={event.id} 
                eventStatus={event.status} 
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventDetail;