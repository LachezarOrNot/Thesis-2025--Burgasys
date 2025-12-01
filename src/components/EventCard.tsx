import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock, Edit, Trash2, Eye, Sparkles } from 'lucide-react';
import { Event } from '../types';
import { format, isValid } from 'date-fns';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { useTranslation } from 'react-i18next';

interface EventCardProps {
  event: Event;
  onEventUpdate?: () => void;
}

// --- START: SHARED DATE FIX HELPER ---
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
// --- END: SHARED DATE FIX HELPER ---

const EventCard: React.FC<EventCardProps> = ({ event, onEventUpdate }) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const formatDateSafe = (date: any): string => {
    // Use the robust processor
    const dateObj = processDate(date);
    if (!dateObj) return t('eventCard.dateNotSet');
    try {
      return format(dateObj, 'MMM dd, yyyy');
    } catch (error) {
      console.error('Date formatting error:', error);
      return t('eventCard.dateError');
    }
  };

  const formatTimeSafe = (date: any): string => {
    // Use the robust processor
    const dateObj = processDate(date);
    if (!dateObj) return t('eventCard.timeNotSet');
    try {
      return format(dateObj, 'HH:mm');
    } catch (error) {
      console.error('Time formatting error:', error);
      return t('eventCard.timeError');
    }
  };

  const registeredCount = event.registeredUsers?.length || 0;
  const isFull = event.capacity && registeredCount >= event.capacity;

  const canEditDelete = user && (
    user.role === 'admin' ||
    user.uid === event.createdBy ||
    user.uid === event.organiser_org_id
  );

  const handleDelete = async () => {
    if (!window.confirm(t('eventCard.deleteConfirm.message'))) {
      return;
    }

    try {
      await databaseService.deleteEvent(event.id);
      onEventUpdate?.();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const handleEdit = () => {
    navigate(`/events/${event.id}/edit`);
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      'published': t('eventCard.status.published'),
      'pending_approval': t('eventCard.status.pending_approval'),
      'finished': t('eventCard.status.finished'),
      'draft': t('eventCard.status.draft'),
      'rejected': t('eventCard.status.rejected')
    };
    return statusMap[status] || t('eventCard.status.unknown');
  };

  return (
    <div className="group bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 dark:border-gray-700 hover:border-primary-200 dark:hover:border-primary-600">
      {/* Image Section with Overlays */}
      {event.images && event.images.length > 0 && !imageError && (
        <div className="relative h-52 overflow-hidden">
          <img
            src={event.images[0]}
            alt={event.name}
            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
              imageLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setImageLoaded(true)}
            onError={() => setImageError(true)}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />

          {/* Status Badge */}
          <div className="absolute top-4 left-4">
            <span
              className={`px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-sm ${
                event.status === 'published'
                  ? 'bg-green-500/90 text-white'
                  : event.status === 'pending_approval'
                  ? 'bg-yellow-500/90 text-white'
                  : event.status === 'finished'
                  ? 'bg-gray-500/90 text-white'
                  : 'bg-blue-500/90 text-white'
              }`}
            >
              {getStatusText(event.status || 'unknown')}
            </span>
          </div>

          {/* Admin Actions */}
          {canEditDelete && (
            <div className="absolute top-4 right-4 flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
              <button
                onClick={handleEdit}
                className="bg-white/90 dark:bg-gray-800/90 p-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 text-gray-700 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400"
                title={t('eventCard.edit')}
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={handleDelete}
                className="bg-white/90 dark:bg-gray-800/90 p-2 rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110 text-gray-700 dark:text-gray-300 hover:text-red-600 dark:hover:text-red-400"
                title={t('common.delete')}
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Capacity Indicator */}
          {event.capacity && (
            <div className="absolute bottom-4 left-4 bg-black/70 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg">
              <div className="flex items-center gap-1.5 text-sm font-medium">
                <Users className="w-4 h-4" />
                <span>{registeredCount}/{event.capacity}</span>
                {isFull && (
                  <span className="bg-red-500 px-2 py-0.5 rounded text-xs font-bold">
                    {t('eventCard.full')}
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Content Section */}
      <div className="p-6">
        {/* Header */}
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors duration-300">
            {event.name || 'Unnamed Event'}
          </h3>
          {event.subtitle && (
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed line-clamp-2">
              {event.subtitle}
            </p>
          )}
        </div>

        {/* Event Details */}
        <div className="space-y-3 mb-4">
          <div className="flex items-center text-gray-700 dark:text-gray-300">
            <Calendar className="w-4 h-4 mr-3 text-primary-500 flex-shrink-0" />
            <span className="font-medium">{formatDateSafe(event.start_datetime)}</span>
            {event.end_datetime && formatDateSafe(event.start_datetime) !== formatDateSafe(event.end_datetime) && (
              <span className="font-medium"> - {formatDateSafe(event.end_datetime)}</span>
            )}
          </div>

          {event.start_datetime && event.end_datetime && (
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <Clock className="w-4 h-4 mr-3 text-primary-500 flex-shrink-0" />
              <span className="font-medium">
                {formatTimeSafe(event.start_datetime)} - {formatTimeSafe(event.end_datetime)}
              </span>
            </div>
          )}

          {event.location && (
            <div className="flex items-center text-gray-700 dark:text-gray-300">
              <MapPin className="w-4 h-4 mr-3 text-primary-500 flex-shrink-0" />
              <span className="font-medium line-clamp-1">{event.location}</span>
            </div>
          )}
        </div>

        {/* Tags */}
        {event.tags && event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {event.tags.slice(0, 3).map(tag => (
              <span
                key={tag}
                className="px-3 py-1.5 bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 rounded-lg text-xs font-semibold transition-colors duration-300 hover:bg-primary-200 dark:hover:bg-primary-800/60"
              >
                {tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="px-3 py-1.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-xs font-semibold">
                +{event.tags.length - 3}
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-600">
          <div className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            {t('common.by')} {event.organization?.name || t('eventCard.unknownOrganizer')}
          </div>
          <div className="flex items-center gap-2">
            {canEditDelete && (
              <button
                onClick={handleEdit}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-md hover:shadow-lg"
              >
                <Edit className="w-4 h-4" />
                {t('eventCard.edit')}
              </button>
            )}
            <Link
              to={`/events/${event.id}`}
              className="px-5 py-2.5 bg-primary-500 hover:bg-primary-600 text-white rounded-lg text-sm font-semibold transition-all duration-300 hover:scale-105 flex items-center gap-2 shadow-md hover:shadow-lg group/link"
            >
              <Eye className="w-4 h-4" />
              {t('eventCard.viewDetails')}
              <Sparkles className="w-4 h-4 opacity-0 group-hover/link:opacity-100 transition-opacity duration-300" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default EventCard;