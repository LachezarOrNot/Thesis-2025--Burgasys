import React from 'react';
import { Filter, ChevronDown, Search, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export interface FilterBarFilters {
  searchTerm: string;
  dateFilter: string;
  categoryFilter: string;
  locationFilter: string;
  sortBy: string;
}

interface FilterBarProps {
  filters: FilterBarFilters;
  onFilterChange: (updates: Partial<FilterBarFilters>) => void;
  onClearAll: () => void;
}

const selectBase =
  'w-full appearance-none bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600/60 rounded-xl px-4 py-3 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--electro-blue)]/40 focus:border-[var(--electro-blue)] dark:focus:ring-[var(--electro-blue)]/30 dark:focus:border-[var(--electro-blue)] hover:border-gray-300 dark:hover:border-gray-500 cursor-pointer';

const inputBase =
  'w-full bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-600/60 rounded-xl px-4 py-3 pl-11 text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-[var(--electro-blue)]/40 focus:border-[var(--electro-blue)] dark:focus:ring-[var(--electro-blue)]/30 dark:focus:border-[var(--electro-blue)] hover:border-gray-300 dark:hover:border-gray-500';

const FilterBar: React.FC<FilterBarProps> = ({ filters, onFilterChange, onClearAll }) => {
  const { t } = useTranslation();
  const { searchTerm, dateFilter, categoryFilter, locationFilter, sortBy } = filters;

  const hasActiveFilters =
    searchTerm ||
    dateFilter !== 'all' ||
    categoryFilter !== 'all' ||
    locationFilter !== 'all';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-gray-200/80 dark:border-gray-700/60 bg-white dark:bg-gray-800/95 shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 mb-6">
      <div className="absolute inset-0 bg-gradient-to-br from-[var(--electro-blue)]/5 via-transparent to-[var(--deep-purple)]/5 pointer-events-none" />
      <div className="relative p-5 md:p-6">
        <div className="flex items-center gap-3 mb-5">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--electro-blue)]/20 to-[var(--deep-purple)]/20 border border-[var(--electro-blue)]/20 dark:border-[var(--electro-blue)]/10">
            <Filter className="w-5 h-5 text-[var(--electro-blue)]" strokeWidth={2} />
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900 dark:text-white tracking-tight">
              {t('events.filterEvents')}
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              {t('events.filterSubtitle')}
            </p>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-4 mb-5">
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
            <input
              type="text"
              placeholder={t('events.searchPlaceholder')}
              value={searchTerm}
              onChange={(e) => onFilterChange({ searchTerm: e.target.value })}
              className={inputBase}
            />
          </div>
          {hasActiveFilters && (
            <button
              onClick={onClearAll}
              className="flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700/80 hover:text-gray-900 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-500 transition-all duration-200 font-medium text-sm shrink-0"
            >
              <X className="w-4 h-4" />
              {t('events.clearAll')}
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              {t('events.date')}
            </label>
            <div className="relative">
              <select
                value={dateFilter}
                onChange={(e) => onFilterChange({ dateFilter: e.target.value })}
                className={selectBase}
              >
                <option value="all">{t('events.anyDate')}</option>
                <option value="today">{t('events.today')}</option>
                <option value="week">{t('events.thisWeek')}</option>
                <option value="month">{t('events.thisMonth')}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              {t('events.category')}
            </label>
            <div className="relative">
              <select
                value={categoryFilter}
                onChange={(e) => onFilterChange({ categoryFilter: e.target.value })}
                className={selectBase}
              >
                <option value="all">{t('events.allCategories')}</option>
                <option value="technology">{t('events.technology')}</option>
                <option value="business">{t('events.business')}</option>
                <option value="education">{t('events.education')}</option>
                <option value="social">{t('events.social')}</option>
                <option value="sports">{t('events.sports')}</option>
                <option value="arts">{t('events.arts')}</option>
                <option value="science">{t('events.science')}</option>
                <option value="health">{t('events.health')}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              {t('events.location')}
            </label>
            <div className="relative">
              <select
                value={locationFilter}
                onChange={(e) => onFilterChange({ locationFilter: e.target.value })}
                className={selectBase}
              >
                <option value="all">{t('events.anyLocation')}</option>
                <option value="online">{t('events.online')}</option>
                <option value="in-person">{t('events.inPerson')}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
              {t('events.sortBy')}
            </label>
            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => onFilterChange({ sortBy: e.target.value })}
                className={selectBase}
              >
                <option value="date">{t('events.dateSoonest')}</option>
                <option value="name">{t('events.nameAZ')}</option>
                <option value="popularity">{t('events.mostPopular')}</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 dark:text-gray-500 pointer-events-none" />
            </div>
          </div>
        </div>

        {hasActiveFilters && (
          <div className="mt-5 pt-5 border-t border-gray-200 dark:border-gray-700">
            <div className="flex flex-wrap gap-2">
              {searchTerm && (
                <span className="inline-flex items-center px-3 py-1.5 bg-[var(--electro-blue)]/10 dark:bg-[var(--electro-blue)]/20 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium">
                  &quot;{searchTerm}&quot;
                  <button
                    onClick={() => onFilterChange({ searchTerm: '' })}
                    className="ml-2 p-0.5 rounded hover:bg-gray-300/50 dark:hover:bg-gray-600/50 transition-colors"
                    aria-label={t('events.clearAll')}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {dateFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1.5 bg-[var(--electro-blue)]/10 dark:bg-[var(--electro-blue)]/20 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium">
                  {t(`events.${dateFilter}`)}
                  <button
                    onClick={() => onFilterChange({ dateFilter: 'all' })}
                    className="ml-2 p-0.5 rounded hover:bg-gray-300/50 dark:hover:bg-gray-600/50 transition-colors"
                    aria-label={t('events.clearAll')}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {categoryFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1.5 bg-[var(--electro-blue)]/10 dark:bg-[var(--electro-blue)]/20 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium">
                  {t(`events.${categoryFilter}`)}
                  <button
                    onClick={() => onFilterChange({ categoryFilter: 'all' })}
                    className="ml-2 p-0.5 rounded hover:bg-gray-300/50 dark:hover:bg-gray-600/50 transition-colors"
                    aria-label={t('events.clearAll')}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
              {locationFilter !== 'all' && (
                <span className="inline-flex items-center px-3 py-1.5 bg-[var(--electro-blue)]/10 dark:bg-[var(--electro-blue)]/20 text-gray-800 dark:text-gray-200 rounded-lg text-sm font-medium">
                  {t(`events.${locationFilter === 'in-person' ? 'inPerson' : locationFilter}`)}
                  <button
                    onClick={() => onFilterChange({ locationFilter: 'all' })}
                    className="ml-2 p-0.5 rounded hover:bg-gray-300/50 dark:hover:bg-gray-600/50 transition-colors"
                    aria-label={t('events.clearAll')}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FilterBar;
