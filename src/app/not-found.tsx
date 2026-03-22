import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0F172A] flex items-center justify-center px-4">
      <div className="bg-[#1E293B] border border-[#475569] rounded-2xl p-8 sm:p-12 text-center max-w-md w-full">
        <div className="w-16 h-16 bg-[#6366F1]/15 border border-[#6366F1]/20 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg
            className="w-8 h-8 text-[#6366F1]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
            />
          </svg>
        </div>

        <h1 className="text-6xl font-extrabold text-[#6366F1] mb-2">404</h1>
        <p className="text-xl font-semibold text-[#F1F5F9] mb-1">Page not found</p>
        <p className="text-[#94A3B8] text-sm mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <Link
          href="/dashboard"
          className="inline-block bg-[#6366F1] hover:bg-[#5558E6] text-[#F1F5F9] font-semibold px-8 py-3 rounded-xl transition-all hover:scale-105 text-sm"
        >
          Go to Dashboard
        </Link>
      </div>
    </div>
  );
}
