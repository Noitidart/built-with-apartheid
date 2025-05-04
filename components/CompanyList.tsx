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
    <div className="space-y-6">
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
            className="rounded-lg overflow-hidden shadow border border-gray-200 dark:border-gray-700"
          >
            {/* Header section (always visible) */}
            <div
              onClick={() => toggleExpanded(id)}
              className="bg-red-300 dark:bg-red-900 p-6 cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-white dark:bg-gray-800 rounded-lg p-2 flex items-center justify-center">
                    <Logo />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-red-800 dark:text-red-200">
                      {company.name}
                    </h2>
                    <p className="text-red-600 dark:text-red-300 font-medium">
                      Detected on your website
                    </p>
                  </div>
                </div>

                <div className="flex items-center">
                  <button
                    className="text-red-700 dark:text-red-300 font-medium flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleExpanded(id);
                    }}
                  >
                    {isExpanded ? 'Show less' : 'Read more'}
                    <motion.svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 ml-1"
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
