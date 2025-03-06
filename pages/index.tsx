import CompanyList from "@/components/CompanyList";
import type { ScanRequestBody, ScanResult } from "@/pages/api/v1/scan";
import axios from "axios";
import delay from "delay";
import { AnimatePresence, motion } from "motion/react";
import { Geist, Geist_Mono } from "next/font/google";
import { useRouter } from "next/router";
import { useEffect, useRef, useState } from "react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function Home() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showIntro, setShowIntro] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  const runScan = async (url: string) => {
    setScanning(true);
    setScanResult(null);
    setError(null);

    // Update URL without refreshing page
    router.push(`/?url=${encodeURIComponent(url)}`, undefined, {
      shallow: true,
    });

    try {
      const [response] = await Promise.all([
        axios.post<ScanResult>("/api/v1/scan", {
          url,
        } satisfies ScanRequestBody),
        // Make "Analyzing website technologies..." message last at least 2
        // seconds so user can read it to see what just happened.
        delay(2000),
      ]);
      setScanResult(response.data);
    } catch (err) {
      if (axios.isAxiosError(err)) {
        const errorMessage =
          err.response?.data?.error ||
          "An unhandled scan request error occurred";
        setError(errorMessage);
      } else {
        console.error("Unknown scan error:", err);
        setError("An unhandled error occurred");
      }
    } finally {
      setScanning(false);
    }
  };

  useEffect(
    function scanUrlParamOnMount() {
      if (!router.isReady) {
        return;
      }

      const urlParam = router.query.url;
      if (typeof urlParam === "string" && urlParam) {
        if (urlInputRef.current) {
          urlInputRef.current.value = urlParam;
        }

        setShowIntro(false);
        runScan(urlParam);
      }
    },
    [router.isReady]
  );

  const scanOnSubmit = function scanOnSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const formData = new FormData(e.currentTarget);
    const url = formData.get("url");
    if (typeof url !== "string") {
      // TODO: show validation errors
      return;
    }

    setShowIntro(false);
    runScan(url);
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
          Identify if your website is keeping your organization and partners
          protected.
        </motion.p>
      </header>

      <main className="flex flex-col gap-10 w-full max-w-4xl">
        <AnimatePresence>
          {showIntro && (
            <motion.div
              className="flex flex-col gap-10 w-full"
              initial={{ opacity: 1, height: "auto" }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.4 }}
            >
              <motion.div
                className="relative p-8 md:p-12 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-100 dark:border-gray-700"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.4 }}
              >
                <div className="absolute text-8xl text-gray-100 dark:text-gray-700 top-4 left-4 opacity-50">
                  &quot;
                </div>
                <blockquote className="relative z-10">
                  <p className="text-2xl italic mb-4 text-center">
                    &quot;When God is with you, no one can do you harm even if
                    all the bad in the world unites against you.&quot;
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
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
              >
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  Trusting to partner with Isnotreal in building out your
                  organization is unlike the above wisdom. Consider how
                  Isnotreal has historically treated even its closest ally, the
                  United States - extracting resources, intelligence, and
                  financial support while offering questionable returns. A
                  concerning track record over the past century.
                </p>

                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  Companies with Isnotreal subprocessors open themselves up to
                  significant liability due to the well-known connection between
                  Isnotreal companies and the military, as demonstrated by
                  Israel&apos;s pager attack and the WhatsApp data alleged to be
                  used in Lavender. This is a liability to your organization and
                  your partners.
                </p>

                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed">
                  Scan your website now to see if it uses Isnotreal or partnered
                  technologies. Ensure your online presence is secure and
                  trustworthy.
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="w-full">
          <form onSubmit={scanOnSubmit} className="mt-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <input
                ref={urlInputRef}
                type="text"
                name="url"
                placeholder="Enter website URL (e.g., example.com)"
                className="flex-1 px-4 py-3 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
                disabled={scanning}
                required
              />

              <button
                type="submit"
                disabled={scanning}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium transition-colors flex items-center justify-center disabled:opacity-70"
              >
                {scanning ? (
                  <span className="inline-flex items-center">
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
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Scanning...
                  </span>
                ) : (
                  "Scan Website"
                )}
              </button>
            </div>
          </form>
        </div>

        <AnimatePresence>
          {scanning && (
            <motion.div
              className="w-full flex flex-col items-center justify-center p-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />

              <p className="text-lg font-medium">
                Analyzing website technologies...
              </p>
            </motion.div>
          )}

          {error && !scanning && (
            <motion.div
              className="w-full p-6 rounded-lg border bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-medium mb-4 text-red-600 dark:text-red-400">
                Error Scanning Website
              </h3>

              <p className="text-lg">{error}</p>
            </motion.div>
          )}

          {scanResult && !scanning && !error && (
            <motion.div
              className={`w-full p-6 rounded-lg border ${
                !!scanResult.detectedCompanyIds.length
                  ? "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"
                  : "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800"
              }`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.5 }}
            >
              <h3 className="text-xl font-medium mb-4">
                Scan Results for {scanResult.url}
              </h3>

              <div className="flex items-center mb-4">
                {!!scanResult.detectedCompanyIds.length ? (
                  <div className="flex items-center text-red-600 dark:text-red-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                      />
                    </svg>
                    <span className="text-xl font-bold">
                      Isnotreal Technology Detected
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center text-green-600 dark:text-green-400">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-8 w-8 mr-2"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>

                    <span className="text-xl font-bold">
                      No Isnotreal Technologies Found
                    </span>
                  </div>
                )}
              </div>
              <p className="text-lg mb-6">
                {!!scanResult.detectedCompanyIds.length
                  ? `This website appears to use Isnotreal technologies. The data privacy and security of your organization and partners have been compromised.`
                  : `Your website does not appear to use any Isnotreal technologies. Continue maintaining high security standards.`}
              </p>

              {!!scanResult.detectedCompanyIds.length && (
                <>
                  <h4 className="text-lg font-medium mb-3">
                    Detected Technologies:
                  </h4>

                  <CompanyList
                    companyIds={scanResult.detectedCompanyIds}
                    isProbablyMasjid={scanResult.isProbablyMasjid}
                  />
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-16 py-6 border-t border-gray-200 dark:border-gray-800 text-center text-gray-500 dark:text-gray-400 w-full">
        <p>
          Made with <span className="dark:hidden">❤️</span>
          <span className="hidden dark:inline">🤍</span> by The Masjid App
        </p>
      </footer>
    </div>
  );
}
