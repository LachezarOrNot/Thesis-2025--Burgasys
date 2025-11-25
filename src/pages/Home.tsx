import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Calendar, Users, MapPin, ArrowRight, Sparkles } from 'lucide-react';
import Spline from '@splinetool/react-spline';
import EventCard from '../components/EventCard';
import { Event } from '../types';
import { databaseService } from '../services/database';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTranslation } from 'react-i18next';

const Home: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();

  useEffect(() => {
    loadEvents();
    setIsVisible(true);
  }, []);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const eventsData = await databaseService.getEvents({ 
        status: 'published' 
      });
      setEvents(eventsData);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const featuredEvents = events
    .filter(event => new Date(event.start_datetime) > new Date())
    .slice(0, 6);

  const stats = [
    { icon: Calendar, label: t('home.stats.events'), value: events.length },
    { icon: Users, label: t('home.stats.participants'), value: '10K+' },
    { icon: MapPin, label: t('home.stats.locations'), value: '50+' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Animated Background Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
        <div className="absolute top-40 right-10 w-72 h-72 bg-blue-300 dark:bg-blue-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-8 left-1/2 w-72 h-72 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-50px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.6s ease-out forwards;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out forwards;
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .glass-effect {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.3);
        }
        .dark .glass-effect {
          background: rgba(31, 41, 55, 0.8);
          border: 1px solid rgba(75, 85, 99, 0.3);
        }
        .gradient-text {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .hover-lift {
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .hover-lift:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
      `}</style>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-28 overflow-hidden">
        <div className="container mx-auto px-4 text-center relative z-10">
          {/* Top Tag */}
          <div className={`${isVisible ? 'animate-fadeInUp' : 'opacity-0'}`}>
            <div className="inline-flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-full mb-6 animate-float">
              <Sparkles className="w-4 h-4" />
              <span className="text-sm font-semibold pointer-events-none">
                {t('home.hero.tagline')}
              </span>
            </div>
          </div>

          <div className="absolute inset-0 flex justify-center items-center z-20">
            <Spline
              scene="https://prod.spline.design/ICLl4udbkAVJcMpB/scene.splinecode"
              style={{
                width: '200%',
                height: '200%',
                zIndex: 90,
              }}
            />
          </div>

          {/* Hero Title */}
          <h1
            className={`relative text-5xl md:text-6xl lg:text-7xl font-bold mb-6 z-30 pointer-events-none ${
              isVisible ? 'animate-fadeInUp delay-100' : 'opacity-0'
            }`}
          >
            <span className="gradient-text pointer-events-none">
              {t('home.hero.titlePart1')}
            </span>
            <br />
            <span className="text-gray-900 dark:text-white pointer-events-none">
              {t('home.hero.titlePart2')}
            </span>
          </h1>

          {/* Hero Description */}
          <p
            className={`relative text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed z-30 pointer-events-none ${
              isVisible ? 'animate-fadeInUp delay-200' : 'opacity-0 pointer-events-none'
            }`}
          >
            {t('home.hero.description')}
          </p>

          {/* Search Bar */}
          <div
            className={`max-w-2xl mx-auto relative z-30 ${
              isVisible ? 'animate-scaleIn delay-300' : 'opacity-0'
            }`}
          >
            <div className="glass-effect rounded-2xl p-3 shadow-2xl hover-lift">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="flex-1 relative">
                  <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder={t('home.hero.searchPlaceholder')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-12 pr-4 py-4 text-gray-900 dark:text-white bg-white dark:bg-gray-800 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all"
                  />
                </div>
                <button
                  onClick={loadEvents}
                  className="bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {t('home.hero.searchButton')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`glass-effect rounded-2xl p-8 text-center hover-lift ${isVisible ? `animate-fadeInUp delay-${(index + 4) * 100}` : 'opacity-0'}`}
              >
                <div className="bg-gradient-to-br from-primary-500 to-purple-600 w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <stat.icon className="w-8 h-8 text-white" />
                </div>
                <div className="text-4xl font-bold text-gray-900 dark:text-white mb-2">
                  {stat.value}
                </div>
                <div className="text-gray-600 dark:text-gray-400 font-medium">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="py-16 relative z-10">
        <div className="container mx-auto px-4">
          <div className={`flex flex-col sm:flex-row items-center justify-between mb-12 ${isVisible ? 'animate-slideInLeft delay-700' : 'opacity-0'}`}>
            <div className="text-center sm:text-left mb-6 sm:mb-0">
              <h2 className="text-4xl font-bold text-gray-900 dark:text-white mb-3">
                {t('home.featuredEvents.title')}
              </h2>
              <p className="text-lg text-gray-600 dark:text-gray-400">
                {t('home.featuredEvents.subtitle')}
              </p>
            </div>
            <Link 
              to="/events"
              className="group bg-gradient-to-r from-primary-500 to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-semibold transition-all duration-300 flex items-center gap-2 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              {t('home.featuredEvents.viewAll')}
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <LoadingSpinner />
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredEvents.map((event, index) => (
                <div 
                  key={event.id}
                  className={`${isVisible ? `animate-scaleIn delay-${(index % 3 + 8) * 100}` : 'opacity-0'}`}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-effect rounded-2xl p-16 text-center">
              <div className="bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-6">
                <Calendar className="w-16 h-16 text-gray-400 dark:text-gray-500" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 dark:text-white mb-3">
                {t('home.featuredEvents.noEvents.title')}
              </h3>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t('home.featuredEvents.noEvents.description')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative z-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary-600 via-purple-600 to-pink-600"></div>
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0zNiAxOGMzLjMxNCAwIDYgMi42ODYgNiA2cy0yLjY4NiA2LTYgNi02LTIuNjg2LTYtNiAyLjY4Ni02IDYtNnoiIHN0cm9rZT0iI2ZmZiIgc3Ryb2tlLW9wYWNpdHk9Ii4xIi8+PC9nPjwvc3ZnPg==')] opacity-10"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <h2 className="text-4xl md:text-5xl font-bold mb-6 text-white">
            {t('home.cta.title')}
          </h2>
          <p className="text-xl md:text-2xl mb-10 max-w-2xl mx-auto text-white/90">
            {t('home.cta.description')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/auth"
              className="group bg-white text-primary-600 hover:bg-gray-50 px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              {t('home.cta.signUp')}
            </Link>
            <Link 
              to="/events"
              className="group border-2 border-white text-white hover:bg-white hover:text-primary-600 px-10 py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:scale-105"
            >
              {t('home.cta.browseEvents')}
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;