import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Organization, Event } from '../types';
import { databaseService } from '../services/database';
import { Check, X, Building, Calendar } from 'lucide-react';

const Admin: React.FC = () => {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [activeTab, setActiveTab] = useState('organizations');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [orgsData, eventsData] = await Promise.all([
        databaseService.getOrganizations(),
        databaseService.getEvents()
      ]);
      setOrganizations(orgsData);
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
    }
  };

  const handleVerifyOrganization = async (orgId: string, verified: boolean) => {
    try {
      await databaseService.updateOrganization(orgId, { verified });
      loadData();
    } catch (error) {
      console.error('Error updating organization:', error);
    }
  };

  const pendingOrganizations = organizations.filter(org => !org.verified);
  const pendingEvents = events.filter(event => event.status === 'pending_approval');

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-100 via-gray-50 to-primary-200 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 flex items-center justify-center">
        <div className="text-center bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-xl shadow-xl p-10 border border-primary-200 dark:border-primary-700">
          <h2 className="text-3xl font-extrabold text-gray-900 dark:text-white mb-3">Access Denied</h2>
          <p className="text-lg text-gray-600 dark:text-gray-400">You need admin privileges to access this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-100 via-gray-50 to-primary-200 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-4 tracking-tight">
          Admin Dashboard
        </h1>
        <p className="text-lg text-gray-600 dark:text-gray-400 mb-10">
          Manage organizations and events
        </p>

        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-xl shadow-xl mb-10 border border-primary-200 dark:border-primary-700">
          <div className="border-b border-primary-200 dark:border-primary-700">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('organizations')}
                className={`py-5 px-8 font-bold text-base border-b-4 transition-colors duration-200 ${
                  activeTab === 'organizations'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900'
                    : 'border-transparent text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-800'
                }`}
              >
                <Building className="w-5 h-5 inline mr-2" />
                Organizations ({pendingOrganizations.length})
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`py-5 px-8 font-bold text-base border-b-4 transition-colors duration-200 ${
                  activeTab === 'events'
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400 bg-primary-100 dark:bg-primary-900'
                    : 'border-transparent text-gray-500 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-800'
                }`}
              >
                <Calendar className="w-5 h-5 inline mr-2" />
                Events ({pendingEvents.length})
              </button>
            </nav>
          </div>

          <div className="p-8">
            {activeTab === 'organizations' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Pending Organization Verifications
                </h3>
                {pendingOrganizations.length > 0 ? (
                  <div className="space-y-6">
                    {pendingOrganizations.map(org => (
                      <div key={org.id} className="bg-white/90 dark:bg-gray-900/90 rounded-lg shadow border border-primary-100 dark:border-primary-700 p-6 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{org.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 capitalize mb-1">{org.type}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{org.address}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{org.phone} • {org.email}</p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            onClick={() => handleVerifyOrganization(org.id, true)}
                            className="bg-green-500 hover:bg-green-600 text-white p-3 rounded-xl font-bold shadow transition-colors"
                            title="Verify Organization"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleVerifyOrganization(org.id, false)}
                            className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-xl font-bold shadow transition-colors"
                            title="Reject Organization"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                    <Check className="w-14 h-14 mx-auto mb-5 text-green-500" />
                    <p className="text-lg font-semibold">No pending organization verifications</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'events' && (
              <div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  Events Pending Approval
                </h3>
                {pendingEvents.length > 0 ? (
                  <div className="space-y-6">
                    {pendingEvents.map(event => (
                      <div key={event.id} className="bg-white/90 dark:bg-gray-900/90 rounded-lg shadow border border-primary-100 dark:border-primary-700 p-6 flex items-center justify-between">
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white text-lg mb-1">{event.name}</h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                            {new Date(event.start_datetime).toLocaleDateString()} • {event.location}
                          </p>
                          <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-1">
                            {event.description}
                          </p>
                        </div>
                        <div className="flex gap-3">
                          <button
                            className="bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-xl font-bold shadow transition-colors text-base"
                          >
                            Approve
                          </button>
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl font-bold shadow transition-colors text-base"
                          >
                            Reject
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center text-gray-500 dark:text-gray-400 py-10">
                    <Check className="w-14 h-14 mx-auto mb-5 text-green-500" />
                    <p className="text-lg font-semibold">No events pending approval</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;