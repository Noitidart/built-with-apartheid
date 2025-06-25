import Link from 'next/link';
import { usePlausible } from 'next-plausible';

interface LearnTmaButtonProps {
  hostname?: string;
}

const LearnTmaButton = ({ hostname }: LearnTmaButtonProps = {}) => {
  const plausible = usePlausible();
  
  const trackTmaLinkClick = function trackTmaLinkClick() {
    plausible('tma_link_clicked', {
      props: {
        hostname: hostname || 'unknown',
        source: 'company_article'
      }
    });
  };
  
  return (
    <Link
      href="https://themasjidapp.org"
      target="_blank"
      rel="noopener noreferrer"
      onClick={trackTmaLinkClick}
      className="inline-flex items-center justify-center w-full px-5 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 transition-colors"
    >
      Learn How The Masjid App Can Help Your Masjid
      <svg
        xmlns="http://www.w3.org/2000/svg"
        className="h-5 w-5 ml-2"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 8l4 4m0 0l-4 4m4-4H3"
        />
      </svg>
    </Link>
  );
};

export default LearnTmaButton;
