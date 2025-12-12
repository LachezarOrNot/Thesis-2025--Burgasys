// src/pages/admin/UsersManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Download, Eye, Edit2, Shield, Trash2, 
  UserCheck, UserX, ChevronDown, MoreVertical, RefreshCw,
  Users, TrendingUp, BarChart3, PieChart, Activity,
  CheckCircle, XCircle, Clock, Mail, Phone, Globe,
  Calendar, Tag, Building, GraduationCap, Briefcase,
  AlertCircle, ChevronLeft, ChevronRight, Save, X,
  User as UserIcon, MapPin, BookOpen, Briefcase as BriefcaseIcon,
  School, Building2
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { User as UserType, UserRole, Organization } from '../types';
import {
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { format, subMonths, startOfDay, subDays, subWeeks, subYears } from 'date-fns';
import toast from 'react-hot-toast';

// User Details Modal Component
const UserDetailsModal: React.FC<{
  user: UserType;
  organizations: Organization[];
  onClose: () => void;
  onSave: (updates: Partial<UserType>) => Promise<void>;
}> = ({ user, organizations, onClose, onSave }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState<Partial<UserType>>({});
  const [loading, setLoading] = useState(false);

  // Initialize edited user when modal opens
  useEffect(() => {
    setEditedUser({
      displayName: user.displayName || '',
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber || '',
      bio: user.bio || '',
      studentId: user.studentId || '',
      affiliatedOrganizationId: user.affiliatedOrganizationId || '',
      isActive: user.isActive,
      approved: user.approved,
      approvalRequested: user.approvalRequested
    });
  }, [user]);

  const handleSave = async () => {
    try {
      setLoading(true);
      await onSave(editedUser);
      setIsEditing(false);
      toast.success('User updated successfully');
    } catch (error) {
      toast.error('Failed to update user');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditedUser({
      displayName: user.displayName || '',
      email: user.email,
      role: user.role,
      phoneNumber: user.phoneNumber || '',
      bio: user.bio || '',
      studentId: user.studentId || '',
      affiliatedOrganizationId: user.affiliatedOrganizationId || '',
      isActive: user.isActive,
      approved: user.approved,
      approvalRequested: user.approvalRequested
    });
  };

  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return <Shield className="h-4 w-4" />;
      case 'student': return <BookOpen className="h-4 w-4" />;
      case 'school': return <School className="h-4 w-4" />;
      case 'firm': return <BriefcaseIcon className="h-4 w-4" />;
      case 'university': return <Building2 className="h-4 w-4" />;
      default: return <UserIcon className="h-4 w-4" />;
    }
  };

  const getRoleColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'student': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'school': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'firm': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      case 'university': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-primary-500 to-primary-600 dark:from-primary-600 dark:to-primary-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center">
                <UserIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {isEditing ? 'Edit User' : 'User Details'}
                </h2>
                <p className="text-primary-100 text-sm">
                  User ID: {user.uid.substring(0, 8)}...
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {!isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 text-white rounded-lg transition-colors"
                >
                  <Edit2 className="h-4 w-4" />
                  Edit
                </button>
              )}
              <button
                onClick={onClose}
                className="p-2 hover:bg-white/20 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-white" />
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          <div className="p-6">
            {/* Basic Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
              {/* Profile Info */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <div className="flex items-start gap-4">
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&size=128&background=random`}
                      alt={user.displayName}
                      className="h-24 w-24 rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg"
                    />
                    <div className="flex-1">
                      {isEditing ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Display Name
                            </label>
                            <input
                              type="text"
                              value={editedUser.displayName || ''}
                              onChange={(e) => setEditedUser((prev: Partial<UserType>) => ({ ...prev, displayName: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                              Email
                            </label>
                            <input
                              type="email"
                              value={editedUser.email || ''}
                              onChange={(e) => setEditedUser((prev: Partial<UserType>) => ({ ...prev, email: e.target.value }))}
                              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                            />
                          </div>
                        </div>
                      ) : (
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            {user.displayName || 'No Name'}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-400 mb-4">{user.email}</p>
                          <div className="flex flex-wrap gap-2">
                            <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${getRoleColor(user.role)}`}>
                              {getRoleIcon(user.role)}
                              {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                            </span>
                            {user.approved && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                <CheckCircle className="h-3 w-3" />
                                Approved
                              </span>
                            )}
                            {user.isActive === false && (
                              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                                <UserX className="h-3 w-3" />
                                Inactive
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Account Status */}
              <div className="space-y-4">
                <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                  <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Account Status</h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Status</span>
                      {isEditing ? (
                        <select
                          value={editedUser.isActive === false ? 'inactive' : 'active'}
                          onChange={(e) => setEditedUser((prev: Partial<UserType>) => ({ 
                            ...prev, 
                            isActive: e.target.value === 'active' 
                          }))}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700"
                        >
                          <option value="active">Active</option>
                          <option value="inactive">Inactive</option>
                        </select>
                      ) : (
                        <span className={`text-sm font-medium ${user.isActive === false ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                          {user.isActive === false ? 'Inactive' : 'Active'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Approval</span>
                      {isEditing ? (
                        <select
                          value={editedUser.approved ? 'approved' : editedUser.approvalRequested ? 'pending' : 'none'}
                          onChange={(e) => setEditedUser((prev: Partial<UserType>) => ({ 
                            ...prev, 
                            approved: e.target.value === 'approved',
                            approvalRequested: e.target.value === 'pending'
                          }))}
                          className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1 bg-white dark:bg-gray-700"
                        >
                          <option value="none">Not Requested</option>
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                        </select>
                      ) : (
                        <span className={`text-sm font-medium ${
                          user.approved ? 'text-green-600 dark:text-green-400' : 
                          user.approvalRequested ? 'text-yellow-600 dark:text-yellow-400' : 
                          'text-gray-600 dark:text-gray-400'
                        }`}>
                          {user.approved ? 'Approved' : user.approvalRequested ? 'Pending' : 'Not Requested'}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Created</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(user.createdAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-700 dark:text-gray-300">Last Updated</span>
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {format(new Date(user.updatedAt), 'MMM dd, yyyy')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Info Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
              {/* Contact & Details */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Contact & Details</h4>
                <div className="space-y-4">
                  {isEditing ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          value={editedUser.phoneNumber || ''}
                          onChange={(e) => setEditedUser((prev: Partial<UserType>) => ({ ...prev, phoneNumber: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="+1 (555) 123-4567"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Student ID (if applicable)
                        </label>
                        <input
                          type="text"
                          value={editedUser.studentId || ''}
                          onChange={(e) => setEditedUser((prev: Partial<UserType>) => ({ ...prev, studentId: e.target.value }))}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="STU123456"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Bio
                        </label>
                        <textarea
                          value={editedUser.bio || ''}
                          onChange={(e) => setEditedUser((prev: Partial<UserType>) => ({ ...prev, bio: e.target.value }))}
                          rows={3}
                          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          placeholder="User bio..."
                        />
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="flex items-center gap-3">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">Phone</p>
                          <p className="text-gray-900 dark:text-white">
                            {user.phoneNumber || 'Not provided'}
                          </p>
                        </div>
                      </div>
                      {user.studentId && (
                        <div className="flex items-center gap-3">
                          <BookOpen className="h-5 w-5 text-gray-400" />
                          <div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">Student ID</p>
                            <p className="text-gray-900 dark:text-white">{user.studentId}</p>
                          </div>
                        </div>
                      )}
                      {user.bio && (
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Bio</p>
                          <p className="text-gray-900 dark:text-white text-sm">{user.bio}</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Organization Affiliation */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-6">
                <h4 className="text-sm font-semibold text-gray-600 dark:text-gray-400 mb-4">Organization</h4>
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Role
                      </label>
                      <select
                        value={editedUser.role}
                        onChange={(e) => setEditedUser((prev: Partial<UserType>) => ({ ...prev, role: e.target.value as UserRole }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="user">User</option>
                        <option value="student">Student</option>
                        <option value="school">School</option>
                        <option value="firm">Firm</option>
                        <option value="university">University</option>
                        <option value="admin">Admin</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        Affiliated Organization
                      </label>
                      <select
                        value={editedUser.affiliatedOrganizationId || ''}
                        onChange={(e) => setEditedUser((prev: Partial<UserType>) => ({ ...prev, affiliatedOrganizationId: e.target.value || undefined }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      >
                        <option value="">None</option>
                        {organizations.map(org => (
                          <option key={org.id} value={org.id}>
                            {org.name} ({org.type})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Building className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">Affiliation</p>
                        <p className="text-gray-900 dark:text-white">
                          {user.affiliatedOrganizationId ? 
                            (organizations.find(o => o.id === user.affiliatedOrganizationId)?.name || 'Unknown Organization') : 
                            'Not affiliated'
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Tag className="h-5 w-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">User Type</p>
                        <p className="text-gray-900 dark:text-white capitalize">
                          {user.role}
                          {user.role === 'student' && user.studentId && ` (${user.studentId})`}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            {isEditing && (
              <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const AdminUsersManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserType[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<UserType[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null);
  const [showUserModal, setShowUserModal] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  
  // Chart filters
  const [chartPeriod, setChartPeriod] = useState<string>('all');
  const [chartType, setChartType] = useState<string>('monthly');
  
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    pendingApproval: 0,
    students: 0,
    organizations: 0,
    admins: 0,
    recentGrowth: 0
  });

  // Fetch users
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const [allUsers, allOrgs] = await Promise.all([
        databaseService.getAllUsers(),
        databaseService.getOrganizations()
      ]);
      setUsers(allUsers);
      setOrganizations(allOrgs);
      setFilteredUsers(allUsers);
      calculateStats(allUsers);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate statistics
  const calculateStats = (usersList: UserType[]) => {
    const total = usersList.length;
    const active = usersList.filter(u => u.isActive !== false).length;
    const pendingApproval = usersList.filter(u => u.approvalRequested && !u.approved).length;
    const students = usersList.filter(u => u.role === 'student').length;
    const organizations = usersList.filter(u => ['school', 'firm', 'university'].includes(u.role)).length;
    const admins = usersList.filter(u => u.role === 'admin').length;
    
    // Calculate recent growth (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentUsers = usersList.filter(u => 
      new Date(u.createdAt) > thirtyDaysAgo
    ).length;
    const recentGrowth = total > 0 ? (recentUsers / total) * 100 : 0;

    setStats({
      total,
      active,
      pendingApproval,
      students,
      organizations,
      admins,
      recentGrowth
    });
  };

  // Apply filters
  useEffect(() => {
    let result = [...users];

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(user =>
        user.displayName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.uid.toLowerCase().includes(term) ||
        user.studentId?.toLowerCase().includes(term)
      );
    }

    // Role filter
    if (selectedRole !== 'all') {
      result = result.filter(user => user.role === selectedRole);
    }

    // Status filter
    if (statusFilter !== 'all') {
      switch (statusFilter) {
        case 'active':
          result = result.filter(user => user.isActive !== false);
          break;
        case 'inactive':
          result = result.filter(user => user.isActive === false);
          break;
        case 'approved':
          result = result.filter(user => user.approved);
          break;
        case 'pending':
          result = result.filter(user => user.approvalRequested && !user.approved);
          break;
        case 'rejected':
          result = result.filter(user => user.approvalRequested && user.approved === false);
          break;
      }
    }

    // Date range filter
    if (dateRange !== 'all') {
      const now = new Date();
      let cutoff = new Date();
      
      switch (dateRange) {
        case 'today':
          cutoff = startOfDay(now);
          break;
        case 'week':
          cutoff = subDays(now, 7);
          break;
        case 'month':
          cutoff = subMonths(now, 1);
          break;
        case 'year':
          cutoff = subYears(now, 1);
          break;
      }
      
      result = result.filter(user => new Date(user.createdAt) >= cutoff);
    }

    // Sorting
    result.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'oldest':
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        case 'name':
          return (a.displayName || '').localeCompare(b.displayName || '');
        case 'email':
          return (a.email || '').localeCompare(b.email || '');
        default:
          return 0;
      }
    });

    setFilteredUsers(result);
    setCurrentPage(1); // Reset to first page when filters change
  }, [users, searchTerm, selectedRole, statusFilter, dateRange, sortBy]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // View user details
  const viewUserDetails = (user: UserType) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // Edit user
  const editUser = (user: UserType) => {
    setSelectedUser(user);
    setShowUserModal(true);
  };

  // Save user updates
  const saveUserUpdates = async (updates: Partial<UserType>) => {
    if (!selectedUser) return;
    
    try {
      await databaseService.updateUser(selectedUser.uid, updates);
      await fetchUsers(); // Refresh the user list
      return Promise.resolve();
    } catch (error) {
      console.error('Error updating user:', error);
      return Promise.reject(error);
    }
  };

  // Bulk actions
  const handleBulkAction = async (action: string) => {
    if (selectedUsers.length === 0) {
      toast.error('No users selected');
      return;
    }

    try {
      switch (action) {
        case 'approve':
          await Promise.all(selectedUsers.map(uid =>
            databaseService.updateUser(uid, { approved: true, approvalRequested: false })
          ));
          toast.success(`${selectedUsers.length} users approved`);
          break;
        case 'reject':
          await Promise.all(selectedUsers.map(uid =>
            databaseService.updateUser(uid, { approved: false, approvalRequested: false })
          ));
          toast.success(`${selectedUsers.length} users rejected`);
          break;
        case 'activate':
          await Promise.all(selectedUsers.map(uid =>
            databaseService.updateUser(uid, { isActive: true })
          ));
          toast.success(`${selectedUsers.length} users activated`);
          break;
        case 'deactivate':
          await Promise.all(selectedUsers.map(uid =>
            databaseService.updateUser(uid, { isActive: false })
          ));
          toast.success(`${selectedUsers.length} users deactivated`);
          break;
        case 'delete':
          if (!confirm(`Are you sure you want to delete ${selectedUsers.length} users?`)) return;
          await Promise.all(selectedUsers.map(uid =>
            databaseService.deleteUserData(uid)
          ));
          toast.success(`${selectedUsers.length} users deleted`);
          break;
      }
      
      setSelectedUsers([]);
      setIsBulkActionsOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast.error('Failed to perform action');
    }
  };

  // Toggle user selection
  const toggleUserSelection = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  // Select all users on current page
  const selectAllUsersOnPage = () => {
    const pageUsers = getCurrentPageUsers();
    const pageUserIds = pageUsers.map(u => u.uid);
    
    if (pageUserIds.every(id => selectedUsers.includes(id))) {
      // Deselect all on page
      setSelectedUsers(prev => prev.filter(id => !pageUserIds.includes(id)));
    } else {
      // Select all on page
      setSelectedUsers(prev => [...new Set([...prev, ...pageUserIds])]);
    }
  };

  // Get current page users
  const getCurrentPageUsers = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredUsers.slice(startIndex, endIndex);
  };

  // Calculate total pages
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);

  // Handle page navigation
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Chart data preparation
  const getRoleDistributionData = () => {
    const roles = ['student', 'school', 'firm', 'university', 'admin', 'user'];
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
    
    let filteredUsersForChart = [...users];
    
    // Apply chart period filter
    if (chartPeriod !== 'all') {
      const now = new Date();
      let cutoff = new Date();
      
      switch (chartPeriod) {
        case '30days':
          cutoff = subDays(now, 30);
          break;
        case '90days':
          cutoff = subDays(now, 90);
          break;
        case 'year':
          cutoff = subYears(now, 1);
          break;
      }
      
      filteredUsersForChart = filteredUsersForChart.filter(user => 
        new Date(user.createdAt) >= cutoff
      );
    }
    
    return roles.map((role, index) => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      value: filteredUsersForChart.filter(u => u.role === role).length,
      color: colors[index]
    })).filter(item => item.value > 0);
  };

  const getRegistrationTrendData = () => {
    let data: { period: string; count: number }[] = [];
    const now = new Date();
    const currentYear = now.getFullYear();
    
    if (chartType === 'monthly') {
      // Monthly data for current year
      const months = Array.from({ length: 12 }, (_, i) => {
        const date = new Date(currentYear, i, 1);
        return format(date, 'MMM');
      });
      
      data = months.map(month => ({ period: month, count: 0 }));
      
      users.forEach(user => {
        const userDate = new Date(user.createdAt);
        if (userDate.getFullYear() === currentYear) {
          const month = format(userDate, 'MMM');
          const index = data.findIndex(d => d.period === month);
          if (index !== -1) {
            data[index].count++;
          }
        }
      });
    } else if (chartType === 'weekly') {
      // Last 12 weeks
      data = Array.from({ length: 12 }, (_, i) => {
        const date = subWeeks(now, 11 - i);
        const weekStart = format(date, 'MMM dd');
        const weekEnd = format(subDays(date, 6), 'dd');
        return { period: `${weekStart}-${weekEnd}`, count: 0 };
      });
      
      users.forEach(user => {
        const userDate = new Date(user.createdAt);
        const weeksAgo = Math.floor((now.getTime() - userDate.getTime()) / (7 * 24 * 60 * 60 * 1000));
        if (weeksAgo >= 0 && weeksAgo < 12) {
          data[11 - weeksAgo].count++;
        }
      });
    } else {
      // Daily for last 30 days
      data = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(now, 29 - i);
        return { period: format(date, 'MMM dd'), count: 0 };
      });
      
      users.forEach(user => {
        const userDate = new Date(user.createdAt);
        const daysAgo = Math.floor((now.getTime() - userDate.getTime()) / (24 * 60 * 60 * 1000));
        if (daysAgo >= 0 && daysAgo < 30) {
          data[29 - daysAgo].count++;
        }
      });
    }
    
    return data;
  };

  const getActivityData = () => {
    // Real activity data based on user last login or updatedAt
    const now = new Date();
    const today = startOfDay(now);
    const weekAgo = subDays(now, 7);
    const monthAgo = subMonths(now, 1);
    
    const activeToday = users.filter(user => {
      const updatedAt = new Date(user.updatedAt);
      return updatedAt >= today;
    }).length;
    
    const activeWeek = users.filter(user => {
      const updatedAt = new Date(user.updatedAt);
      return updatedAt >= weekAgo;
    }).length;
    
    const activeMonth = users.filter(user => {
      const updatedAt = new Date(user.updatedAt);
      return updatedAt >= monthAgo;
    }).length;
    
    const inactive = users.filter(user => {
      const updatedAt = new Date(user.updatedAt);
      return updatedAt < monthAgo;
    }).length;
    
    return [
      { period: 'Active Today', users: activeToday },
      { period: 'Active Week', users: activeWeek },
      { period: 'Active Month', users: activeMonth },
      { period: 'Inactive', users: inactive }
    ];
  };

  // Export data to CSV
  const exportToCSV = () => {
    try {
      const headers = ['Name', 'Email', 'Role', 'Status', 'Joined Date', 'Approved', 'Active'];
      const csvData = filteredUsers.map(user => [
        user.displayName || '',
        user.email,
        user.role,
        user.isActive === false ? 'Inactive' : 'Active',
        format(new Date(user.createdAt), 'yyyy-MM-dd'),
        user.approved ? 'Yes' : 'No',
        user.isActive !== false ? 'Yes' : 'No'
      ]);
      
      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `users-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);
      
      toast.success(`Exported ${filteredUsers.length} users to CSV`);
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export data');
    }
  };

  // Approve user
  const approveUser = async (user: UserType) => {
    try {
      await databaseService.updateUser(user.uid, { 
        approved: true, 
        approvalRequested: false 
      });
      toast.success(`User ${user.displayName} approved`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to approve user');
    }
  };

  // Delete user
  const deleteUser = async (user: UserType) => {
    if (!confirm(`Are you sure you want to delete ${user.displayName}? This action cannot be undone.`)) {
      return;
    }
    
    try {
      await databaseService.deleteUserData(user.uid);
      toast.success(`User ${user.displayName} deleted`);
      fetchUsers();
    } catch (error) {
      toast.error('Failed to delete user');
    }
  };

  // Get organization name
  const getOrganizationName = (orgId: string | undefined): string => {
    if (!orgId) return 'None';
    const org = organizations.find(o => o.id === orgId);
    return org?.name || `Org ${orgId.substring(0, 8)}...`;
  };

  // Render user row
  const renderUserRow = (user: UserType) => {
    const isSelected = selectedUsers.includes(user.uid);
    
    return (
      <tr key={user.uid} className={`border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 ${isSelected ? 'bg-primary-50 dark:bg-primary-900/20' : ''}`}>
        <td className="px-6 py-4">
          <div className="flex items-center">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleUserSelection(user.uid)}
              className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
            />
          </div>
        </td>
        <td className="px-6 py-4">
          <div className="flex items-center">
            <div className="h-10 w-10 flex-shrink-0">
              <img
                className="h-10 w-10 rounded-full"
                src={user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName || 'U')}&background=random`}
                alt={user.displayName}
              />
            </div>
            <div className="ml-4">
              <div className="flex items-center gap-2">
                <div className="text-sm font-medium text-gray-900 dark:text-white">
                  {user.displayName || 'No Name'}
                </div>
                {user.approvalRequested && !user.approved && (
                  <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 rounded-full">
                    Pending
                  </span>
                )}
                {user.isActive === false && (
                  <span className="px-2 py-1 text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 rounded-full">
                    Inactive
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {user.email}
              </div>
            </div>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center">
            <div className={`h-2 w-2 rounded-full mr-2 ${
              user.role === 'admin' ? 'bg-purple-500' :
              user.role === 'student' ? 'bg-blue-500' :
              ['school', 'firm', 'university'].includes(user.role) ? 'bg-green-500' :
              'bg-gray-500'
            }`}></div>
            <span className="text-sm text-gray-900 dark:text-white capitalize">
              {user.role}
            </span>
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm text-gray-900 dark:text-white">
            {format(new Date(user.createdAt), 'MMM dd, yyyy')}
          </div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            {format(new Date(user.createdAt), 'HH:mm')}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center gap-2">
            {user.approved ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                <CheckCircle className="w-3 h-3 mr-1" />
                Approved
              </span>
            ) : user.approvalRequested ? (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                <Clock className="w-3 h-3 mr-1" />
                Pending
              </span>
            ) : (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                <UserCheck className="w-3 h-3 mr-1" />
                Basic
              </span>
            )}
            
            {user.isActive === false && (
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                <UserX className="w-3 h-3 mr-1" />
                Inactive
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {user.affiliatedOrganizationId ? getOrganizationName(user.affiliatedOrganizationId) : 'None'}
            </span>
            {user.affiliatedOrganizationId && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {user.affiliations?.length || 1} affiliation{user.affiliations?.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => viewUserDetails(user)}
              className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              title="View Details"
            >
              <Eye className="h-5 w-5" />
            </button>
            <button
              onClick={() => editUser(user)}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Edit User"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            {!user.approved && user.approvalRequested && (
              <button
                onClick={() => approveUser(user)}
                className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                title="Approve User"
              >
                <CheckCircle className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => deleteUser(user)}
              className="text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
              title="Delete User"
            >
              <Trash2 className="h-5 w-5" />
            </button>
          </div>
        </td>
      </tr>
    );
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* User Details/Edit Modal */}
      {showUserModal && selectedUser && (
        <UserDetailsModal
          user={selectedUser}
          organizations={organizations}
          onClose={() => {
            setShowUserModal(false);
            setSelectedUser(null);
          }}
          onSave={saveUserUpdates}
        />
      )}

      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                <Shield className="h-8 w-8 text-primary-500" />
                User Management
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                Manage and monitor all registered users in the system
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchUsers}
                className="inline-flex items-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
              <button 
                onClick={exportToCSV}
                className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
              >
                <Download className="h-4 w-4 mr-2" />
                Export Data
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="flex items-center text-sm">
                <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                <span className="text-green-600 dark:text-green-400 font-medium">
                  +{stats.recentGrowth.toFixed(1)}%
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">last 30 days</span>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.active}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {((stats.active / stats.total) * 100).toFixed(1)}% of total
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Pending Approval</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.pendingApproval}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
            <div className="mt-4">
              <button 
                onClick={() => setStatusFilter('pending')}
                className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium"
              >
                Review all →
              </button>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Students</p>
                <p className="text-3xl font-bold text-gray-900 dark:text-white mt-2">{stats.students}</p>
              </div>
              <div className="h-12 w-12 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <GraduationCap className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {stats.organizations} organizations
              </div>
            </div>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Role Distribution */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <PieChart className="h-5 w-5 text-primary-500" />
                Role Distribution
              </h3>
              <select 
                value={chartPeriod}
                onChange={(e) => setChartPeriod(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="all">All Time</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="year">Last Year</option>
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <RechartsPieChart>
                  <Pie
                    data={getRoleDistributionData()}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {getRoleDistributionData().map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => [`${value} users`, 'Count']} />
                  <Legend />
                </RechartsPieChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Registration Trend */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary-500" />
                Registration Trend
              </h3>
              <select 
                value={chartType}
                onChange={(e) => setChartType(e.target.value)}
                className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="monthly">Monthly</option>
                <option value="weekly">Weekly</option>
                <option value="daily">Daily</option>
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getRegistrationTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis 
                    dataKey="period" 
                    stroke="#9CA3AF"
                    angle={-45}
                    textAnchor="end"
                    height={60}
                  />
                  <YAxis stroke="#9CA3AF" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1F2937', borderColor: '#374151', color: 'white' }}
                    formatter={(value) => [`${value} users`, 'Registrations']}
                  />
                  <Area type="monotone" dataKey="count" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow mb-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search users by name, email, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>
              </div>
              
              <div className="flex flex-wrap gap-3">
                <select
                  value={selectedRole}
                  onChange={(e) => setSelectedRole(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Roles</option>
                  <option value="admin">Admin</option>
                  <option value="student">Student</option>
                  <option value="school">School</option>
                  <option value="firm">Firm</option>
                  <option value="university">University</option>
                  <option value="user">User</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Status</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="approved">Approved</option>
                  <option value="pending">Pending</option>
                  <option value="rejected">Rejected</option>
                </select>

                <select
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                  <option value="week">Last Week</option>
                  <option value="month">Last Month</option>
                  <option value="year">Last Year</option>
                </select>

                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="newest">Newest First</option>
                  <option value="oldest">Oldest First</option>
                  <option value="name">Name A-Z</option>
                  <option value="email">Email A-Z</option>
                </select>

                <select
                  value={itemsPerPage}
                  onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                >
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                  <option value="100">100 per page</option>
                </select>
              </div>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedUsers.length > 0 && (
            <div className="px-6 py-4 bg-primary-50 dark:bg-primary-900/20 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={getCurrentPageUsers().every(u => selectedUsers.includes(u.uid))}
                      onChange={selectAllUsersOnPage}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <span className="ml-3 text-sm font-medium text-gray-900 dark:text-white">
                      {selectedUsers.length} users selected
                    </span>
                  </div>
                  
                  <div className="relative">
                    <button
                      onClick={() => setIsBulkActionsOpen(!isBulkActionsOpen)}
                      className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
                    >
                      Bulk Actions
                      <ChevronDown className="ml-2 h-4 w-4" />
                    </button>
                    
                    {isBulkActionsOpen && (
                      <div className="absolute left-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                        <div className="py-1">
                          <button
                            onClick={() => handleBulkAction('approve')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <div className="flex items-center">
                              <CheckCircle className="h-4 w-4 mr-2 text-green-500" />
                              Approve Selected
                            </div>
                          </button>
                          <button
                            onClick={() => handleBulkAction('reject')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <div className="flex items-center">
                              <XCircle className="h-4 w-4 mr-2 text-red-500" />
                              Reject Selected
                            </div>
                          </button>
                          <button
                            onClick={() => handleBulkAction('activate')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <div className="flex items-center">
                              <UserCheck className="h-4 w-4 mr-2 text-blue-500" />
                              Activate Selected
                            </div>
                          </button>
                          <button
                            onClick={() => handleBulkAction('deactivate')}
                            className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <div className="flex items-center">
                              <UserX className="h-4 w-4 mr-2 text-yellow-500" />
                              Deactivate Selected
                            </div>
                          </button>
                          <div className="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                          <button
                            onClick={() => handleBulkAction('delete')}
                            className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <div className="flex items-center">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Selected
                            </div>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                
                <button
                  onClick={() => setSelectedUsers([])}
                  className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                >
                  Clear selection
                </button>
              </div>
            </div>
          )}

          {/* Users Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-700/50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <input
                      type="checkbox"
                      checked={getCurrentPageUsers().every(u => selectedUsers.includes(u.uid))}
                      onChange={selectAllUsersOnPage}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    User
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Joined
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Organization
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center justify-center">
                        <Users className="h-12 w-12 text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                          No users found
                        </h3>
                        <p className="text-gray-500 dark:text-gray-400">
                          {searchTerm ? 'Try adjusting your search or filters' : 'No users in the system'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getCurrentPageUsers().map(renderUserRow)
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="text-sm text-gray-700 dark:text-gray-400">
                  Showing <span className="font-medium">{(currentPage - 1) * itemsPerPage + 1}</span> to{' '}
                  <span className="font-medium">{Math.min(currentPage * itemsPerPage, filteredUsers.length)}</span> of{' '}
                  <span className="font-medium">{filteredUsers.length}</span> users
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNumber;
                    if (totalPages <= 5) {
                      pageNumber = i + 1;
                    } else if (currentPage <= 3) {
                      pageNumber = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNumber = totalPages - 4 + i;
                    } else {
                      pageNumber = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNumber}
                        onClick={() => goToPage(pageNumber)}
                        className={`px-3 py-1.5 border rounded-lg text-sm font-medium ${
                          currentPage === pageNumber
                            ? 'border-primary-200 dark:border-primary-700 bg-primary-50 dark:bg-primary-900/20 text-primary-700 dark:text-primary-300'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        {pageNumber}
                      </button>
                    );
                  })}
                  
                  {totalPages > 5 && currentPage < totalPages - 2 && (
                    <>
                      <span className="px-2 text-gray-500">...</span>
                      <button
                        onClick={() => goToPage(totalPages)}
                        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                      >
                        {totalPages}
                      </button>
                    </>
                  )}
                  
                  <button 
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">User Activity</h4>
            <div className="space-y-4">
              {getActivityData().map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.period}</span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">{item.users} users</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">Top Organizations</h4>
            <div className="space-y-4">
              {(() => {
                // Get organizations with most affiliated students
                const orgStats: { [key: string]: { count: number; name: string; type?: string } } = {};
                const orgUsers = users.filter(u => u.affiliatedOrganizationId);
                
                users.forEach(user => {
                  if (user.affiliatedOrganizationId) {
                    const orgId = user.affiliatedOrganizationId;
                    const org = organizations.find(o => o.id === orgId);
                    const orgName = org?.name || `Org ${orgId.substring(0, 8)}...`;
                    const orgType = org?.type;
                    
                    if (!orgStats[orgId]) {
                      orgStats[orgId] = { count: 0, name: orgName, type: orgType };
                    }
                    orgStats[orgId].count++;
                  }
                });
                
                const topOrgs = Object.entries(orgStats)
                  .map(([orgId, data]) => ({
                    orgId,
                    count: data.count,
                    name: data.name,
                    type: data.type
                  }))
                  .sort((a, b) => b.count - a.count)
                  .slice(0, 5);
                
                if (topOrgs.length === 0) {
                  return (
                    <div className="text-center py-4">
                      <Building className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        No organizations with members yet
                      </p>
                    </div>
                  );
                }
                
                return topOrgs.map((org, index) => (
                  <div key={org.orgId} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                        {index + 1}.
                      </span>
                      <div className="flex flex-col">
                        <span className="text-sm text-gray-900 dark:text-white font-medium truncate max-w-[120px]">
                          {org.name}
                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {org.type || 'Organization'} • {org.orgId.substring(0, 8)}...
                        </span>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-sm font-semibold text-gray-900 dark:text-white">
                        {org.count} member{org.count !== 1 ? 's' : ''}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {orgUsers.length > 0 ? ((org.count / orgUsers.length) * 100).toFixed(1) : 0}%
                      </span>
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">System Overview</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Total Users</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">{stats.total}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Active Today</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {getActivityData().find(d => d.period === 'Active Today')?.users || 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Pending Approvals</span>
                <span className="text-sm font-medium text-yellow-600 dark:text-yellow-400">{stats.pendingApproval}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">System Health</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">Good</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersManagement;