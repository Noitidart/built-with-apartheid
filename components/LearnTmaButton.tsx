import Link from "next/link";

const LearnTmaButton = () => {
  return (
    <Link
      href="https://themasjidapp.com"
      target="_blank"
      rel="noopener noreferrer"
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
