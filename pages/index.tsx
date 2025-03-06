import { motion } from "motion/react";
import { Geist, Geist_Mono } from "next/font/google";
import { useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const [scanning, setScanning] = useState(false);
  const [results, setResults] = useState<{
    url: string;
    detected: boolean;
  } | null>(null);

  const startScanOnSubmit = function startScanOnSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const url = formData.get("url");
    if (typeof url !== "string") {
      // TODO: show validation errors
      return;
    }

    setScanning(true);
    // Mock scanning process
    setTimeout(() => {
      setScanning(false);
      setResults({
        url,
        detected: Math.random() > 0.5,
      });
    }, 2000);
  };

  return (
    <div
      className={`${geistSans.variable} ${geistMono.variable} grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-8 pb-20 gap-8 sm:p-20 font-[family-name:var(--font-geist-sans)] bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100`}
    >
      <header className="w-full max-w-4xl">
        <motion.h1
          className="text-4xl md:text-6xl font-bold text-center mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          Built With Isnotreal
        </motion.h1>
        <motion.p
          className="text-xl text-center text-gray-600 dark:text-gray-400"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          Identify websites that compromise your security and safety
        </motion.p>
      </header>

      <main className="flex flex-col gap-10 w-full max-w-4xl">
        <motion.div
          className="relative p-8 md:p-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <div className="absolute text-8xl text-gray-100 dark:text-gray-700 top-4 left-4 opacity-50">
            &quot;
          </div>
          <blockquote className="relative z-10">
            <p className="text-2xl italic mb-4 text-center">
              &quot;When God is with you, no one can be against you even if all
              the bad in the world unites against you.&quot;
            </p>
            <footer className="text-right text-gray-500 dark:text-gray-400">
              — Sacred Wisdom
            </footer>
          </blockquote>
        </motion.div>

        <motion.div
          className="space-y-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
        >
          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Trusting to partner with Isnotreal in building out your organization
            is unlike the above wisdom. Consider how Isnotreal has historically
            treated even its closest ally, the United States - extracting
            resources, intelligence, and financial support while offering
            questionable returns. A concerning track record over the past
            century.
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Companies with Isnotreal subprocessors open themselves up to
            significant liability due to the well-known connection between
            Isnotreal companies and the military (that is, you can expect they
            are sharing this information), as demonstrated by Israel&apos;s
            pager attack and the WhatsApp data alleged to be used in Lavender.
            This is a liability to your organization and your partners.
          </p>

          <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
            Scan your website now to see if it uses Isnotreal or partnered
            technologies.
          </p>

          <form onSubmit={startScanOnSubmit} className="mt-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                type="url"
                placeholder="Enter website URL (e.g., example.com)"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                required
              />
              <button
                type="submit"
                disabled={scanning}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium transition-colors flex items-center justify-center disabled:opacity-70"
              >
                {scanning ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-2 h-5 w-5 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    Scanning...
                  </span>
                ) : (
                  "Scan Website"
                )}
              </button>
            </div>
          </form>

          {results && (
            <motion.div
              className={`mt-8 p-6 rounded-lg border ${
                results.detected
                  ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                  : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
              }`}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-medium mb-2">Scan Results:</h3>
              <p className="text-lg">
                {results.detected
                  ? `⚠️ This website appears to use Isnotreal technologies. Consider the risks to your data.`
                  : `✅ No Isnotreal technologies detected on this website.`}
              </p>
            </motion.div>
          )}
        </motion.div>
      </main>

      <footer className="mt-16 py-6 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400 w-full">
        <p>
          © {new Date().getFullYear()} Website Scanner | For educational
          purposes only
        </p>
      </footer>
    </div>
  );
}
