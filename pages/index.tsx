import ActivityTables from '@/components/ActivityTables';
import WatchedSites from '@/components/WatchedSites';
import { getCurrentUserId } from '@/utils/user-utils';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import { useEffect, useState } from 'react';

export default function Home() {
  const [userId, setUserId] = useState<string | null>(null);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const currentUserId = getCurrentUserId();
    setUserId(currentUserId);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Remove protocol and www if present
    let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
    // Remove trailing slash
    cleanUrl = cleanUrl.replace(/\/$/, '');
    // Remove any path or query parameters
    cleanUrl = cleanUrl.split('/')[0];

    window.location.href = `/${cleanUrl}`;
  };

  return (
    <main className="min-h-screen">
      <header className="w-full max-w-4xl mx-auto px-4 pt-8">
        <motion.h1
          className="text-4xl sm:text-6xl font-bold text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Built With Apartheid
        </motion.h1>

        <motion.p
          className="mb-4 sm:text-xl text-center text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Identify if a website is compromising the owner and its visitors.
        </motion.p>
      </header>

      <div className="w-full max-w-4xl mx-auto px-4">
        <form onSubmit={handleSubmit} className="mt-4 sm:mt-8">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <input
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Enter website URL (e.g. example.com)"
                className="w-full px-4 py-3 pl-10 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            </div>
            <button
              type="submit"
              className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            >
              Search
            </button>
          </div>
        </form>

        <motion.div
          className="flex flex-col gap-10 w-full mt-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {/* Activity Tables */}
          <ActivityTables />

          <motion.div
            className="space-y-6"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Trusting to have Israeli tech on your website is trusting Israel
              to be your partner and ally. This is unsafe for every person in
              the organization, from owners to stakeholders to simple visitors.
              Consider how Israel has historically treated its closest ally, the
              United States - extracting resources, intelligence, and financial
              support while offering questionable returns.
            </p>
            <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
              Ensure your website is keeping you and your partners secure and
              trusted.
            </p>
          </motion.div>
        </motion.div>
      </div>

      {userId && <WatchedSites />}
    </main>
  );
}
