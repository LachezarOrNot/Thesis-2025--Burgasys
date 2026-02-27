import React from 'react';
import { Link } from 'react-router-dom';
import { FileText } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const TermsOfService: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 py-16">
      <div className="container mx-auto px-4 max-w-5xl">
        <div className="mb-6 text-sm text-slate-400 flex items-center gap-2">
          <Link to="/" className="hover:text-slate-100 transition-colors">
            {t('navigation.home', 'Home')}
          </Link>
          <span className="text-slate-600">/</span>
          <Link to="/legal" className="hover:text-slate-100 transition-colors">
            {t('legal.title', 'Legal Information')}
          </Link>
          <span className="text-slate-600">/</span>
          <span className="text-slate-300">{t('legal.terms.title', 'Terms of Service')}</span>
        </div>

        <div className="rounded-3xl border border-slate-800 bg-slate-900/70 shadow-2xl backdrop-blur-xl overflow-hidden">
          <div className="relative px-6 sm:px-10 pt-8 pb-6 border-b border-slate-800 bg-gradient-to-r from-indigo-500/10 via-blue-500/10 to-cyan-500/10">
            <div className="flex items-start gap-4">
              <div className="mt-1 inline-flex h-11 w-11 items-center justify-center rounded-2xl bg-blue-500/20 text-blue-300">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <p className="inline-flex items-center gap-2 rounded-full bg-slate-900/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300 mb-3">
                  {t('legal.terms.badge', 'Use of Burgasys')}
                </p>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-50 mb-2">
                  {t('legal.terms.title', 'Terms of Service')}
                </h1>
                <p className="text-slate-300 text-sm sm:text-base max-w-2xl leading-relaxed">
                  {t(
                    'legal.terms.intro',
                    'By using Burgasys, you agree to these terms. Please read them carefully before using the platform.'
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
                  {t('legal.terms.use.title', 'Use of the service')}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {t(
                    'legal.terms.use.description',
                    'You agree to use Burgasys only for lawful purposes and in accordance with applicable laws and regulations.'
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-50 mb-3">
                  {t('legal.terms.accounts.title', 'User accounts')}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {t(
                    'legal.terms.accounts.description',
                    'You are responsible for maintaining the confidentiality of your account and for all activities that occur under it.'
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-50 mb-3">
                  {t('legal.terms.content.title', 'Content and events')}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {t(
                    'legal.terms.content.description',
                    'Organizers are responsible for the accuracy and legality of events they create. Burgasys may remove content that violates these terms.'
                  )}
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-slate-50 mb-3">
                  {t('legal.terms.changes.title', 'Changes to these terms')}
                </h2>
                <p className="text-slate-300 text-sm sm:text-base leading-relaxed">
                  {t(
                    'legal.terms.changes.description',
                    'We may update these terms from time to time. Continued use of the platform after changes means you accept the updated terms.'
                  )}
                </p>
              </section>
            </div>

            <aside className="space-y-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-5">
              <h3 className="text-sm font-semibold text-slate-200 tracking-wide uppercase">
                {t('legal.terms.summary.title', 'In short')}
              </h3>
              <ul className="space-y-2 text-xs sm:text-sm text-slate-300 list-disc list-inside">
                <li>
                  {t(
                    'legal.terms.summary.point1',
                    'Use Burgasys responsibly and in line with local laws.'
                  )}
                </li>
                <li>
                  {t(
                    'legal.terms.summary.point2',
                    'You are responsible for your account and the content you create.'
                  )}
                </li>
                <li>
                  {t(
                    'legal.terms.summary.point3',
                    'We may update these terms as the product evolves.'
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

export default TermsOfService;

