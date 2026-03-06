import React, { useEffect, useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { AffiliationRequest, Organization, User } from '../types';
import { useNavigate } from 'react-router-dom';
import { Check, X, Users, School, Clock, AlertCircle } from 'lucide-react';

const OrganizationStudents: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [requests, setRequests] = useState<AffiliationRequest[]>([]);
  const [students, setStudents] = useState<User[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentSort, setStudentSort] = useState<'name' | 'recent'>('name');

  const canAccess =
    !!user && (user.role === 'school' || user.role === 'university');

  useEffect(() => {
    if (!user) return;
    if (!canAccess) {
      navigate('/events', { replace: true });
      return;
    }

    const loadData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Get organizations where this user is admin
        const orgs = await databaseService.getUserOrganizations(user.uid);
        const filteredOrgs = orgs.filter(
          (org) => org.type === 'school' || org.type === 'university'
        );

        if (filteredOrgs.length === 0) {
          setOrganizations([]);
          setRequests([]);
          setStudents([]);
          setSelectedOrgId(null);
          setLoading(false);
          return;
        }

        setOrganizations(filteredOrgs);
        const initialOrgId = selectedOrgId || filteredOrgs[0].id;
        setSelectedOrgId(initialOrgId);

        await loadOrgData(initialOrgId);
      } catch (err: any) {
        console.error('Error loading organization students page:', err);
        setError(t('organizationStudents.errors.loadFailed'));
      } finally {
        setLoading(false);
      }
    };

    const loadOrgData = async (orgId: string) => {
      try {
        // Load affiliation requests for this org
        const orgRequests = await databaseService.getAffiliationRequests(orgId);
        setRequests(orgRequests);

        // Load all users and filter students affiliated with this org
        const allUsers = await databaseService.getAllUsers();
        const orgStudents = allUsers.filter(
          (u) => u.role === 'student' && u.affiliatedOrganizationId === orgId
        );
        setStudents(orgStudents);
      } catch (err: any) {
        console.error('Error loading organization data:', err);
        setError(t('organizationStudents.errors.loadFailed'));
      }
    };

    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const handleOrgChange = async (orgId: string) => {
    setSelectedOrgId(orgId);
    setLoading(true);
    setError(null);
    try {
      // Reuse inner loader
      const orgRequests = await databaseService.getAffiliationRequests(orgId);
      setRequests(orgRequests);

      const allUsers = await databaseService.getAllUsers();
      const orgStudents = allUsers.filter(
        (u) => u.role === 'student' && u.affiliatedOrganizationId === orgId
      );
      setStudents(orgStudents);
    } catch (err: any) {
      console.error('Error changing organization:', err);
      setError(t('organizationStudents.errors.loadFailed'));
    } finally {
      setLoading(false);
    }
  };

  const pendingRequests = useMemo(
    () => requests.filter((r) => r.status === 'pending'),
    [requests]
  );

  const totalStudents = students.length;
  const totalRequests = requests.length;

  const filteredStudents = useMemo(() => {
    const query = studentSearch.trim().toLowerCase();
    let list = [...students];

    if (query) {
      list = list.filter((s) =>
        [s.displayName, s.email, s.studentId]
          .filter(Boolean)
          .some((field) => field!.toLowerCase().includes(query))
      );
    }

    if (studentSort === 'name') {
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
    } else {
      // We don't have join date here, so approximate by uid for a stable order
      list.sort((a, b) => b.uid.localeCompare(a.uid));
    }

    return list;
  }, [students, studentSearch, studentSort]);

  const handleRequestAction = async (
    requestId: string,
    status: 'approved' | 'rejected'
  ) => {
    if (!selectedOrgId) return;
    setActionLoading(requestId + status);
    setError(null);

    try {
      await databaseService.updateAffiliationRequest(requestId, {
        status,
        reviewedBy: user?.uid,
      });

      // Refresh data
      const [updatedRequests, allUsers] = await Promise.all([
        databaseService.getAffiliationRequests(selectedOrgId),
        databaseService.getAllUsers(),
      ]);
      setRequests(updatedRequests);
      const orgStudents = allUsers.filter(
        (u) => u.role === 'student' && u.affiliatedOrganizationId === selectedOrgId
      );
      setStudents(orgStudents);
    } catch (err: any) {
      console.error('Error updating affiliation request:', err);
      setError(t('organizationStudents.errors.actionFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  const handleRemoveStudent = async (student: User) => {
    if (!selectedOrgId) return;
    const confirmed = window.confirm(
      t('organizationStudents.remove.confirm', {
        name: student.displayName,
      })
    );
    if (!confirmed) return;

    setActionLoading('remove-' + student.uid);
    setError(null);

    try {
      // Remove affiliation from user
      await databaseService.updateUser(student.uid, {
        affiliatedOrganizationId: undefined,
      });

      // Remove from organization affiliatedStudents
      const org = await databaseService.getOrganization(selectedOrgId);
      if (org) {
        await databaseService.updateOrganization(selectedOrgId, {
          affiliatedStudents:
            org.affiliatedStudents?.filter((uid) => uid !== student.uid) || [],
        });
      }

      // Refresh students
      const allUsers = await databaseService.getAllUsers();
      const orgStudents = allUsers.filter(
        (u) => u.role === 'student' && u.affiliatedOrganizationId === selectedOrgId
      );
      setStudents(orgStudents);
    } catch (err: any) {
      console.error('Error removing student affiliation:', err);
      setError(t('organizationStudents.errors.removeFailed'));
    } finally {
      setActionLoading(null);
    }
  };

  if (!user) {
    return null;
  }

  if (!canAccess) {
    return null;
  }

  const activeOrg = organizations.find((o) => o.id === selectedOrgId) || null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-blue-50 dark:from-gray-900 dark:via-gray-800 dark:to-primary-900 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="mb-8 space-y-4">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                <Users className="w-7 h-7 text-primary-500" />
                {t('organizationStudents.title')}
              </h1>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                {t('organizationStudents.subtitle')}
              </p>
            </div>

            {organizations.length > 0 && (
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                {organizations.length > 1 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {t('organizationStudents.organizationLabel')}
                    </span>
                    <select
                      value={selectedOrgId || ''}
                      onChange={(e) => handleOrgChange(e.target.value)}
                      className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-white"
                    >
                      {organizations.map((org) => (
                        <option key={org.id} value={org.id}>
                          {org.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Stats cards */}
          {activeOrg && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white/90 dark:bg-gray-900/90 border border-primary-100 dark:border-primary-800 rounded-2xl p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  {t('organizationStudents.stats.organization')}
                </div>
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {activeOrg.name}
                </div>
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-500 capitalize">
                  {t(`roles.${activeOrg.type}`)}
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-900/90 border border-emerald-100 dark:border-emerald-800 rounded-2xl p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  {t('organizationStudents.stats.totalStudents')}
                </div>
                <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
                  {totalStudents}
                </div>
              </div>
              <div className="bg-white/90 dark:bg-gray-900/90 border border-amber-100 dark:border-amber-800 rounded-2xl p-4 shadow-sm">
                <div className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">
                  {t('organizationStudents.stats.pendingRequests')}
                </div>
                <div className="text-2xl font-bold text-amber-600 dark:text-amber-400">
                  {pendingRequests.length}
                </div>
                {totalRequests > 0 && (
                  <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                    {t('organizationStudents.stats.totalRequests', {
                      count: totalRequests,
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {loading && (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500" />
              <p className="text-gray-600 dark:text-gray-400">
                {t('organizationStudents.loading')}
              </p>
            </div>
          </div>
        )}

        {!loading && organizations.length === 0 && (
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl shadow-2xl p-10 border border-primary-100 dark:border-primary-700 text-center">
            <div className="w-20 h-20 bg-primary-100 dark:bg-primary-900/40 rounded-full flex items-center justify-center mx-auto mb-6">
              <School className="w-10 h-10 text-primary-500" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
              {t('organizationStudents.noOrganizations.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {t('organizationStudents.noOrganizations.description')}
            </p>
          </div>
        )}

        {!loading && activeOrg && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Pending Requests */}
            <div className="lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-primary-500" />
                  {t('organizationStudents.requests.title')}
                </h2>
                <span className="text-xs px-3 py-1 rounded-full bg-primary-100 dark:bg-primary-900/40 text-primary-700 dark:text-primary-300 font-medium">
                  {t('organizationStudents.requests.count', {
                    count: pendingRequests.length,
                  })}
                </span>
              </div>

              {pendingRequests.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('organizationStudents.requests.empty')}
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {pendingRequests.map((request) => (
                    <div
                      key={request.id}
                      className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white">
                          {request.studentName}
                        </div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">
                          {request.studentEmail}
                          {request.studentId && (
                            <span className="ml-2 text-xs text-gray-500">
                              • {t('organizationStudents.requests.studentId', {
                                id: request.studentId,
                              })}
                            </span>
                          )}
                        </div>
                        <div className="mt-1 text-xs text-gray-500 dark:text-gray-500">
                          {t('organizationStudents.requests.requestedAt', {
                            date: new Date(request.requestedAt).toLocaleString(),
                          })}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            handleRequestAction(request.id, 'rejected')
                          }
                          disabled={!!actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-medium hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                          {t('organizationStudents.requests.reject')}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleRequestAction(request.id, 'approved')
                          }
                          disabled={!!actionLoading}
                          className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-medium disabled:opacity-50"
                        >
                          {actionLoading === request.id + 'approved' ? (
                            <span className="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )}
                          {t('organizationStudents.requests.approve')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Students list */}
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <School className="w-5 h-5 text-primary-500" />
                  {t('organizationStudents.students.title')}
                </h2>
              </div>

              {/* Search + sort */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={studentSearch}
                    onChange={(e) => setStudentSearch(e.target.value)}
                    placeholder={t('organizationStudents.students.searchPlaceholder')}
                    className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-primary-500"
                  />
                </div>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <div>
                    {filteredStudents.length !== students.length
                      ? t('organizationStudents.students.filteredCount', {
                          visible: filteredStudents.length,
                          total: students.length,
                        })
                      : t('organizationStudents.students.totalCount', {
                          count: students.length,
                        })}
                  </div>
                  <div className="flex items-center gap-2">
                    <span>{t('organizationStudents.students.sortLabel')}</span>
                    <select
                      value={studentSort}
                      onChange={(e) =>
                        setStudentSort(e.target.value === 'recent' ? 'recent' : 'name')
                      }
                      className="px-2 py-1 rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-xs text-gray-900 dark:text-white"
                    >
                      <option value="name">
                        {t('organizationStudents.students.sortByName')}
                      </option>
                      <option value="recent">
                        {t('organizationStudents.students.sortByRecent')}
                      </option>
                    </select>
                  </div>
                </div>
              </div>

              {filteredStudents.length === 0 ? (
                <div className="bg-white dark:bg-gray-900 border border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-6 text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {students.length === 0
                      ? t('organizationStudents.students.empty')
                      : t('organizationStudents.students.noSearchResults')}
                  </p>
                </div>
              ) : (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-200 dark:border-gray-700 divide-y divide-gray-200 dark:divide-gray-800 max-h-[420px] overflow-y-auto">
                  {filteredStudents.map((student) => (
                    <div
                      key={student.uid}
                      className="px-4 py-3 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="font-medium text-gray-900 dark:text-white">
                          {student.displayName}
                        </div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">
                          {student.email}
                          {student.studentId && (
                            <span className="ml-2 text-xs text-gray-500">
                              • {t('organizationStudents.students.studentId', {
                                id: student.studentId,
                              })}
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveStudent(student)}
                        disabled={!!actionLoading}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                      >
                        <X className="w-3 h-3" />
                        {t('organizationStudents.students.remove')}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {error && (
          <div className="mt-8 flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganizationStudents;

