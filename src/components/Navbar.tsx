import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { 
  Menu, 
  X, 
  Sun, 
  Moon, 
  Calendar, 
  User, 
  LogOut, 
  Settings
} from 'lucide-react';

const Navbar: React.FC = () => {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg shadow-xl transition-colors border-b border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-5">
          <Link to="/" className="flex items-center gap-3 group">
            <Calendar className="h-9 w-9 text-primary-500 group-hover:scale-110 transition-transform duration-200" />
            <span className="text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white group-hover:text-primary-500 transition-colors duration-200">
              EventHub
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-8">
            <Link 
              to="/events" 
              className="nav-link"
            >
              Events
            </Link>
            <Link 
              to="/calendar" 
              className="nav-link"
            >
              Calendar
            </Link>
            <Link 
              to="/past-events" 
              className="nav-link"
            >
              Past Events
            </Link>

            {user ? (
              <div className="flex items-center gap-5">
                {user.role === 'admin' && (
                  <Link 
                    to="/admin"
                    className="nav-link"
                  >
                    Admin
                  </Link>
                )}
                <Link 
                  to="/dashboard"
                  className="nav-link"
                >
                  Dashboard
                </Link>

                <div className="relative group">
                  <button className="flex items-center gap-2 text-gray-700 dark:text-gray-300 hover:text-primary-500 dark:hover:text-primary-400 transition-colors">
                    <User className="h-5 w-5" />
                    <span className="font-semibold">{user.displayName}</span>
                  </button>

                  <div className="absolute right-0 mt-2 w-52 bg-white/95 dark:bg-gray-800/95 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 z-10 border border-gray-100 dark:border-gray-700">
                    <Link 
                      to="/profile" 
                      className="flex items-center px-5 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Profile
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center w-full px-5 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl"
                    >
                      <LogOut className="h-4 w-4 mr-2" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <Link 
                to="/auth" 
                className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-2 rounded-xl font-semibold shadow-md transition-all duration-200"
              >
                Sign In
              </Link>
            )}

            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
          </div>

          <div className="flex items-center gap-2 md:hidden">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </button>
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-xl text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-5 border-t dark:border-gray-700 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-b-xl shadow-xl">
            <div className="flex flex-col gap-5">
              <Link 
                to="/events" 
                className="nav-link"
              >
                Events
              </Link>
              <Link 
                to="/calendar" 
                className="nav-link"
              >
                Calendar
              </Link>
              <Link 
                to="/past-events" 
                className="nav-link"
              >
                Past Events
              </Link>

              {user ? (
                <>
                  <Link 
                    to="/dashboard"
                    className="nav-link"
                  >
                    Dashboard
                  </Link>
                  <Link 
                    to="/profile"
                    className="nav-link"
                  >
                    Profile
                  </Link>
                  <button
                    onClick={handleSignOut}
                    className="nav-link text-left"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <Link 
                  to="/auth" 
                  className="bg-gradient-to-r from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700 text-white px-6 py-2 rounded-xl font-semibold shadow-md transition-all duration-200 text-center"
                >
                  Sign In
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

// Add this to your global CSS or index.css:
// .nav-link {
//   @apply text-gray-700 dark:text-gray-300 font-medium hover:text-primary-500 dark:hover:text-primary-400 px-3 py-2 rounded-xl transition-colors duration-200;
// }

export default Navbar;