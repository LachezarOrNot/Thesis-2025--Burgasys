import React from "react";
import { Link } from "react-router-dom";
import {
  Calendar,
  CalendarDays,
  LogIn,
  Mail,
  MapPin,
  Sparkles,
  Instagram,
  Twitter,
  Linkedin,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/AuthContext";

const Footer: React.FC = () => {
  const { t } = useTranslation();
  const { user } = useAuth();

  return (
    <footer className="relative overflow-hidden bg-black text-gray-300 py-14">
      {/* Animated gradient background */}
      <motion.div
        animate={{
          backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
          opacity: [0.2, 0.35, 0.2],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "linear",
        }}
        className="absolute inset-0 bg-gradient-to-r from-blue-700 via-purple-600 to-indigo-700 bg-[length:300%_300%] blur-[120px]"
      />

      <div className="relative container mx-auto px-6">
        {/* Main horizontal layout */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-12 md:gap-24">
          {/* 1️⃣ Brand Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex-1 max-w-sm"
          >
            <div className="flex items-center space-x-2 mb-4">
              <Sparkles className="h-7 w-7 text-purple-400 animate-pulse" />
              <span className="text-2xl font-bold text-white">Burgasys</span>
            </div>

            <p className="text-gray-400 mb-5 leading-relaxed">
              {t('footer.brand.description')}
            </p>

            <div className="flex items-center gap-6 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-blue-400" />
                <span>{t('footer.brand.location')}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Mail className="h-4 w-4 text-purple-400" />
                <span>{t('footer.brand.email')}</span>
              </div>
            </div>
          </motion.div>

          {/* 2️⃣ Explore Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="flex-1"
          >
            <h3 className="text-lg font-semibold text-white mb-4 uppercase tracking-wide">
              {t('footer.explore.title')}
            </h3>
            <ul className="space-y-3 text-sm">
              <li>
                <Link
                  to="/events"
                  className="group flex items-center space-x-2 hover:text-blue-400 transition-all duration-300"
                >
                  <CalendarDays className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>{t('footer.explore.upcomingEvents')}</span>
                </Link>
              </li>
              <li>
                <Link
                  to="/calendar"
                  className="group flex items-center space-x-2 hover:text-purple-400 transition-all duration-300"
                >
                  <Calendar className="h-4 w-4 group-hover:scale-110 transition-transform" />
                  <span>{t('footer.explore.eventCalendar')}</span>
                </Link>
              </li>
              {!user && (
                <li>
                  <Link
                    to="/auth"
                    className="group flex items-center space-x-2 hover:text-indigo-400 transition-all duration-300"
                  >
                    <LogIn className="h-4 w-4 group-hover:scale-110 transition-transform" />
                    <span>{t('footer.explore.signIn')}</span>
                  </Link>
                </li>
              )}
            </ul>
          </motion.div>

          {/* 3️⃣ Connect Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="flex-1 md:text-right"
          >
            <h3 className="text-lg font-semibold text-white mb-4 uppercase tracking-wide">
              {t('footer.connect.title')}
            </h3>
            <div className="flex md:justify-end justify-center items-center space-x-5 mb-6">
              <a
                href="#"
                className="hover:text-blue-400 hover:scale-110 transition-all duration-300"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="hover:text-purple-400 hover:scale-110 transition-all duration-300"
              >
                <Instagram className="h-5 w-5" />
              </a>
              <a
                href="#"
                className="hover:text-indigo-400 hover:scale-110 transition-all duration-300"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>

            <p className="text-gray-500 text-sm leading-relaxed md:max-w-xs md:ml-auto">
              {t('footer.connect.description')}
            </p>
          </motion.div>
        </div>

        {/* Footer bottom */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6 }}
          className="mt-14 border-t border-gray-800 pt-6 text-center text-sm text-gray-500"
        >
          <p>
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;