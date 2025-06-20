import { Search } from 'lucide-react';
import { useRouter } from 'next/router';
import { useState } from 'react';

export default function UrlPage() {
  const [url, setUrl] = useState('');
  const router = useRouter();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!url) return;

    // Remove protocol and www if present
    let cleanUrl = url.replace(/^(https?:\/\/)?(www\.)?/, '');
    // Remove trailing slash
    cleanUrl = cleanUrl.replace(/\/$/, '');
    // Remove any path or query parameters
    cleanUrl = cleanUrl.split('/')[0];

    router.push(`/${cleanUrl}`);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="flex gap-2">
        <div className="relative flex-1">
          <input
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter a website URL (e.g. example.com)"
            className="w-full px-4 py-2 pl-10 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
          />
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        </div>
        <button
          type="submit"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          Search
        </button>
      </form>
      <p className="mt-4 text-center text-sm text-slate-600 dark:text-slate-400">
        Enter a website URL to check if it uses Israeli technology
      </p>
    </div>
  );
}
