import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  LogOut, Moon, Sun, User, ChevronDown, Menu, X, 
  Building, Plus, Users, Globe, Calendar, History, 
  LayoutDashboard, Shield 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import LanguageSwitcher from '../components/LanguageSwitcher';
import RoleBadge from './RoleBadge';
import { useTranslation } from 'react-i18next';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [isEventsOpen, setIsEventsOpen] = useState(false);
  const [isOrganizationsOpen, setIsOrganizationsOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const eventsDropdownRef = useRef<HTMLDivElement>(null);
  const organizationsDropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (eventsDropdownRef.current && !eventsDropdownRef.current.contains(event.target as Node)) {
        setIsEventsOpen(false);
      }
      if (organizationsDropdownRef.current && !organizationsDropdownRef.current.contains(event.target as Node)) {
        setIsOrganizationsOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <nav className="bg-white dark:bg-gray-800 shadow-lg sticky top-0 z-50 border-b border-gray-200 dark:border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link 
            to={user ? "/" : "/"} 
            className="flex items-center gap-3 group transition-transform hover:scale-105"
          >
            <img 
              src="/logo.svg" 
              alt="Burgasys Logo" 
              className="h-10 w-10 transition-transform group-hover:rotate-12"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-primary-500 to-primary-600 bg-clip-text text-transparent">
              Burgasys
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-8">
            {user ? (
              <>
                {/* Events Dropdown */}
                <div className="relative" ref={eventsDropdownRef}>
                  <button
                    onClick={() => setIsEventsOpen(!isEventsOpen)}
                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 font-medium transition-colors group"
                  >
                    <span>{t('navbar.eventsDropdown.title')}</span>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform duration-300 ${
                        isEventsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>
                  

                  {/* Dropdown Menu */}
                  <div
                    className={`absolute left-0 mt-3 w-56 bg-white dark:bg-gray-700 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden transition-all duration-300 origin-top ${
                      isEventsOpen 
                        ? 'opacity-100 visible scale-100 translate-y-0' 
                        : 'opacity-0 invisible scale-95 -translate-y-2'
                    }`}
                  >
                    <Link
                      to="/events"
                      onClick={() => setIsEventsOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors border-b border-gray-100 dark:border-gray-600"
                    >
                      <Users className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{t('navbar.eventsDropdown.browseEvents')}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {t('navbar.eventsDropdown.browseDescription')}
                        </div>
                      </div>
                    </Link>

                    <Link
                      to="/map"
                      onClick={() => setIsEventsOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors border-b border-gray-100 dark:border-gray-600"
                    >
                      <Globe className="w-4 h-4" />
                      <div>
                        <div className="font-medium">Map Explorer</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          Explore events on map
                        </div>
                      </div>
                    </Link>
                    
                    <Link
                      to="/calendar"
                      onClick={() => setIsEventsOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors border-b border-gray-100 dark:border-gray-600"
                    >
                      <Calendar className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{t('navbar.eventsDropdown.calendarView')}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {t('navbar.eventsDropdown.calendarDescription')}
                        </div>
                      </div>
                    </Link>
                    
                    <Link
                      to="/past-events"
                      onClick={() => setIsEventsOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <History className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{t('navbar.eventsDropdown.pastEvents')}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {t('navbar.eventsDropdown.pastDescription')}
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>

                {/* Organizations Dropdown */}
                <div className="relative" ref={organizationsDropdownRef}>
                  <button
                    onClick={() => setIsOrganizationsOpen(!isOrganizationsOpen)}
                    className="flex items-center gap-1 text-gray-700 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 font-medium transition-colors group"
                  >
                    <Building className="w-4 h-4" />
                    <span>{t('navigation.organizations')}</span>
                    <ChevronDown 
                      className={`h-4 w-4 transition-transform duration-300 ${
                        isOrganizationsOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown Menu */}
                  <div
                    className={`absolute left-0 mt-3 w-56 bg-white dark:bg-gray-700 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden transition-all duration-300 origin-top ${
                      isOrganizationsOpen 
                        ? 'opacity-100 visible scale-100 translate-y-0' 
                        : 'opacity-0 invisible scale-95 -translate-y-2'
                    }`}
                  >
                    <Link
                      to="/organizations"
                      onClick={() => setIsOrganizationsOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors border-b border-gray-100 dark:border-gray-600"
                    >
                      <Users className="w-4 h-4" />
                      <div>
                        <div className="font-medium">{t('navbar.organizationsDropdown.browseOrganizations')}</div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          {t('navbar.organizationsDropdown.browseDescription')}
                        </div>
                      </div>
                    </Link>
                    
                    {user && ['admin', 'school', 'university', 'firm'].includes(user.role) && (
                      <Link
                        to="/organizations/create"
                        onClick={() => setIsOrganizationsOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        <div>
                          <div className="font-medium">{t('navbar.organizationsDropdown.createOrganization')}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {t('navbar.organizationsDropdown.createDescription')}
                          </div>
                        </div>
                      </Link>
                    )}
                  </div>
                </div>
              </>
            ) : (
              <Link
                to="/"
                className="text-gray-700 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 font-medium transition-colors relative group"
              >
                {t('navigation.home')}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary-500 transition-all duration-300 group-hover:w-full"></span>
              </Link>
            )}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 text-gray-500 dark:text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-all"
              title={theme === 'dark' ? t('navbar.themeToggle.lightMode') : t('navbar.themeToggle.darkMode')}
            >
              {theme === 'dark' ? (
                <Sun className="h-5 w-5 transition-transform hover:rotate-180 duration-500" />
              ) : (
                <Moon className="h-5 w-5 transition-transform hover:-rotate-12 duration-300" />
              )}
            </button>

            <LanguageSwitcher />

            {user ? (
              <div className="hidden md:flex items-center gap-4">
                <RoleBadge role={user.role} size="sm" />
                
                {/* User Menu */}
                <div className="relative" ref={userMenuRef}>
                  <button 
                    onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                    className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:opacity-80 transition-opacity"
                  >
                    <img
                      src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}`}
                      alt={user.displayName}
                      className="w-9 h-9 rounded-full ring-2 ring-primary-500 ring-offset-2 dark:ring-offset-gray-800 transition-all hover:ring-4"
                    />
                  </button>

                  <div
                    className={`absolute right-0 mt-3 w-56 bg-white dark:bg-gray-700 rounded-xl shadow-xl border border-gray-200 dark:border-gray-600 overflow-hidden transition-all duration-300 origin-top-right ${
                      isUserMenuOpen 
                        ? 'opacity-100 visible scale-100 translate-y-0' 
                        : 'opacity-0 invisible scale-95 -translate-y-2'
                    }`}
                  >
                    <div className="px-4 py-3 border-b dark:border-gray-600 bg-gradient-to-r from-primary-50 to-primary-100 dark:from-gray-600 dark:to-gray-600">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                        {user.displayName}
                      </p>
                      <p className="text-xs text-gray-600 dark:text-gray-300 truncate">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      to="/dashboard"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      {t('navbar.userMenu.dashboard')}
                    </Link>
                    
                    <Link
                      to="/profile"
                      onClick={() => setIsUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                    >
                      <User className="w-4 h-4" />
                      {t('navbar.userMenu.profile')}
                    </Link>

                    {user.role === 'admin' && (
                      <Link
                        to="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-gray-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors border-t border-gray-100 dark:border-gray-600"
                      >
                        <Shield className="w-4 h-4" />
                        {t('navbar.userMenu.adminPanel')}
                      </Link>
                    )}

                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        handleSignOut();
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-600"
                    >
                      <LogOut className="w-4 h-4" />
                      {t('navigation.signOut')}
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link
                to="/auth"
                className="hidden md:flex items-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-5 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
              >
                <User className="w-4 h-4" />
                {t('navigation.signIn')}
              </Link>
            )}

            {/* Mobile menu button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden p-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <div
          className={`md:hidden overflow-hidden transition-all duration-300 ${
            isMobileMenuOpen ? 'max-h-screen opacity-100 pb-4' : 'max-h-0 opacity-0'
          }`}
        >
          {user ? (
            <div className="flex flex-col gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
              {/* Events Section */}
              <div className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                {t('navbar.eventsDropdown.title')}
              </div>
              <Link
                to="/events"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                {t('navbar.eventsDropdown.browseEvents')}
              </Link>
              
              <Link
                to="/map"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Globe className="w-4 h-4" />
                Map Explorer
              </Link>
              
              <Link
                to="/calendar"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Calendar className="w-4 h-4" />
                {t('navbar.eventsDropdown.calendarView')}
              </Link>
              
              <Link
                to="/past-events"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <History className="w-4 h-4" />
                {t('navbar.eventsDropdown.pastEvents')}
              </Link>

              {/* Organizations Section */}
              <div className="px-4 py-2 text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mt-2">
                {t('navigation.organizations')}
              </div>
              <Link
                to="/organizations"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <Users className="w-4 h-4" />
                {t('navbar.organizationsDropdown.browseOrganizations')}
              </Link>

              {user && ['admin', 'school', 'university', 'firm'].includes(user.role) && (
                <Link
                  to="/organizations/create"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Plus className="w-4 h-4" />
                  {t('navbar.organizationsDropdown.createOrganization')}
                </Link>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 my-2"></div>

              <div className="px-4 py-2">
                <RoleBadge role={user.role} size="sm" />
              </div>

              <Link
                to="/dashboard"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <LayoutDashboard className="w-4 h-4" />
                {t('navbar.userMenu.dashboard')}
              </Link>

              <Link
                to="/profile"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <User className="w-4 h-4" />
                {t('navbar.userMenu.profile')}
              </Link>

              {user.role === 'admin' && (
                <Link
                  to="/admin"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2 px-4 py-2.5 text-gray-700 dark:text-gray-300 hover:bg-primary-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Shield className="w-4 h-4" />
                  {t('navbar.userMenu.adminPanel')}
                </Link>
              )}

              <button
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  handleSignOut();
                }}
                className="flex items-center gap-2 px-4 py-2.5 text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                {t('navigation.signOut')}
              </button>
            </div>
          ) : (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <Link
                to="/auth"
                onClick={() => setIsMobileMenuOpen(false)}
                className="flex items-center justify-center gap-2 bg-gradient-to-r from-primary-500 to-primary-600 text-white px-5 py-2.5 rounded-lg transition-all shadow-md hover:shadow-lg mx-4"
              >
                <User className="w-4 h-4" />
                {t('navigation.signIn')}
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;