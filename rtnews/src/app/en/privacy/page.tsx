// ─── English Privacy Policy Page ─────────────────────────────────────
// Server Component — Privacy Policy for the Rouaa platform

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for the Rouaa financial news and analysis platform. Learn how we collect, use, and protect your personal information.',
};

export default function EnPrivacyPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Privacy Policy
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Last updated: March 2025
          </p>
        </div>

        {/* Intro */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-6"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <p className="text-sm leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
            At Rouaa, we take your privacy seriously. This Privacy Policy describes how we
            collect, use, disclose, and protect your personal information when you use our
            platform, website, mobile applications, and related services (collectively, the
            &quot;Services&quot;). We are committed to ensuring that your personal data is handled
            responsibly and in compliance with applicable data protection laws.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            By using our Services, you consent to the data practices described in this
            Privacy Policy. If you do not agree with the terms of this policy, please do
            not access or use the Services. We encourage you to review this policy
            periodically, as we may update it from time to time.
          </p>
        </div>

        {/* Sections */}
        {[
          {
            title: '1. Information We Collect',
            content: `We collect several types of information to provide and improve our Services:\n\nPersonal Information: When you create an account, we collect your name, email address, and any other information you voluntarily provide. This may include your phone number if you opt in to SMS or Telegram notifications.\n\nUsage Data: We automatically collect information about how you interact with the Services, including pages visited, time spent on pages, click patterns, browser type, device information, IP address, and referring URLs.\n\nCookies and Tracking: We use cookies and similar tracking technologies to enhance your experience, analyze trends, and gather demographic information. You can control cookie preferences through your browser settings.\n\nFinancial Preferences: If you customize your market watchlist, set price alerts, or save bookmarks, we store these preferences to personalize your experience.`,
          },
          {
            title: '2. How We Use Your Information',
            content: `We use the information we collect for the following purposes:\n\n• To provide, maintain, and improve the Services, including personalizing content and delivering relevant market news and signals.\n• To create and manage your account, authenticate your identity, and provide customer support.\n• To send you notifications, alerts, and communications you have opted in to receive, including price alerts, trading signals, and market updates.\n• To analyze usage patterns and trends to enhance our platform's functionality and user experience.\n• To detect, prevent, and address fraud, security breaches, and other potentially prohibited or illegal activities.\n• To comply with legal obligations and enforce our Terms of Service.`,
          },
          {
            title: '3. Information Sharing and Disclosure',
            content: `We do not sell your personal information to third parties. We may share your information in the following circumstances:\n\nService Providers: We may share information with trusted third-party service providers who assist us in operating the platform, such as cloud hosting providers, analytics services, and communication platforms. These providers are contractually obligated to handle your data securely and only for the purposes we specify.\n\nLegal Requirements: We may disclose your information if required by law, regulation, legal process, or governmental request. We may also disclose information when we believe in good faith that disclosure is necessary to protect our rights, your safety, or the safety of others.\n\nBusiness Transfers: In the event of a merger, acquisition, reorganization, or sale of assets, your personal information may be transferred as part of the transaction. We will notify you of any such transfer and your choices regarding your information.`,
          },
          {
            title: '4. Data Security',
            content: `We implement industry-standard security measures to protect your personal information from unauthorized access, alteration, disclosure, or destruction. These measures include encryption of data in transit and at rest, regular security audits, access controls, and secure infrastructure. However, no method of transmission over the Internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee its absolute security.`,
          },
          {
            title: '5. Data Retention',
            content: `We retain your personal information only for as long as necessary to fulfill the purposes for which it was collected, including satisfying any legal, accounting, or reporting requirements. When you delete your account, we will delete or anonymize your personal data within a reasonable period, except where we are required to retain certain information by law.`,
          },
          {
            title: '6. Your Rights',
            content: `Depending on your jurisdiction, you may have the following rights regarding your personal data:\n\n• Access: Request a copy of the personal data we hold about you.\n• Correction: Request correction of inaccurate or incomplete personal data.\n• Deletion: Request deletion of your personal data, subject to legal retention requirements.\n• Portability: Request transfer of your data in a machine-readable format.\n• Objection: Object to the processing of your data for certain purposes.\n• Restriction: Request restriction of processing of your data in certain circumstances.\n\nTo exercise any of these rights, please contact us at privacy@rouaa.com.`,
          },
          {
            title: '7. Third-Party Links',
            content: `Our Services may contain links to third-party websites or services that are not owned or controlled by Rouaa. This Privacy Policy does not apply to those third-party services. We encourage you to review the privacy policies of any third-party services you access, as we have no control over and assume no responsibility for their content, privacy policies, or practices.`,
          },
          {
            title: '8. Children\'s Privacy',
            content: `Our Services are not directed to individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected personal data from a child under 18, we will take steps to delete such information promptly. If you believe we have inadvertently collected information from a minor, please contact us immediately.`,
          },
          {
            title: '9. Changes to This Policy',
            content: `We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy on our platform and, where appropriate, by sending you a notification via email or in-app message. Your continued use of the Services after the effective date of any changes constitutes your acceptance of the updated policy.`,
          },
          {
            title: '10. Contact Us',
            content: `If you have questions or concerns about this Privacy Policy or our data practices, please contact us at privacy@rouaa.com or through our Contact page. We are committed to responding to your inquiries in a timely and transparent manner.`,
          },
        ].map(section => (
          <div
            key={section.title}
            className="rounded-2xl p-6 mb-4"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <h2
              className="text-base font-bold mb-3"
              style={{ color: 'var(--text, #E8EDF5)' }}
            >
              {section.title}
            </h2>
            <div className="text-sm leading-relaxed whitespace-pre-line" style={{ color: 'var(--text2, #B0C4D8)' }}>
              {section.content}
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
