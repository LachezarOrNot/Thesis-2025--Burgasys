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
    <footer className="relative overflow-hidden bg-[#080810] text-gray-400">
      {/* Noise texture overlay */}
      <div
        className="absolute inset-0 opacity-[0.035] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E")`,
          backgroundRepeat: "repeat",
          backgroundSize: "128px",
        }}
      />

      {/* Top glowing accent line */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500/60 to-transparent" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-px bg-purple-400/80 blur-sm" />

      {/* Ambient glow pools */}
      <div className="absolute top-0 left-1/4 w-96 h-64 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-80 h-64 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative container mx-auto px-6 md:px-10 pt-14 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 md:gap-8 mb-12">

          {/* 1️⃣ Brand Section — spans 5 cols */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-5 pr-0 md:pr-8"
          >
            {/* Logo */}
            <div className="flex items-center space-x-2.5 mb-5">
              <div className="relative">
                <div className="absolute inset-0 bg-purple-500/40 rounded-full blur-md" />
                <Sparkles className="relative h-6 w-6 text-purple-300" />
              </div>
              <span
                className="text-2xl font-bold text-white tracking-tight"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", letterSpacing: "-0.02em" }}
              >
                Burgasys
              </span>
            </div>

            <p className="text-gray-500 mb-6 leading-relaxed text-sm max-w-xs"
               style={{ fontFamily: "'DM Sans', sans-serif" }}>
              {t('footer.brand.description')}
            </p>

            {/* Contact pills */}
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/[0.04] border border-white/[0.07] rounded-full px-3.5 py-1.5 hover:border-blue-500/40 hover:text-blue-300 transition-all duration-300">
                <MapPin className="h-3.5 w-3.5 text-blue-400/80" />
                <span>{t('footer.brand.location')}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-gray-400 bg-white/[0.04] border border-white/[0.07] rounded-full px-3.5 py-1.5 hover:border-purple-500/40 hover:text-purple-300 transition-all duration-300">
                <Mail className="h-3.5 w-3.5 text-purple-400/80" />
                <span>{t('footer.brand.email')}</span>
              </div>
            </div>
          </motion.div>

          {/* Vertical divider */}
          <div className="hidden md:block md:col-span-1">
            <div className="h-full w-px bg-gradient-to-b from-transparent via-white/10 to-transparent mx-auto" />
          </div>

          {/* 2️⃣ Explore Section — spans 3 cols */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-3"
          >
            <h3
              className="text-[10px] font-semibold text-gray-500 mb-5 uppercase tracking-[0.2em]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {t('footer.explore.title')}
            </h3>
            <ul className="space-y-3.5">
              {[
                { to: "/events", icon: CalendarDays, label: t('footer.explore.upcomingEvents'), color: "group-hover:text-blue-400", iconColor: "group-hover:text-blue-400 text-gray-600" },
                { to: "/calendar", icon: Calendar, label: t('footer.explore.eventCalendar'), color: "group-hover:text-purple-400", iconColor: "group-hover:text-purple-400 text-gray-600" },
                ...(!user ? [{ to: "/auth", icon: LogIn, label: t('footer.explore.signIn'), color: "group-hover:text-indigo-400", iconColor: "group-hover:text-indigo-400 text-gray-600" }] : []),
              ].map(({ to, icon: Icon, label, color, iconColor }) => (
                <li key={to}>
                  <Link
                    to={to}
                    className={`group flex items-center gap-3 text-sm text-gray-500 ${color} transition-all duration-300`}
                    style={{ fontFamily: "'DM Sans', sans-serif" }}
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] group-hover:border-white/[0.15] transition-all duration-300">
                      <Icon className={`h-3.5 w-3.5 ${iconColor} transition-colors duration-300`} />
                    </span>
                    <span>{label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </motion.div>

          {/* 3️⃣ Connect Section — spans 3 cols */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="md:col-span-3"
          >
            <h3
              className="text-[10px] font-semibold text-gray-500 mb-5 uppercase tracking-[0.2em]"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {t('footer.connect.title')}
            </h3>

            {/* Social icons */}
            <div className="flex items-center gap-3 mb-5">
              {[
                { icon: Twitter, color: "hover:border-blue-500/50 hover:text-blue-400 hover:bg-blue-500/10" },
                { icon: Instagram, color: "hover:border-purple-500/50 hover:text-purple-400 hover:bg-purple-500/10" },
                { icon: Linkedin, color: "hover:border-indigo-500/50 hover:text-indigo-400 hover:bg-indigo-500/10" },
              ].map(({ icon: Icon, color }, i) => (
                <a
                  key={i}
                  href="#"
                  className={`flex items-center justify-center w-9 h-9 rounded-xl border border-white/[0.08] text-gray-500 ${color} transition-all duration-300`}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>

            <p
              className="text-gray-600 text-xs leading-relaxed"
              style={{ fontFamily: "'DM Sans', sans-serif" }}
            >
              {t('footer.connect.description')}
            </p>
          </motion.div>
        </div>

        {/* Bottom bar */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="border-t border-white/[0.06] pt-6 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <p
            className="text-[11px] text-gray-600"
            style={{ fontFamily: "'DM Sans', sans-serif" }}
          >
            {t('footer.copyright', { year: new Date().getFullYear() })}
          </p>

          <div className="flex items-center gap-1">
            {[
              { to: "/legal", label: t('footer.legal.legal', 'Legal information') },
              { to: "/terms", label: t('footer.legal.terms', 'Terms of service') },
              { to: "/privacy", label: t('footer.legal.privacy', 'Privacy policy') },
            ].map(({ to, label }, i, arr) => (
              <React.Fragment key={to}>
                <Link
                  to={to}
                  className="text-[11px] text-gray-600 hover:text-gray-300 transition-colors duration-200 px-2"
                  style={{ fontFamily: "'DM Sans', sans-serif" }}
                >
                  {label}
                </Link>
                {i < arr.length - 1 && (
                  <span className="text-gray-700 text-[10px]">·</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </motion.div>
      </div>
    </footer>
  );
};

export default Footer;