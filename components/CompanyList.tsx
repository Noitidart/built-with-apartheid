import { COMPANIES, CompanyId } from '@/constants/companies';
import { AnimatePresence, motion } from 'framer-motion';
import { useState } from 'react';

interface CompanyListProps {
  companyIds: CompanyId[];
  isProbablyMasjid?: boolean;
}

export default function CompanyList({
  companyIds,
  isProbablyMasjid
}: CompanyListProps) {
  const [expandedCompany, setExpandedCompany] = useState<CompanyId | null>(
    null
  );

  const toggleExpanded = (id: CompanyId) => {
    setExpandedCompany(expandedCompany === id ? null : id);
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {companyIds.map((id) => {
        const company = COMPANIES.find((c) => c.id === id);
        if (!company) {
          throw new Error(`Company with ID ${id} not found`);
        }

        const isExpanded = expandedCompany === id;
        const { Logo, Article } = company;

        return (
          <div
            key={id}
            className="rounded-lg overflow-hidden shadow border border-gray-200 dark:border-gray-700 sm:mx-0"
          >
            {/* Header section (always visible) */}
            <div
              onClick={() => toggleExpanded(id)}
              className="bg-red-300 dark:bg-red-900 p-3 sm:p-6 cursor-pointer"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
                <div className="flex items-start sm:items-center gap-3 sm:gap-4 flex-1 min-w-0">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-white dark:bg-gray-800 rounded-lg p-1.5 sm:p-2 flex items-center justify-center flex-shrink-0">
                    <Logo />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg sm:text-2xl font-bold text-red-800 dark:text-red-200 leading-tight">
                      {company.name}
                    </h2>
                    <p className="text-sm sm:text-base text-red-600 dark:text-red-300 font-medium">
                      Critical Security Vulnerability
                    </p>
                  </div>
                </div>

                <div className="flex items-center sm:justify-center flex-shrink-0">
                  <div className="flex flex-col items-start sm:items-end gap-2">
                    <button
                      className="bg-red-600 hover:bg-red-700 dark:bg-red-700 dark:hover:bg-red-600 text-white px-3 py-2 sm:px-4 sm:py-2 rounded-lg font-medium flex items-center gap-2 transition-colors duration-200 text-sm sm:text-base shadow-sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleExpanded(id);
                      }}
                    >
                      <span className="sm:inline">
                        {isExpanded ? 'Show less' : 'Read more'}
                      </span>
                      <motion.svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4 sm:h-5 sm:w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        initial={false}
                        animate={{ rotate: isExpanded ? 180 : 0 }}
                        transition={{ duration: 0.3 }}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </motion.svg>
                    </button>

                    {isProbablyMasjid && (
                      <div className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-2 py-1 rounded-md text-xs font-medium border border-green-200 dark:border-green-700">
                        <span className="scale-125 inline-block">🤩</span>{' '}
                        Special recommendation inside
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Expandable article content */}
            <AnimatePresence>
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3, ease: 'easeInOut' }}
                  className="overflow-hidden"
                >
                  <Article isProbablyMasjid={isProbablyMasjid} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
