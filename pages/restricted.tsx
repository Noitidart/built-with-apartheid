import Head from 'next/head';

export default function BannedPage() {
  return (
    <>
      <Head>
        <title>Access Restricted - Built with Apartheid</title>
        <meta name="description" content="Your access has been restricted" />
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg
                  className="h-6 w-6 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>

              <h1 className="mt-6 text-2xl font-bold text-gray-900">
                Access Restricted
              </h1>

              <p className="mt-4 text-sm text-gray-600">
                Your access to this site has been restricted. If you believe
                this is an error, please contact the site administrators.
              </p>

              <div className="mt-6">
                <p className="text-xs text-gray-500">
                  Reference: Built with Apartheid
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
