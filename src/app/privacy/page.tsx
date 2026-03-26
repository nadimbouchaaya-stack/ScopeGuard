import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-[#A3A3A3]">
      <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
      <p className="text-sm text-[#525252] mb-8">Last updated: March 26, 2026</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
          <p className="mb-2">When you use ScopeGuard, we collect:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-white">Account Information:</strong> Name, email address, and password when you create an account.</li>
            <li><strong className="text-white">Project Data:</strong> Project names, deliverables, client information, deadlines, and pricing that you enter into the platform.</li>
            <li><strong className="text-white">Change Requests:</strong> Descriptions, cost impacts, and approval statuses of change requests.</li>
            <li><strong className="text-white">Usage Data:</strong> How you interact with ScopeGuard, including pages visited and features used.</li>
            <li><strong className="text-white">Onboarding Responses:</strong> Optional survey answers provided during signup.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h2>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>To provide and maintain the ScopeGuard platform.</li>
            <li>To send transactional emails (scope approvals, change request notifications, bug report confirmations).</li>
            <li>To improve our product based on usage patterns and feedback.</li>
            <li>To communicate important updates about the service.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. Data Storage & Security</h2>
          <p>Your data is stored securely using Supabase, which provides enterprise-grade security including Row Level Security (RLS), encryption at rest, and encryption in transit. We do not sell, rent, or share your personal data with third parties for marketing purposes.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Client Portal Data</h2>
          <p>When you share a project portal link with a client, they can view project deliverables, submit change requests, and approve scopes. Clients do not need to create an account. Portal access is limited to the specific project shared via the unique link.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Third-Party Services</h2>
          <p className="mb-2">ScopeGuard integrates with the following third-party services:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li><strong className="text-white">Supabase:</strong> Database and authentication.</li>
            <li><strong className="text-white">Resend:</strong> Transactional email delivery.</li>
            <li><strong className="text-white">Vercel:</strong> Hosting and deployment.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Cookies & Local Storage</h2>
          <p>We use local storage to remember your preferences (theme, monthly goal, onboarding status). We use essential cookies for authentication. We do not use tracking cookies or third-party analytics.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Data Deletion</h2>
          <p>You can delete your account and all associated data at any time by contacting us. Upon deletion, all project data, change requests, and personal information will be permanently removed.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">8. Changes to This Policy</h2>
          <p>We may update this privacy policy from time to time. We will notify registered users of any material changes via email.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">9. Contact</h2>
          <p>If you have questions about this privacy policy, contact us at <a href="mailto:nadimbouchaaya@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline">nadimbouchaaya@gmail.com</a>.</p>
        </section>
      </div>

      <div className="mt-12 pt-6 border-t border-[#2A2A2A] text-center">
        <Link href="/" className="text-indigo-400 hover:text-indigo-300 text-sm">
          &larr; Back to Home
        </Link>
      </div>
    </div>
  );
}
