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

  // Fixed: removed stray </span>
  return (
    <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden border border-primary-200 dark:border-primary-700 group">
      {event.images.length > 0 && (
        <img 
          src={event.images[0]} 
          alt={event.name}
          className="w-full h-52 object-cover group-hover:scale-105 transition-transform duration-300"
        />
      )}

      <div className="p-7">
        <div className="flex items-start justify-between mb-4">
          <h3 className="text-2xl font-extrabold text-gray-900 dark:text-white line-clamp-2 flex-1 mr-2 group-hover:text-primary-500 transition-colors duration-200">
            {event.name}
          </h3>
          <span className={`px-4 py-1 rounded-full text-xs font-bold whitespace-nowrap shadow-md ${
            event.status === 'published' ? 'bg-green-200 text-green-900 dark:bg-green-900 dark:text-green-200' :
            event.status === 'pending_approval' ? 'bg-yellow-200 text-yellow-900 dark:bg-yellow-900 dark:text-yellow-200' :
            event.status === 'finished' ? 'bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-200' :
            'bg-blue-200 text-blue-900 dark:bg-blue-900 dark:text-blue-200'
          }`}>
            {event.status.replace('_', ' ')}
          </span>
        </div>

        {event.subtitle && (
          <p className="text-lg text-gray-600 dark:text-gray-300 mb-5 line-clamp-2 font-medium">
            {event.subtitle}
          </p>
        )}

        <div className="space-y-3 mb-5">
          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Calendar className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-base font-semibold">
              {format(new Date(event.start_datetime), 'MMM dd, yyyy')}
            </span>
          </div>

          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <Clock className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-base font-semibold">
              {format(new Date(event.start_datetime), 'HH:mm')} - {format(new Date(event.end_datetime), 'HH:mm')}
            </span>
          </div>

          <div className="flex items-center text-gray-600 dark:text-gray-400">
            <MapPin className="w-5 h-5 mr-2 flex-shrink-0" />
            <span className="text-base font-semibold line-clamp-1">{event.location}</span>
          </div>

          {event.capacity && (
            <div className="flex items-center text-gray-600 dark:text-gray-400">
              <Users className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-base font-semibold">
                {registeredCount} / {event.capacity} registered
                {isFull && ' • Full'}
              </span>
            </div>
          )}
        </div>

        {event.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {event.tags.slice(0, 3).map(tag => (
              <span 
                key={tag}
                className="px-3 py-1 bg-primary-100 dark:bg-primary-700 text-primary-700 dark:text-primary-200 rounded-xl text-xs font-bold shadow-sm"
              >
                {tag}
              </span>
            ))}
            {event.tags.length > 3 && (
              <span className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-xl text-xs font-bold shadow-sm">
                +{event.tags.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex items-center justify-between">
          <span className="text-base text-gray-500 dark:text-gray-400 font-semibold">
            By {event.organization?.name || 'Unknown Organizer'}
          </span>

          <Link 
            to={`/events/${event.id}`}
            className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-2 rounded-xl text-base font-bold shadow-md transition-all duration-200"
          >
            View Details
          </Link>
        </div>
      </div>
    </div>
  );
}

export default EventCard;