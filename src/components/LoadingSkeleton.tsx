"use client";

export function DashboardSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="text-center mb-8 sm:mb-12 pt-2 sm:pt-4">
        <div className="h-8 bg-[#1E293B] rounded-lg w-64 mx-auto mb-3" />
        <div className="h-4 bg-[#1E293B] rounded w-80 mx-auto" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1E293B] border border-[#475569] rounded-xl px-5 py-4 h-20" />
        ))}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 max-w-4xl mx-auto">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-[#1E293B] border border-[#475569]/20 rounded-xl p-5 sm:p-8 h-44" />
        ))}
      </div>
    </div>
  );
}

export function ProjectsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="flex justify-between mb-8">
        <div>
          <div className="h-8 bg-[#1E293B] rounded-lg w-48 mb-2" />
          <div className="h-4 bg-[#1E293B] rounded w-72" />
        </div>
        <div className="h-10 bg-[#1E293B] rounded-lg w-32" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-[#1E293B] border border-[#475569]/20 rounded-xl p-6 h-72" />
        ))}
      </div>
    </div>
  );
}

export function PendingApprovalsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="mb-6 sm:mb-8">
        <div className="h-8 bg-[#1E293B] rounded-lg w-56 mb-2" />
        <div className="h-4 bg-[#1E293B] rounded w-72" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-[#1E293B] border border-[#475569] rounded-xl p-5 h-24" />
        ))}
      </div>
      <div className="space-y-4">
        {[1, 2].map((i) => (
          <div key={i} className="bg-[#1E293B] border border-[#475569]/20 rounded-xl p-6 h-48" />
        ))}
      </div>
    </div>
  );
}

export function PortalSkeleton() {
  return (
    <div className="max-w-3xl mx-auto animate-pulse">
      <div className="bg-[#1E293B] border border-[#475569]/20 rounded-xl h-48 mb-6" />
      <div className="bg-[#1E293B] border border-[#475569]/20 rounded-xl h-40 mb-6" />
      <div className="bg-[#1E293B] border border-[#475569]/20 rounded-xl h-16 mb-6" />
    </div>
  );
}
