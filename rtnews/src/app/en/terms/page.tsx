// ─── English Terms of Service Page ────────────────────────────────────
// Server Component — Terms of Service for the Rouaa platform

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for the Rouaa financial news and analysis platform. Read our terms governing the use of our services.',
};

export default function EnTermsPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Terms of Service
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
            Welcome to Rouaa. These Terms of Service (&quot;Terms&quot;) govern your access to and use
            of the Rouaa platform, including our website, mobile applications, APIs, and all
            related services (collectively, the &quot;Services&quot;). By accessing or using our Services,
            you agree to be bound by these Terms. If you do not agree with any part of these
            Terms, you must discontinue use of the Services immediately.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            These Terms constitute a legally binding agreement between you (&quot;User,&quot; &quot;you,&quot; or
            &quot;your&quot;) and Rouaa (&quot;we,&quot; &quot;us,&quot; or &quot;our&quot;). We reserve the right to modify these
            Terms at any time, and your continued use of the Services after any changes
            constitutes your acceptance of the updated Terms.
          </p>
        </div>

        {/* Sections */}
        {[
          {
            title: '1. Eligibility',
            content: `You must be at least 18 years of age to use our Services. By using the Services, you represent and warrant that you are at least 18 years old and have the legal capacity to enter into these Terms. If you are using the Services on behalf of an organization, you represent that you have the authority to bind that organization to these Terms. Users under the age of 18 are strictly prohibited from accessing or using the platform.`,
          },
          {
            title: '2. Account Registration',
            content: `Certain features of the Services may require you to create an account. You agree to provide accurate, current, and complete information during registration and to update such information as necessary. You are responsible for safeguarding your account credentials and for all activities that occur under your account. You must notify us immediately of any unauthorized use of your account. We shall not be liable for any loss or damage arising from your failure to maintain the security of your account.`,
          },
          {
            title: '3. Acceptable Use',
            content: `You agree to use the Services only for lawful purposes and in accordance with these Terms. You shall not: (a) use the Services in any way that violates applicable laws or regulations; (b) attempt to gain unauthorized access to any part of the Services or its related systems; (c) use the Services to transmit any malicious software, spam, or unauthorized content; (d) interfere with or disrupt the integrity or performance of the Services; (e) copy, modify, or distribute any part of the Services without our prior written consent; (f) use automated scripts or bots to access the Services without authorization.`,
          },
          {
            title: '4. Intellectual Property',
            content: `All content, features, and functionality of the Services — including but not limited to text, graphics, logos, icons, images, audio clips, data compilations, and software — are the exclusive property of Rouaa or its licensors and are protected by international copyright, trademark, patent, and other intellectual property laws. You may not reproduce, distribute, modify, create derivative works of, publicly display, or exploit any content from the Services without our express written permission.`,
          },
          {
            title: '5. Financial Information Disclaimer',
            content: `The Services provide financial news, analysis, and trading signals for informational purposes only. Nothing on the platform constitutes financial, investment, legal, or tax advice. You should not interpret any content as a recommendation or solicitation to buy, sell, or hold any financial instrument. All trading and investment decisions are solely your responsibility. Past performance is not indicative of future results, and you should always consult with a qualified financial advisor before making any investment decisions.`,
          },
          {
            title: '6. Limitation of Liability',
            content: `To the fullest extent permitted by law, Rouaa and its officers, directors, employees, and agents shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, or goodwill, arising out of or in connection with your use of the Services. This limitation applies regardless of the legal theory under which such damages are sought, whether in contract, tort, strict liability, or otherwise.`,
          },
          {
            title: '7. Indemnification',
            content: `You agree to indemnify, defend, and hold harmless Rouaa and its officers, directors, employees, and agents from and against any and all claims, liabilities, damages, losses, and expenses (including reasonable attorney fees) arising out of or in any way connected with your access to or use of the Services, your violation of these Terms, or your violation of any rights of another party.`,
          },
          {
            title: '8. Termination',
            content: `We reserve the right to suspend or terminate your access to the Services at any time, with or without cause, and with or without notice. Upon termination, your right to use the Services will immediately cease. All provisions of these Terms that by their nature should survive termination — including ownership provisions, warranty disclaimers, indemnification, and limitations of liability — shall survive termination.`,
          },
          {
            title: '9. Governing Law',
            content: `These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Rouaa operates, without regard to its conflict of law provisions. Any disputes arising from or in connection with these Terms shall be resolved through binding arbitration in accordance with the applicable arbitration rules, or in the courts of the relevant jurisdiction.`,
          },
          {
            title: '10. Contact',
            content: `If you have any questions about these Terms of Service, please contact us through our Contact page or email us at legal@rouaa.com. We are committed to addressing your concerns promptly and transparently.`,
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
            <p
              className="text-sm leading-relaxed"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              {section.content}
            </p>
          </div>
        ))}
      </div>
    </main>
  );
}
