import { COMPANIES } from '@/constants/companies';
import { useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';
import Modal from 'react-modal';

function formatCompanyList(companies: typeof COMPANIES) {
  const names = companies.map((c) => c.name);
  if (names.length === 1) return names[0];
  if (names.length === 2) return names.join(' and ');
  return names.slice(0, -1).join(', ') + ', and ' + names[names.length - 1];
}

export default function ScanInfoMessage({
  hostname,
  detectedCompanies,
  websiteId,
  scanId
}: {
  hostname: string;
  detectedCompanies: string[];
  websiteId: number;
  scanId?: number;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const queryClient = useQueryClient();
  const [reportType, setReportType] = useState('scan-wrong');

  // For accessibility
  if (typeof document !== 'undefined') {
    Modal.setAppElement('#__next');
  }

  async function handleSend() {
    setLoading(true);
    setError(null);
    try {
      await axios.post(`/api/v1/${websiteId}/report`, {
        message,
        scanId,
        reportType
      });
      setIsModalOpen(false);
      setMessage('');
      // Refetch timeline to show the new report
      queryClient.invalidateQueries({ queryKey: ['timeline', websiteId] });
      // alert('Thank you for your report!');
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(
        err?.response?.data?._errors?.formErrors?.[0] ||
          'Failed to send report.'
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900 text-yellow-900 dark:text-yellow-100 rounded">
      <p>
        <strong>Note:</strong> We only scan for {formatCompanyList(COMPANIES)}.
        We&apos;ll be adding support for more sites in the future.
      </p>
      <div className="mt-2 flex items-center justify-start ">
        <span>Think this is a mistake?</span>
        <button
          className="bg-yellow-50 dark:bg-yellow-900/80  border-yellow-200 dark:border-yellow-800 underline  text-yellow-700 dark:text-yellow-400 sm:text-small px-1 py-1 sm:px-2  rounded-lg text-sm flex items-center gap-1 transition-colors duration-200  shadow-sm"
          onClick={() => setIsModalOpen(true)}
        >
          Report
        </button>
      </div>
      <span>
        Want to help improve detection?{' '}
        <a
          rel="noopener noreferrer"
          target="_blank"
          href="https://techforpalestine.org/get-involved/"
          // className="underline decoration-solid underline-offset-2"
          className="bg-yellow-50 dark:bg-yellow-900/80  border-yellow-200 dark:border-yellow-800 underline  text-yellow-700 dark:text-yellow-400 sm:text-small rounded-lg text-sm gap-1 transition-colors duration-200  shadow-sm"
        >
          Join here
        </a>
      </span>
      <Modal
        isOpen={isModalOpen}
        onRequestClose={() => setIsModalOpen(false)}
        className="w-full max-w-md mx-auto mt-20 bg-white dark:bg-gray-800 rounded-lg shadow-xl outline-none"
        overlayClassName="fixed inset-0 bg-black/25 dark:bg-black/50 flex items-start justify-center p-4 overflow-y-auto z-[100]"
        contentLabel="Report mistake dialog"
      >
        <div className="p-6">
          <div className="mb-4">
            <h2 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
              Report a mistake
            </h2>
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-1">
              Site: <span className="font-medium">{hostname}</span>
            </div>
            <div className="text-sm text-gray-700 dark:text-gray-300 mb-3">
              Status:{' '}
              {detectedCompanies.length === 0 ? (
                <span className="font-medium text-green-600 dark:text-green-400">
                  clean
                </span>
              ) : (
                <span className="font-medium text-red-600 dark:text-red-400">
                  Infected with {detectedCompanies.join(', ')}
                </span>
              )}
            </div>
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Report type:
              </label>
              <div className="flex flex-col gap-1">
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="reportType"
                    value="scan-wrong"
                    checked={reportType === 'scan-wrong'}
                    onChange={() => setReportType('scan-wrong')}
                  />
                  Scan is wrong (false positive/negative)
                </label>
                <label className="inline-flex items-center gap-2">
                  <input
                    type="radio"
                    name="reportType"
                    value="scan-right-other-vuln"
                    checked={reportType === 'scan-right-other-vuln'}
                    onChange={() => setReportType('scan-right-other-vuln')}
                  />
                  Scan is correct, but website has other known vulnerabilities
                </label>
              </div>
            </div>
          </div>
          <textarea
            className="w-full min-h-[80px] px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:border-yellow-500 text-gray-900 dark:text-white mb-4"
            placeholder="Describe the mistake or provide additional details..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            disabled={loading}
          />
          {error && <div className="text-red-500 text-sm mb-2">{error}</div>}
          <div className="flex gap-3 justify-end">
            <button
              className="px-4 py-2 rounded border border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
              onClick={() => setIsModalOpen(false)}
              type="button"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              className={`px-4 py-2 rounded bg-blue-600 text-white font-semibold 
              ${!message.trim() || loading ? 'cursor-not-allowed bg-blue-600/40 ' : 'cursor-pointer hover:bg-blue-700 '}`}
              onClick={handleSend}
              type="button"
              disabled={!message.trim() || loading}
            >
              {loading ? 'Sending...' : 'Send'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
