import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Calendar, Users, MapPin, ArrowRight, Sparkles, Star, TrendingUp, Zap } from 'lucide-react';
import EventCard from '../components/EventCard';
import { Event } from '../types';
import { databaseService } from '../services/database';
import LoadingSpinner from '../components/LoadingSpinner';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';

const Home: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

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

  // Derived dynamic stats for CTA section
  const uniqueRegisteredUsers = new Set<string>();
  events.forEach(event => {
    event.registeredUsers?.forEach(uid => uniqueRegisteredUsers.add(uid));
  });
  const activeParticipants = uniqueRegisteredUsers.size;

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
  const monthlyEvents = events.filter(event => {
    try {
      const d = new Date(event.start_datetime);
      return d >= startOfMonth && d <= endOfMonth;
    } catch {
      return false;
    }
  }).length;

  const uniqueOrganisers = new Set<string>();
  events.forEach(event => {
    if (event.organiser_org_id) {
      uniqueOrganisers.add(event.organiser_org_id);
    }
  });
  const activeOrganisers = uniqueOrganisers.size;

  const formatStatNumber = (value: number) => {
    if (value >= 1000) {
      const short = value / 1000;
      return `${short.toFixed(short % 1 === 0 ? 0 : 1)}K+`;
    }
    return value.toString();
  };

  const stats = [
    { icon: Calendar, label: t('home.stats.events'), value: events.length, color: 'from-blue-500 to-cyan-500' },
    { icon: Users, label: t('home.stats.participants'), value: '10K+', color: 'from-purple-500 to-pink-500' },
    { icon: MapPin, label: t('home.stats.locations'), value: '50+', color: 'from-orange-500 to-red-500' },
  ];

  const features = [
    { 
      icon: Star, 
      title: t('home.features.curated.title'), 
      description: t('home.features.curated.description') 
    },
    { 
      icon: TrendingUp, 
      title: t('home.features.realtime.title'), 
      description: t('home.features.realtime.description') 
    },
    { 
      icon: Zap, 
      title: t('home.features.instant.title'), 
      description: t('home.features.instant.description') 
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      
      <style>{`
        @keyframes gradientShift {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          33% { transform: translateY(-20px) rotate(5deg); }
          66% { transform: translateY(-10px) rotate(-5deg); }
        }
        @keyframes floatSlow {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-15px); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(40px);
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
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        @keyframes slideInLeft {
          from {
            opacity: 0;
            transform: translateX(-60px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradientShift 8s ease infinite;
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
        .animate-floatSlow {
          animation: floatSlow 8s ease-in-out infinite;
        }
        .animate-pulse-slow {
          animation: pulse 3s ease-in-out infinite;
        }
        .animate-fadeInUp {
          animation: fadeInUp 0.8s ease-out forwards;
        }
        .animate-fadeIn {
          animation: fadeIn 1s ease-out forwards;
        }
        .animate-scaleIn {
          animation: scaleIn 0.7s ease-out forwards;
        }
        .animate-slideInLeft {
          animation: slideInLeft 0.8s ease-out forwards;
        }
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-400 { animation-delay: 0.4s; }
        .delay-500 { animation-delay: 0.5s; }
        .delay-600 { animation-delay: 0.6s; }
        .delay-700 { animation-delay: 0.7s; }
        .delay-800 { animation-delay: 0.8s; }
        .delay-900 { animation-delay: 0.9s; }
        .delay-1000 { animation-delay: 1s; }
        
        .glass-morphism {
          background: rgba(255, 255, 255, 0.85);
          backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.15);
        }
        .dark .glass-morphism {
          background: rgba(15, 23, 42, 0.7);
          border: 1px solid rgba(255, 255, 255, 0.1);
          box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.3);
        }
        
        .gradient-border {
          position: relative;
          background: linear-gradient(white, white) padding-box,
                      linear-gradient(135deg, #667eea 0%, #764ba2 100%) border-box;
          border: 2px solid transparent;
        }
        .dark .gradient-border {
          background: linear-gradient(rgb(15, 23, 42), rgb(15, 23, 42)) padding-box,
                      linear-gradient(135deg, #667eea 0%, #764ba2 100%) border-box;
        }
        
        .text-gradient {
          background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        
        .hover-lift {
          transition: all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .hover-lift:hover {
          transform: translateY(-8px);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
        }
        
        .shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0) 0%,
            rgba(255, 255, 255, 0.3) 50%,
            rgba(255, 255, 255, 0) 100%
          );
          background-size: 1000px 100%;
          animation: shimmer 3s infinite;
        }
        
        .perspective-card {
          perspective: 1000px;
        }
        
        .perspective-card:hover .card-inner {
          transform: rotateY(5deg) rotateX(5deg);
        }
        
        .card-inner {
          transition: transform 0.6s;
          transform-style: preserve-3d;
        }
      `}</style>

      {/* Enhanced Animated Background */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        {/* Gradient Orbs */}
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-400 to-pink-400 dark:from-purple-600 dark:to-pink-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-float"></div>
        <div className="absolute top-1/4 -right-20 w-80 h-80 bg-gradient-to-br from-cyan-400 to-blue-500 dark:from-cyan-600 dark:to-blue-700 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-floatSlow delay-300"></div>
        <div className="absolute -bottom-32 left-1/3 w-96 h-96 bg-gradient-to-br from-orange-400 to-red-400 dark:from-orange-600 dark:to-red-600 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-30 animate-float delay-700"></div>
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-gradient-to-br from-green-400 to-emerald-500 dark:from-green-600 dark:to-emerald-700 rounded-full mix-blend-multiply dark:mix-blend-screen filter blur-3xl opacity-20 animate-floatSlow delay-500"></div>
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:4rem_4rem] dark:bg-[linear-gradient(rgba(99,102,241,0.1)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.1)_1px,transparent_1px)]"></div>
      </div>

      {/* Hero Section */}
      <section className="relative pt-20 pb-32 lg:pt-32 lg:pb-40">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="relative z-10 text-center lg:text-left">
              {/* Badge */}
              <div className={`${isVisible ? 'animate-fadeInUp' : 'opacity-0'} mb-6`}>
                <div className="inline-flex items-center gap-2 glass-morphism px-5 py-2.5 rounded-full shadow-lg">
                  <Sparkles className="w-4 h-4 text-purple-600 dark:text-purple-400 animate-pulse-slow" />
                  <span className="text-sm font-semibold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
                    {t('home.hero.tagline')}
                  </span>
                </div>
              </div>

              {/* Title */}
              <h1 className={`text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 leading-tight ${isVisible ? 'animate-fadeInUp delay-100' : 'opacity-0'}`}>
                <span className="text-gradient">
                  {t('home.hero.titlePart1')}
                </span>
                <br />
                <span className="text-slate-900 dark:text-white">
                  {t('home.hero.titlePart2')}
                </span>
              </h1>

              {/* Description */}
              <p className={`text-lg md:text-xl text-slate-600 dark:text-slate-400 mb-10 max-w-xl mx-auto lg:mx-0 leading-relaxed ${isVisible ? 'animate-fadeInUp delay-200' : 'opacity-0'}`}>
                {t('home.hero.description')}
              </p>

              {/* Search Bar */}
              <div className={`max-w-2xl mx-auto lg:mx-0 ${isVisible ? 'animate-scaleIn delay-300' : 'opacity-0'}`}>
                <div className="glass-morphism rounded-2xl p-2 shadow-2xl hover-lift">
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="flex-1 relative">
                      <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5 pointer-events-none" />
                      <input
                        type="text"
                        placeholder={t('home.hero.searchPlaceholder')}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            navigate('/events', { state: { search: searchTerm } });
                          }
                        }}
                        className="w-full pl-12 pr-4 py-4 text-slate-900 dark:text-white bg-white/50 dark:bg-slate-800/50 rounded-xl border-0 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all placeholder:text-slate-400"
                      />
                    </div>
                    <button
                      onClick={() => navigate('/events', { state: { search: searchTerm } })}
                      className="group relative bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 hover:from-purple-700 hover:via-pink-700 hover:to-purple-700 text-white px-8 py-4 rounded-xl font-bold transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-2xl overflow-hidden"
                    >
                      <span className="relative z-10">{t('home.hero.searchButton')}</span>
                      <div className="absolute inset-0 shimmer"></div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Feature Pills */}
              <div className={`flex flex-wrap gap-3 justify-center lg:justify-start mt-8 ${isVisible ? 'animate-fadeIn delay-400' : 'opacity-0'}`}>
                {[t('home.pills.freeEvents'), t('home.pills.instantBooking'), t('home.pills.verifiedOrganizers')].map((feature, index) => (
                  <div key={index} className="flex items-center gap-2 bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200 dark:border-slate-700">
                    <div className="w-2 h-2 rounded-full bg-gradient-to-r from-green-400 to-emerald-500"></div>
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{feature}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right 3D Visual */}
            <div className={`relative ${isVisible ? 'animate-fadeIn delay-500' : 'opacity-0'}`}>
              <div className="relative w-full aspect-square max-w-2xl mx-auto">
                {/* Glowing Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/30 via-pink-500/30 to-orange-500/30 dark:from-purple-600/20 dark:via-pink-600/20 dark:to-orange-600/20 rounded-full filter blur-3xl animate-pulse-slow"></div>
                
                {/* 3D Illustration Container */}
                <div className="relative w-full h-full flex items-center justify-center">
                  {/* Layered 3D Cards Effect */}
                  <div className="relative w-full h-full">
                    {/* Back Card */}
                    <div className="absolute top-1/4 left-1/4 w-64 h-80 glass-morphism rounded-3xl shadow-2xl transform rotate-12 animate-floatSlow delay-300">
                      <div className="p-6 h-full flex flex-col">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 mb-4"></div>
                        <div className="space-y-3 flex-1">
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-3/4"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-1/2"></div>
                        </div>
                        <div className="h-40 bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-2xl"></div>
                      </div>
                    </div>

                    {/* Middle Card */}
                    <div className="absolute top-1/3 right-1/4 w-64 h-80 glass-morphism rounded-3xl shadow-2xl transform -rotate-6 animate-float delay-500">
                      <div className="p-6 h-full flex flex-col">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 mb-4"></div>
                        <div className="space-y-3 flex-1">
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-2/3"></div>
                          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-full w-5/6"></div>
                        </div>
                        <div className="h-40 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-2xl"></div>
                      </div>
                    </div>

                    {/* Front Card */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 h-96 glass-morphism rounded-3xl shadow-2xl animate-floatSlow z-10">
                      <div className="p-8 h-full flex flex-col">
                        <div className="flex items-center justify-between mb-6">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 shadow-lg"></div>
                          <div className="flex gap-1">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-300 dark:bg-slate-600"></div>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4 flex-1">
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-4/5"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-3/5"></div>
                          <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-full w-2/3"></div>
                        </div>
                        <div className="h-48 bg-gradient-to-br from-orange-100 via-red-100 to-pink-100 dark:from-orange-900/30 dark:via-red-900/30 dark:to-pink-900/30 rounded-2xl mb-4 relative overflow-hidden">
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-3">
                            {[...Array(3)].map((_, i) => (
                              <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 border-2 border-white dark:border-slate-800"></div>
                            ))}
                          </div>
                          <div className="px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl text-white text-sm font-bold">Join</div>
                        </div>
                      </div>
                    </div>

                    {/* Floating Elements */}
                    <div className="absolute top-10 right-10 w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-orange-500 shadow-xl animate-float delay-700"></div>
                    <div className="absolute bottom-20 left-10 w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 shadow-xl animate-floatSlow delay-900"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="relative py-20 -mt-16 z-20">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8">
            {stats.map((stat, index) => (
              <div 
                key={index} 
                className={`group perspective-card ${isVisible ? `animate-scaleIn delay-${(index + 6) * 100}` : 'opacity-0'}`}
              >
                <div className="card-inner glass-morphism rounded-3xl p-8 hover-lift">
                  <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center mx-auto mb-6 shadow-xl group-hover:scale-110 transition-transform duration-300`}>
                    <stat.icon className="w-8 h-8 text-white" />
                  </div>
                  <div className="text-5xl font-black text-slate-900 dark:text-white mb-3 text-center">
                    {stat.value}
                  </div>
                  <div className="text-slate-600 dark:text-slate-400 font-semibold text-center text-lg">
                    {stat.label}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
            <div className={`text-center mb-16 ${isVisible ? 'animate-fadeInUp delay-900' : 'opacity-0'}`}>
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-4">
                {t('home.whyChoose.title')}
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
                {t('home.whyChoose.subtitle')}
              </p>
            </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className={`group perspective-card ${isVisible ? `animate-scaleIn delay-${(index + 10) * 100}` : 'opacity-0'}`}
              >
                <div className="card-inner glass-morphism rounded-3xl p-8 hover-lift h-full">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-600 to-pink-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 shadow-lg">
                    <feature.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">
                    {feature.title}
                  </h3>
                  <p className="text-slate-600 dark:text-slate-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events Section */}
      <section className="relative py-20">
        <div className="container mx-auto px-4">
          <div className={`flex flex-col md:flex-row items-center justify-between mb-12 gap-6 ${isVisible ? 'animate-slideInLeft delay-1000' : 'opacity-0'}`}>
            <div className="text-center md:text-left">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-3">
                {t('home.featuredEvents.title')}
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-400">
                {t('home.featuredEvents.subtitle')}
              </p>
            </div>
            <Link 
              to="/events"
              className="group glass-morphism hover:shadow-2xl px-8 py-4 rounded-2xl font-bold transition-all duration-300 flex items-center gap-3 hover-lift"
            >
              <span className="text-gradient">{t('home.featuredEvents.viewAll')}</span>
              <ArrowRight className="w-5 h-5 text-purple-600 dark:text-purple-400 group-hover:translate-x-2 transition-transform" />
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
                  className={`${isVisible ? `animate-scaleIn delay-${(index % 3 + 13) * 100}` : 'opacity-0'}`}
                >
                  <EventCard event={event} />
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-morphism rounded-3xl p-20 text-center">
              <div className="w-32 h-32 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 flex items-center justify-center mx-auto mb-8">
                <Calendar className="w-16 h-16 text-slate-400 dark:text-slate-600" />
              </div>
              <h3 className="text-3xl font-bold text-slate-900 dark:text-white mb-4">
                {t('home.featuredEvents.noEvents.title')}
              </h3>
              <p className="text-slate-600 dark:text-slate-400 text-lg max-w-md mx-auto">
                {t('home.featuredEvents.noEvents.description')}
              </p>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-28 overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600 via-pink-600 to-orange-600 dark:from-purple-800 dark:via-pink-800 dark:to-orange-800 animate-gradient"></div>
        
        {/* Pattern Overlay */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_50%)]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_25%,rgba(255,255,255,0.05)_50%,transparent_50%,transparent_75%,rgba(255,255,255,0.05)_75%)] bg-[length:60px_60px]"></div>
        </div>

        {/* Floating Shapes */}
        <div className="absolute top-20 left-20 w-32 h-32 bg-white/10 rounded-full blur-2xl animate-float"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-white/10 rounded-full blur-2xl animate-floatSlow"></div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-5 py-2.5 rounded-full mb-8">
              <Sparkles className="w-4 h-4 text-white animate-pulse-slow" />
              <span className="text-sm font-bold text-white">
                {t('home.hero.tagline')}
              </span>
            </div>
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black mb-8 text-white leading-tight">
              {t('home.cta.title')}
            </h2>
            
            <p className="text-xl md:text-2xl mb-12 max-w-3xl mx-auto text-white/90 leading-relaxed">
              {t('home.cta.description')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-5 justify-center items-center">
              {!user && (
                <Link 
                  to="/auth"
                  className="group bg-white hover:bg-slate-50 text-purple-600 px-10 py-5 rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 hover-lift"
                >
                  <span className="flex items-center gap-2">
                    {t('home.cta.signUp')}
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </span>
                </Link>
              )}
              <Link 
                to="/events"
                className="group glass-morphism border-2 border-white/30 text-white hover:bg-white/10 px-10 py-5 rounded-2xl font-black text-lg transition-all duration-300 shadow-2xl hover:shadow-3xl transform hover:scale-105 hover-lift"
              >
                {t('home.cta.browseEvents')}
              </Link>
            </div>

            {/* Trust Indicators */}
            <div className="flex flex-wrap items-center justify-center gap-8 mt-16 pt-16 border-t border-white/20">
              <div className="text-center">
                <div className="text-3xl font-black text-white mb-1">
                  {formatStatNumber(activeParticipants)}
                </div>
                <div className="text-sm text-white/80">
                  {t('home.cta.stats.activeUsers')}
                </div>
              </div>
              <div className="w-px h-12 bg-white/20 hidden sm:block"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-white mb-1">
                  {formatStatNumber(monthlyEvents)}
                </div>
                <div className="text-sm text-white/80">
                  {t('home.cta.stats.eventsThisMonth')}
                </div>
              </div>
              <div className="w-px h-12 bg-white/20 hidden sm:block"></div>
              <div className="text-center">
                <div className="text-3xl font-black text-white mb-1">
                  {formatStatNumber(activeOrganisers)}
                </div>
                <div className="text-sm text-white/80">
                  {t('home.cta.stats.activeOrganizers')}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;