import React from 'react';
import { Link } from 'react-router-dom';
import { Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const PrivacyPolicy: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        {/* Breadcrumbs */}
        <div className="mb-6 text-sm text-slate-400 flex items-center gap-2">
          <Link to="/" className="hover:text-slate-100 transition-colors">
            {t('navigation.home', 'Home')}
          </Link>
          <span className="text-slate-600">/</span>
          <Link to="/legal" className="hover:text-slate-100 transition-colors">
            {t('legal.title', 'Legal Information')}
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">{t('legal.privacy.title', 'Privacy Policy')}</span>
        </div>

        {/* Main card */}
        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur-xl overflow-hidden">
          {/* Header */}
          <div className="relative px-6 sm:px-10 pt-8 pb-6 border-b border-slate-800 bg-gradient-to-r from-emerald-500/10 via-teal-500/10 to-cyan-500/10">
            <div className="flex items-start gap-4">
              <div className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/20 text-emerald-300">
                <Lock className="h-6 w-6" />
              </div>
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300 mb-3">
                  {t('legal.privacy.badge', 'Your data & privacy')}
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-50 mb-2">
                  {t('legal.privacy.title', 'Privacy Policy')}
                </h1>
                <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                  {t(
                    'legal.privacy.intro',
                    'This policy explains how Burgasys collects, uses, and protects your personal information when you use the platform.'
                  )}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  {t('legal.lastUpdated', 'Last updated')}: {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>

          {/* Content grid */}
          <div className="px-6 sm:px-10 py-8 grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="space-y-10">
              <section>
                <h2 className="text-xl font-bold text-slate-50 mb-3">
                  {t('legal.privacy.data.title', 'Data we collect')}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {t(
                    'legal.privacy.data.description',
                    'We may collect information you provide directly (such as account details), as well as technical data like usage and device information.'
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-50 mb-3">
                  {t('legal.privacy.usage.title', 'How we use data')}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {t(
                    'legal.privacy.usage.description',
                    'Your data is used to operate the platform, improve features, provide support, and keep your account secure.'
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-50 mb-3">
                  {t('legal.privacy.sharing.title', 'Data sharing')}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {t(
                    'legal.privacy.sharing.description',
                    'We do not sell your personal data. Limited sharing may occur with service providers or when required by law.'
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-50 mb-3">
                  {t('legal.privacy.rights.title', 'Your rights')}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {t(
                    'legal.privacy.rights.description',
                    'Depending on your location, you may have rights to access, correct, or delete your data, or object to certain processing.'
                  )}
                </p>
              </section>
            </div>

            <aside className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
                {t('legal.privacy.summary.title', 'Key points')}
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
                <li>
                  {t(
                    'legal.privacy.summary.point1',
                    'We collect only what we need to run Burgasys effectively.'
                  )}
                </li>
                <li>
                  {t(
                    'legal.privacy.summary.point2',
                    'We never sell your personal data to third parties.'
                  )}
                </li>
                <li>
                  {t(
                    'legal.privacy.summary.point3',
                    'You can contact us if you want to access or delete your data.'
                  )}
                </li>
              </ul>

              <div className="mt-4 rounded-xl bg-slate-900/80 border border-slate-800 px-4 py-3 text-xs text-slate-400 leading-relaxed">
                {t(
                  'legal.note',
                  'If you operate Burgasys commercially in a specific jurisdiction, make sure to replace this placeholder content with text reviewed by legal counsel.'
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
