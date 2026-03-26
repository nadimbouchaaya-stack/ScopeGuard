import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-16 text-[#A3A3A3]">
      <h1 className="text-3xl font-bold text-white mb-2">Terms of Service</h1>
      <p className="text-sm text-[#525252] mb-8">Last updated: March 26, 2026</p>

      <div className="space-y-8 text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-3">1. Acceptance of Terms</h2>
          <p>By accessing or using ScopeGuard (&quot;the Service&quot;), you agree to be bound by these Terms of Service. If you do not agree, do not use the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">2. Description of Service</h2>
          <p>ScopeGuard is a project scope management tool designed for freelancers. It allows users to define project scopes, track change requests, share client portals, and manage deadlines. The Service is provided &quot;as is&quot; and &quot;as available.&quot;</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">3. User Accounts</h2>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>You must provide accurate and complete information when creating an account.</li>
            <li>You are responsible for maintaining the security of your account credentials.</li>
            <li>You are responsible for all activity that occurs under your account.</li>
            <li>You must notify us immediately of any unauthorized use of your account.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">4. Acceptable Use</h2>
          <p className="mb-2">You agree not to:</p>
          <ul className="list-disc list-inside space-y-1 ml-2">
            <li>Use the Service for any unlawful purpose.</li>
            <li>Attempt to gain unauthorized access to any part of the Service.</li>
            <li>Interfere with or disrupt the Service or servers.</li>
            <li>Upload malicious code or content.</li>
            <li>Use the Service to send spam or unsolicited communications.</li>
            <li>Impersonate another person or entity.</li>
          </ul>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">5. Your Data</h2>
          <p>You retain ownership of all data you enter into ScopeGuard. We do not claim any intellectual property rights over your project data, client information, or content. You grant us a limited license to store and process your data solely for the purpose of providing the Service.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">6. Client Portal</h2>
          <p>When you share a portal link with a client, you are responsible for the content displayed. ScopeGuard facilitates communication between you and your clients but is not a party to any agreement between you and your clients.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">7. Limitation of Liability</h2>
          <p>ScopeGuard is not liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, data, or business opportunities. Our total liability shall not exceed the amount you paid for the Service in the 12 months preceding the claim.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">8. Disclaimer of Warranties</h2>
          <p>The Service is provided &quot;as is&quot; without warranties of any kind, whether express or implied, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">9. Termination</h2>
          <p>We reserve the right to suspend or terminate your account at any time for violation of these terms. You may terminate your account at any time by contacting us. Upon termination, your data will be deleted in accordance with our Privacy Policy.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">10. Changes to Terms</h2>
          <p>We may modify these terms at any time. Continued use of the Service after changes constitutes acceptance of the modified terms. We will notify registered users of material changes via email.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-3">11. Contact</h2>
          <p>For questions about these terms, contact us at <a href="mailto:nadimbouchaaya@gmail.com" className="text-indigo-400 hover:text-indigo-300 underline">nadimbouchaaya@gmail.com</a>.</p>
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
