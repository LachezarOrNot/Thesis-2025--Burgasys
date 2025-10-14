import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { Event } from '../types';
import { format } from 'date-fns';

interface EventCardProps {
  event: Event;
}

const EventCard: React.FC<EventCardProps> = ({ event }) => {
  const isUpcoming = new Date(event.start_datetime) > new Date();
  const registeredCount = event.registeredUsers?.length || 0;
  const isFull = event.capacity && registeredCount >= event.capacity;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700">
      {event.images.length > 0 && (
        <img 
          src={event.images[0]} 
          alt={event.name}
          className="w-full h-48 object-cover"
        />
      )}
      
      <div className="p-6">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white line-clamp-2 flex-1 mr-2">
            {event.name}
          </h3>
          <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
            event.status === 'published' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' :
            event.status === 'pending_approval' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' :
            event.status === 'finished' ? 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200' :
            'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {event.status.replace('_', ' ')}
          </span>
        </div>

        {event.subtitle && (
          <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {event.subtitle}
          </p>
        )}

        <div className="space-y-2 mb-4">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Calendar className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm">
              {format(new Date(event.start_datetime), 'MMM dd, yyyy')}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Clock className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm">
              {format(new Date(event.start_datetime), 'HH:mm')} - {format(new Date(event.end_datetime), 'HH:mm')}
            </span>
          </div>
          
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
            <span className="text-sm line-clamp-1">{event.location}</span>
          </div>

          {event.capacity && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Users className="w-4 h-4 mr-2 flex-shrink-0" />
              <span className="text-sm">
                {registeredCount} / {event.capacity} registered
                {isFull && ' • Full'}
              </span>
            </div>
          )}
        </div>

        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-4">
            {event.tags.slice(0, 3).map(tag => (
              <span 
                key={tag}
                className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs"
              >
                {tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded text-xs">
                +{event.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            By {event.organization?.name || 'Unknown Organizer'}
          </span>
          
          <Link 
            to={`/events/${event.id}`}
            className="bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default EventCard;