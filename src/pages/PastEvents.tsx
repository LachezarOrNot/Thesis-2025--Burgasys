import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { databaseService } from '../services/database';
import { Event } from '../types';
import LoadingSpinner from '../components/LoadingSpinner';
import { Calendar, MapPin, Users, Clock } from 'lucide-react';
import { format } from 'date-fns';

const PastEvents: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPastEvents();
  }, []);

  const loadPastEvents = async () => {
    try {
      setLoading(true);
      // Get all events and filter for finished ones
      const allEvents = await databaseService.getEvents();
      const pastEvents = allEvents.filter(event => 
        event.status === 'finished' || new Date(event.end_datetime) < new Date()
      );
      setEvents(pastEvents);
    } catch (error) {
      console.error('Error loading past events:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div
      className="min-h-screen py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden"
      style={{
        // Colorful, larger grid background similar to other pages
        backgroundImage: `linear-gradient(to bottom right, rgba(129,140,248,0.20), rgba(244,114,182,0.22)),
          linear-gradient(rgba(129,140,248,0.18) 1px, transparent 1px),
          linear-gradient(90deg, rgba(129,140,248,0.18) 1px, transparent 1px)`,
        backgroundSize: '100% 100%, 64px 64px, 64px 64px',
        backgroundPosition: '0 0, -1px -1px, -1px -1px',
      }}
    >
      {/* subtle radial glow behind main content */}
      <div className="pointer-events-none absolute inset-0 opacity-60 mix-blend-soft-light">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-primary-400/30 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 right-0 w-96 h-96 bg-pink-500/25 rounded-full blur-3xl" />
      </div>

      <div className="relative container mx-auto max-w-6xl">
        <div className="mb-10">
          <div className="inline-flex items-center gap-3 px-3 py-1.5 rounded-full bg-white/80 dark:bg-slate-900/80 border border-white/60 dark:border-slate-700/80 shadow-sm mb-4">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-indigo-500 to-pink-500 flex items-center justify-center text-white">
              <Calendar className="w-4 h-4" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-700 dark:text-slate-200">
              Event Archive
            </span>
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-slate-900 dark:text-white mb-3">
            Past Events Gallery
          </h1>
          <p className="text-slate-600 dark:text-slate-400 max-w-2xl">
            Browse our archive of completed events and their highlights.
          </p>
        </div>

        {events.length === 0 ? (
          <div className="max-w-xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/60 dark:border-slate-700/80 p-10 text-center">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-indigo-500 to-pink-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Calendar className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
              No Past Events Yet
            </h3>
            <p className="text-slate-600 dark:text-slate-400 mb-8">
              Check back later for completed events and reports.
            </p>
            <Link
              to="/events"
              className="inline-flex items-center justify-center bg-primary-500 hover:bg-primary-600 text-white px-7 py-3 rounded-2xl font-semibold text-sm shadow-lg hover:shadow-xl transition-all"
            >
              Browse Current Events
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
            {events.map(event => (
              <div
                key={event.id}
                className="group relative bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-3xl border border-white/60 dark:border-slate-700/80 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 flex flex-col overflow-hidden"
              >
                <div className="relative">
                  {event.images && event.images.length > 0 ? (
                    <img
                      src={event.images[0]}
                      alt={event.name}
                      className="w-full h-48 object-cover"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 flex items-center justify-center">
                      <Calendar className="w-10 h-10 text-primary-500 dark:text-primary-400" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/70 via-slate-900/10 to-transparent pointer-events-none" />
                  <div className="absolute bottom-3 left-4 right-4 flex items-center justify-between gap-2 text-xs text-white">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-white/15 backdrop-blur-md">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(event.start_datetime), 'MMM dd, yyyy')}
                    </span>
                    <span className="inline-flex items-center px-2 py-1 rounded-full bg-emerald-400/80 text-emerald-950 font-semibold">
                      Past Event
                    </span>
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col">
                  <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-2 line-clamp-2">
                    {event.name}
                  </h3>

                  {event.subtitle && (
                    <p className="text-slate-600 dark:text-slate-300 mb-3 text-sm line-clamp-2">
                      {event.subtitle}
                    </p>
                  )}

                  <div className="space-y-2 mb-4 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>
                        {format(new Date(event.start_datetime), 'HH:mm')} –{' '}
                        {format(new Date(event.end_datetime), 'HH:mm')}
                      </span>
                    </div>

                    <div className="flex items-center">
                      <MapPin className="w-4 h-4 mr-2" />
                      <span className="line-clamp-1">
                        {event.location || 'Location not specified'}
                      </span>
                    </div>

                    {event.capacity && (
                      <div className="flex items-center">
                        <Users className="w-4 h-4 mr-2" />
                        <span>
                          {(event.registeredUsers?.length || 0)} / {event.capacity} attended
                        </span>
                      </div>
                    )}
                  </div>

                  {event.tags && event.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {event.tags.slice(0, 3).map(tag => (
                        <span
                          key={tag}
                          className="px-2 py-1 bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 rounded-full text-[11px]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="mt-auto flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
                    <span className="text-xs text-slate-500 dark:text-slate-400">
                      {event.organization?.name || 'Unknown Organizer'}
                    </span>
                    <Link
                      to={`/events/${event.id}`}
                      className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white px-4 py-1.5 rounded-full text-xs font-semibold shadow-sm hover:shadow-md transition-all"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PastEvents;