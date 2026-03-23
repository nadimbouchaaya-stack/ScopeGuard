"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ApproveRedirect() {
  const params = useParams();
  const router = useRouter();
  const projectId = params.projectId as string;

  useEffect(() => {
    router.replace(`/portal/${projectId}`);
  }, [projectId, router]);

  return (
    <div className="text-center py-20">
      <p className="text-[#94A3B8]">Redirecting to your project portal...</p>
    </div>
  );
}
