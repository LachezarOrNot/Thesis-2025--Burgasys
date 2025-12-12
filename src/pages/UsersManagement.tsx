// src/pages/admin/UsersManagement.tsx
import React, { useState, useEffect, useCallback } from 'react';
import { 
  Search, Filter, Download, Eye, Edit2, Shield, Trash2, 
  UserCheck, UserX, ChevronDown, MoreVertical, RefreshCw,
  Users, TrendingUp, BarChart3, PieChart, Activity,
  CheckCircle, XCircle, Clock, Mail, Phone, Globe,
  Calendar, Tag, Building, GraduationCap, Briefcase,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { databaseService } from '../services/database';
import { User, UserRole } from '../types';
import {
  BarChart, Bar, PieChart as RechartsPieChart, Pie, Cell,
  LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ComposedChart, Scatter
} from 'recharts';
import { format } from 'date-fns';
import toast from 'react-hot-toast';

const AdminUsersManagement: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [isBulkActionsOpen, setIsBulkActionsOpen] = useState(false);
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
      const allUsers = await databaseService.getAllUsers();
      setUsers(allUsers);
      setFilteredUsers(allUsers);
      calculateStats(allUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  }, []);

  // Calculate statistics
  const calculateStats = (usersList: User[]) => {
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
      const cutoff = new Date();
      
      switch (dateRange) {
        case 'today':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case 'week':
          cutoff.setDate(now.getDate() - 7);
          break;
        case 'month':
          cutoff.setMonth(now.getMonth() - 1);
          break;
        case 'year':
          cutoff.setFullYear(now.getFullYear() - 1);
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
  }, [users, searchTerm, selectedRole, statusFilter, dateRange, sortBy]);

  // Initial fetch
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

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

  // Select all users
  const selectAllUsers = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.uid));
    }
  };

  // Chart data preparation
  const getRoleDistributionData = () => {
    const roles = ['student', 'school', 'firm', 'university', 'admin', 'user'];
    const colors = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];
    
    return roles.map((role, index) => ({
      name: role.charAt(0).toUpperCase() + role.slice(1),
      value: users.filter(u => u.role === role).length,
      color: colors[index]
    })).filter(item => item.value > 0);
  };

  const getRegistrationTrendData = () => {
    const months = Array.from({ length: 12 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (11 - i));
      return format(date, 'MMM');
    });
    
    const currentYear = new Date().getFullYear();
    const monthlyCounts = months.map(month => ({ month, count: 0 }));
    
    users.forEach(user => {
      const userDate = new Date(user.createdAt);
      if (userDate.getFullYear() === currentYear) {
        const month = format(userDate, 'MMM');
        const index = monthlyCounts.findIndex(m => m.month === month);
        if (index !== -1) {
          monthlyCounts[index].count++;
        }
      }
    });
    
    return monthlyCounts;
  };

  const getActivityData = () => {
    const periods = ['Active Today', 'Active Week', 'Active Month', 'Inactive'];
    // This would need actual activity tracking - using placeholder for now
    return periods.map(period => ({
      period,
      users: Math.floor(Math.random() * 100) + 10
    }));
  };

  // Render user row
  const renderUserRow = (user: User) => {
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
        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
          {user.affiliations?.length || 0} orgs
        </td>
        <td className="px-6 py-4 whitespace-nowrap">
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {/* View details */}}
              className="text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
              title="View Details"
            >
              <Eye className="h-5 w-5" />
            </button>
            <button
              onClick={() => {/* Edit user */}}
              className="text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              title="Edit User"
            >
              <Edit2 className="h-5 w-5" />
            </button>
            {!user.approved && user.approvalRequested && (
              <button
                onClick={async () => {
                  try {
                    await databaseService.updateUser(user.uid, { approved: true, approvalRequested: false });
                    toast.success('User approved');
                    fetchUsers();
                  } catch (error) {
                    toast.error('Failed to approve user');
                  }
                }}
                className="text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                title="Approve User"
              >
                <CheckCircle className="h-5 w-5" />
              </button>
            )}
            <button
              onClick={() => {
                if (confirm(`Are you sure you want to delete ${user.displayName}?`)) {
                  databaseService.deleteUserData(user.uid)
                    .then(() => {
                      toast.success('User deleted');
                      fetchUsers();
                    })
                    .catch(() => toast.error('Failed to delete user'));
                }
              }}
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
              <button className="inline-flex items-center px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors">
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
              <button className="text-sm text-primary-600 dark:text-primary-400 hover:underline font-medium">
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
              <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>All Time</option>
                <option>Last 30 Days</option>
                <option>Last Year</option>
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
                Registration Trend (2024)
              </h3>
              <select className="text-sm border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-1.5 bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Monthly</option>
                <option>Weekly</option>
                <option>Daily</option>
              </select>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={getRegistrationTrendData()}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                  <XAxis dataKey="month" stroke="#9CA3AF" />
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

                <button className="inline-flex items-center px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <Filter className="h-4 w-4 mr-2" />
                  More Filters
                </button>
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
                      checked={selectedUsers.length === filteredUsers.length}
                      onChange={selectAllUsers}
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
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={selectAllUsers}
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
                    Affiliations
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
                  filteredUsers.map(renderUserRow)
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {filteredUsers.length > 0 && (
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700 dark:text-gray-400">
                  Showing <span className="font-medium">1</span> to <span className="font-medium">{Math.min(filteredUsers.length, 10)}</span> of{' '}
                  <span className="font-medium">{filteredUsers.length}</span> users
                </div>
                <div className="flex items-center space-x-2">
                  <button className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
                    Previous
                  </button>
                  <button className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 bg-primary-50 dark:bg-primary-900/20 border-primary-200 dark:border-primary-700 text-primary-700 dark:text-primary-300">
                    1
                  </button>
                  <button className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    2
                  </button>
                  <button className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    3
                  </button>
                  <button className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">
                    Next
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
              {users
                .filter(u => ['school', 'firm', 'university'].includes(u.role))
                .slice(0, 5)
                .map((orgUser, index) => (
                  <div key={orgUser.uid} className="flex items-center justify-between">
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-900 dark:text-white mr-2">
                        {index + 1}.
                      </span>
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate">
                        {orgUser.displayName}
                      </span>
                    </div>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {orgUser.affiliations?.length || 0} members
                    </span>
                  </div>
                ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-6">
            <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-4">System Overview</h4>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Total Storage</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">2.4 GB</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">API Calls (24h)</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">1,234</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">Avg. Response Time</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">128ms</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700 dark:text-gray-300">System Load</span>
                <span className="text-sm font-medium text-green-600 dark:text-green-400">42%</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsersManagement;