import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Legal: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6 text-sm text-slate-400 flex items-center gap-2">
          <Link to="/" className="hover:text-slate-100 transition-colors">
            {t('navigation.home', 'Home')}
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">{t('legal.title', 'Legal Information')}</span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="relative px-6 sm:px-10 pt-8 pb-6 border-b border-slate-800 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-pink-500/10">
            <div className="flex items-start gap-4">
              <div className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-indigo-500/20 text-indigo-300">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300 mb-3">
                  {t('legal.badge', 'Transparency & compliance')}
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-50 mb-2">
                  {t('legal.title', 'Legal Information')}
                </h1>
                <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                  {t(
                    'legal.intro',
                    'This page provides general legal information about Burgasys. It does not constitute legal advice.'
                  )}
                </p>
                <p className="mt-3 text-xs text-slate-400">
                  {t('legal.lastUpdated', 'Last updated')}: {new Date().getFullYear()}
                </p>
              </div>
            </div>
          </div>

          <div className="px-6 sm:px-10 py-8 grid gap-10 lg:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
            <div className="space-y-10">
              <section>
                <h2 className="text-xl font-bold text-slate-50 mb-3">
                  {t('legal.company.title', 'Service owner')}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {t(
                    'legal.company.description',
                    'Burgasys is an online platform for discovering and managing events. Specific company and contact details may be added here.'
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-50 mb-3">
                  {t('legal.contact.title', 'Contact')}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {t(
                    'legal.contact.description',
                    'For questions about terms, privacy, or legal matters, please contact us at support@burgasys.com.'
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-50 mb-3">
                  {t('legal.disclaimer.title', 'Disclaimer')}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {t(
                    'legal.disclaimer.description',
                    'While we strive to keep information accurate and up to date, Burgasys provides this service “as is” without warranties of any kind.'
                  )}
                </p>
              </section>
            </div>

            <aside className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
                {t('legal.quickLinks', 'Quick links')}
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <Link
                    to="/terms"
                    className="text-slate-300 hover:text-indigo-300 transition-colors"
                  >
                    {t('footer.legal.terms', 'Terms of service')}
                  </Link>
                </li>
                <li>
                  <Link
                    to="/privacy"
                    className="text-slate-300 hover:text-indigo-300 transition-colors"
                  >
                    {t('footer.legal.privacy', 'Privacy policy')}
                  </Link>
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

export default Legal;

