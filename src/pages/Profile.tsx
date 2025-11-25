import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Mail, 
  Phone, 
  Calendar, 
  Shield, 
  Trash2, 
  Eye,
  EyeOff,
  Key,
  LogOut,
  Save,
  Edit,
  X,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Profile: React.FC = () => {
  const { user, updateUserProfile, deleteUserAccount, signOut, changePassword, reauthenticate } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteOption, setDeleteOption] = useState<'soft' | 'hard'>('soft');
  const [passwordForDeletion, setPasswordForDeletion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    phoneNumber: user?.phoneNumber || '',
    bio: user?.bio || ''
  });
  
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  // Calculate disabled states
  const isDeleteButtonDisabled = loading;
  const isCancelButtonDisabled = loading;
  const isConfirmDeleteDisabled = Boolean(
    loading || ((deleteOption === 'hard' || user?.email) && !passwordForDeletion)
  );
  const isChangePasswordDisabled = loading;

  const handleSaveProfile = async () => {
    try {
      setLoading(true);
      setError('');
      await updateUserProfile(formData);
      setIsEditing(false);
      setSuccess(t('profile.profileUpdated'));
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(t('profile.updateFailed'));
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    // Validation
    if (!passwordData.currentPassword) {
      setError(t('profile.enterCurrentPassword'));
      return;
    }
    
    if (!passwordData.newPassword) {
      setError(t('profile.enterNewPassword'));
      return;
    }
    
    if (passwordData.newPassword.length < 6) {
      setError(t('profile.passwordTooShort'));
      return;
    }
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setError(t('profile.passwordsDontMatch'));
      return;
    }

    try {
      setLoading(true);
      setError('');
      setSuccess('');
      
      // Reauthenticate user first (required by Firebase)
      await reauthenticate(passwordData.currentPassword);
      
      // Change password
      await changePassword(passwordData.newPassword);
      
      // Reset form
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setSuccess(t('profile.passwordChanged'));
      
    } catch (error: any) {
      console.error('Error changing password:', error);
      
      // Handle specific Firebase errors
      switch (error.code) {
        case 'auth/wrong-password':
          setError(t('profile.incorrectPassword'));
          break;
        case 'auth/weak-password':
          setError(t('profile.weakPassword'));
          break;
        case 'auth/requires-recent-login':
          setError(t('profile.reauthenticateRequired'));
          await signOut();
          navigate('/login');
          break;
        default:
          setError(error.message || t('profile.passwordChangeFailed'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      // For hard delete or password-protected accounts, require password
      const password = deleteOption === 'hard' || user?.email ? passwordForDeletion : undefined;

      await deleteUserAccount(password, deleteOption === 'soft');
      
      if (deleteOption === 'soft') {
        setSuccess(t('profile.accountScheduledForDeletion'));
        setTimeout(() => {
          navigate('/');
        }, 3000);
      } else {
        navigate('/');
      }
    } catch (error: any) {
      console.error('Error deleting account:', error);
      
      if (error.code === 'auth/requires-recent-login') {
        setError(t('profile.reauthenticateForDeletion'));
        await signOut();
        navigate('/login');
      } else if (error.message === 'No user logged in') {
        setError(t('profile.noUserLoggedIn'));
      } else if (error.message.includes('Invalid password')) {
        setError(t('profile.invalidPassword'));
      } else {
        setError(error.message || t('profile.deleteFailed'));
      }
    } finally {
      setLoading(false);
      setShowDeleteConfirm(false);
      setPasswordForDeletion('');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
      setError(t('profile.signOutFailed'));
    }
  };

  const clearMessages = () => {
    setError('');
    setSuccess('');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
            {t('profile.noUserLoggedIn')}
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            {t('profile.pleaseLogIn')}
          </p>
        </div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: t('profile.tabs.profile'), icon: User },
    { id: 'security', label: t('profile.tabs.security'), icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Success Message */}
        {success && (
          <div className="mb-6 rounded-lg p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-800 dark:text-green-200">
            <p>{success}</p>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 rounded-lg p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-800 dark:text-red-200">
            <p>{error}</p>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar */}
          <div className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
              <div className="text-center mb-6">
                <div className="w-20 h-20 bg-primary-500 rounded-full flex items-center justify-center mx-auto mb-4">
                  <User className="w-10 h-10 text-white" />
                </div>
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {user.displayName}
                </h2>
                <p className="text-sm text-gray-500 dark:text-gray-400 capitalize">
                  {t(`roles.${user.role}`)}
                </p>
              </div>

              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        clearMessages();
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        activeTab === tab.id
                          ? 'bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 border-l-4 border-primary-500'
                          : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{tab.label}</span>
                    </button>
                  );
                })}
              </nav>

              {/* Sign Out Button */}
              <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span className="font-medium">{t('profile.signOut')}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {/* Profile Tab */}
            {activeTab === 'profile' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {t('profile.profileInformation')}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {t('profile.managePersonalInfo')}
                    </p>
                  </div>
                  <div className="flex gap-3">
                    {isEditing ? (
                      <>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="flex items-center gap-2 px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors"
                        >
                          <X className="w-4 h-4" />
                          {t('common.cancel')}
                        </button>
                        <button
                          onClick={handleSaveProfile}
                          disabled={loading}
                          className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50"
                        >
                          <Save className="w-4 h-4" />
                          {loading ? t('common.loading') : t('common.save')}
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-4 py-2 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                        {t('profile.editProfile')}
                      </button>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t('profile.displayName')}
                      </label>
                      {isEditing ? (
                        <input
                          type="text"
                          value={formData.displayName}
                          onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white text-lg">{user.displayName}</p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Mail className="w-4 h-4 inline mr-2" />
                        {t('profile.emailAddress')}
                      </label>
                      <p className="text-gray-900 dark:text-white text-lg">{user.email}</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Phone className="w-4 h-4 inline mr-2" />
                        {t('profile.phoneNumber')}
                      </label>
                      {isEditing ? (
                        <input
                          type="tel"
                          value={formData.phoneNumber}
                          onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                          placeholder={t('profile.phonePlaceholder')}
                        />
                      ) : (
                        <p className="text-gray-900 dark:text-white text-lg">
                          {user.phoneNumber || t('profile.notProvided')}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <Calendar className="w-4 h-4 inline mr-2" />
                        {t('profile.memberSince')}
                      </label>
                      <p className="text-gray-900 dark:text-white text-lg">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('profile.bio')}
                    </label>
                    {isEditing ? (
                      <textarea
                        value={formData.bio}
                        onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                        rows={4}
                        className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        placeholder={t('profile.bioPlaceholder')}
                      />
                    ) : (
                      <p className="text-gray-900 dark:text-white text-lg">
                        {user.bio || t('profile.noBioProvided')}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
                  {t('profile.security')}
                </h2>
                
                <div className="space-y-6">
                  {/* Password Change Section */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                      {t('profile.changePassword')}
                    </h3>
                    <div className="space-y-4 max-w-md">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.currentPassword')}
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.current ? "text" : "password"}
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white pr-12"
                            placeholder={t('profile.enterCurrentPassword')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, current: !prev.current }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showPasswords.current ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.newPassword')}
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.new ? "text" : "password"}
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white pr-12"
                            placeholder={t('profile.enterNewPassword')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, new: !prev.new }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showPasswords.new ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t('profile.confirmNewPassword')}
                        </label>
                        <div className="relative">
                          <input
                            type={showPasswords.confirm ? "text" : "password"}
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white pr-12"
                            placeholder={t('profile.confirmNewPassword')}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswords(prev => ({ ...prev, confirm: !prev.confirm }))}
                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                          >
                            {showPasswords.confirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                          </button>
                        </div>
                      </div>

                      <button
                        onClick={handleChangePassword}
                        disabled={isChangePasswordDisabled}
                        className="flex items-center gap-2 bg-primary-500 hover:bg-primary-600 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Key className="w-4 h-4" />
                        {loading ? t('profile.changingPassword') : t('profile.changePassword')}
                      </button>
                    </div>
                  </div>

                  {/* Delete Account Section */}
                  <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                    <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 mb-4">
                      {t('profile.dangerZone')}
                    </h3>
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-semibold text-red-800 dark:text-red-300">
                            {t('profile.deleteAccount')}
                          </h4>
                          <p className="text-red-600 dark:text-red-400 text-sm mt-1">
                            {t('profile.deleteAccountDescription')}
                          </p>
                        </div>
                        <button
                          onClick={() => setShowDeleteConfirm(true)}
                          disabled={isDeleteButtonDisabled}
                          className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Trash2 className="w-4 h-4" />
                          {t('profile.deleteAccount')}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <Trash2 className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                {t('profile.deleteAccount')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {t('profile.chooseDeleteOption')}
              </p>
            </div>

            {/* Delete Options */}
            <div className="space-y-4 mb-6">
              {/* Soft Delete Option */}
              <label className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input
                  type="radio"
                  name="deleteOption"
                  value="soft"
                  checked={deleteOption === 'soft'}
                  onChange={(e) => setDeleteOption(e.target.value as 'soft' | 'hard')}
                  className="mt-1 text-primary-500 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="w-4 h-4 text-blue-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {t('profile.softDelete')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('profile.softDeleteDescription')}
                  </p>
                </div>
              </label>

              {/* Hard Delete Option */}
              <label className="flex items-start gap-3 p-4 border border-gray-200 dark:border-gray-600 rounded-lg cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <input
                  type="radio"
                  name="deleteOption"
                  value="hard"
                  checked={deleteOption === 'hard'}
                  onChange={(e) => setDeleteOption(e.target.value as 'soft' | 'hard')}
                  className="mt-1 text-primary-500 focus:ring-primary-500"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <AlertTriangle className="w-4 h-4 text-red-500" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {t('profile.hardDelete')}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {t('profile.hardDeleteDescription')}
                  </p>
                </div>
              </label>
            </div>

            {/* Password Input for Hard Delete */}
            {(deleteOption === 'hard' || user?.email) && (
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t('profile.enterPasswordToConfirm')}
                </label>
                <input
                  type="password"
                  value={passwordForDeletion}
                  onChange={(e) => setPasswordForDeletion(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                  placeholder={t('profile.enterYourPassword')}
                />
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteOption('soft');
                  setPasswordForDeletion('');
                }}
                disabled={isCancelButtonDisabled}
                className="px-6 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 transition-colors disabled:opacity-50"
              >
                {t('common.cancel')}
              </button>
              <button
                onClick={handleDeleteAccount}
                disabled={isConfirmDeleteDisabled}
                className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? t('profile.deleting') : `${t('profile.deleteAccount')} ${deleteOption === 'soft' ? t('profile.inDays') : t('profile.now')}`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;