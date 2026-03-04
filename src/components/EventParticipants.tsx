import React, { useEffect, useState } from 'react';
import { Users, Clock } from 'lucide-react';
import { databaseService } from '../services/database';
import { EventRegistration, User } from '../types';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';

interface EventParticipantsProps {
  eventId: string;
}

interface EnrichedRegistration extends EventRegistration {
  user?: User;
}

const EventParticipants: React.FC<EventParticipantsProps> = ({ eventId }) => {
  const { t } = useTranslation();
  const [participants, setParticipants] = useState<EnrichedRegistration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadParticipants = async () => {
      try {
        setLoading(true);
        const registrations = await databaseService.getEventRegistrations(eventId);

        const uniqueUserIds = Array.from(new Set(registrations.map(r => r.userUid)));
        const users = await Promise.all(uniqueUserIds.map(uid => databaseService.getUser(uid)));

        const userMap = new Map<string, User>();
        users.forEach(user => {
          if (user) {
            userMap.set(user.uid, user);
          }
        });

        const enriched: EnrichedRegistration[] = registrations.map(reg => ({
          ...reg,
          user: userMap.get(reg.userUid) || reg.user,
        }));

        setParticipants(enriched);
      } catch (error) {
        console.error('Error loading participants:', error);
      } finally {
        setLoading(false);
      }
    };

    loadParticipants();
  }, [eventId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500 dark:text-gray-400 text-sm">
        {t('common.loading', 'Loading participants...')}
      </div>
    );
  }

  if (participants.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center text-gray-500 dark:text-gray-400 text-sm">
        <Users className="w-8 h-8 mb-2" />
        <p>{t('eventDetail.participants.empty', 'No participants yet.')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Users className="w-5 h-5" />
          {t('eventDetail.participants.title', 'Participants')}
        </h3>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {t('eventDetail.participants.count', {
            defaultValue: '{{count}} participants',
            count: participants.length,
          })}
        </span>
      </div>

      <div className="divide-y divide-gray-200 dark:divide-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
        {participants.map((p) => {
          const user = p.user;
          const displayName = user?.displayName || user?.email || p.userUid;
          const email = user?.email;

          return (
            <div key={p.id} className="flex items-center justify-between px-4 py-3 bg-white dark:bg-gray-900/60">
              <div className="flex items-center gap-3">
                <img
                  src={
                    user?.photoURL ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=random`
                  }
                  alt={displayName}
                  className="h-9 w-9 rounded-full border border-gray-200 dark:border-gray-700"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{displayName}</p>
                  {email && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">{email}</p>
                  )}
                </div>
              </div>

              <div className="flex flex-col items-end gap-1">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    p.status === 'registered'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}
                >
                  {p.status === 'registered'
                    ? t('eventDetail.participants.registered', 'Registered')
                    : t('eventDetail.participants.waitlisted', 'Waitlisted')}
                </span>
                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                  <Clock className="w-3 h-3" />
                  <span>{format(p.registeredAt, 'MMM dd, yyyy HH:mm')}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default EventParticipants;

