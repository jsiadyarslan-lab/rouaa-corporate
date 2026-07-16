// ─── English Contact Page ────────────────────────────────────────────
// Server Component — Contact information for the Rouaa platform

import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contact Us',
  description:
    'Get in touch with the Rouaa team. Find our contact information, support channels, and social media links.',
};

export default function EnContactPage() {
  return (
    <main className="min-h-screen" dir="ltr" style={{ background: 'var(--bg)' }}>
      <div className="max-w-4xl mx-auto px-4 pt-6 pb-12">
        {/* Header */}
        <div className="mb-8">
          <h1
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Contact Us
          </h1>
          <p className="text-sm" style={{ color: 'var(--text3, #8A9DB2)' }}>
            We are here to help. Reach out to us through any of the channels below.
          </p>
        </div>

        {/* Intro Card */}
        <div
          className="rounded-2xl p-6 md:p-8 mb-6"
          style={{
            background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
            border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
          }}
        >
          <p className="text-base leading-relaxed mb-4" style={{ color: 'var(--text2, #B0C4D8)' }}>
            Whether you have a question about our platform, need technical support,
            want to report an issue, or are interested in partnership opportunities,
            our team is ready to assist you. We aim to respond to all inquiries
            within 24–48 business hours.
          </p>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text2, #B0C4D8)' }}>
            For the fastest response, please use the appropriate contact channel
            listed below. Including relevant details — such as your account email,
            the page you were on, or a screenshot of the issue — will help us
            resolve your inquiry more efficiently.
          </p>
        </div>

        {/* Contact Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          {[
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan, #00E5FF)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              ),
              title: 'Email',
              detail: 'support@rouaa.com',
              sub: 'General inquiries & support',
              accent: 'rgba(0,229,255,0.08)',
              border: 'rgba(0,229,255,0.2)',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--purple, #8B5CF6)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 11.5a8.38 8.38 0 01-.9 3.8 8.5 8.5 0 01-7.6 4.7 8.38 8.38 0 01-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 01-.9-3.8 8.5 8.5 0 014.7-7.6 8.38 8.38 0 013.8-.9h.5a8.48 8.48 0 018 8v.5z" />
                </svg>
              ),
              title: 'Telegram',
              detail: '@rouaa_support',
              sub: 'Real-time chat & notifications',
              accent: 'rgba(139,92,246,0.08)',
              border: 'rgba(139,92,246,0.2)',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--gold, #d4af37)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              ),
              title: 'Business Inquiries',
              detail: 'partnerships@rouaa.com',
              sub: 'Partnerships & advertising',
              accent: 'rgba(212,175,55,0.08)',
              border: 'rgba(212,175,55,0.2)',
            },
            {
              icon: (
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="var(--cyan, #00E5FF)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" />
                </svg>
              ),
              title: 'Technical Support',
              detail: 'tech@rouaa.com',
              sub: 'Bug reports & platform issues',
              accent: 'rgba(0,229,255,0.08)',
              border: 'rgba(0,229,255,0.2)',
            },
          ].map(channel => (
            <div
              key={channel.title}
              className="rounded-2xl p-5"
              style={{
                background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
              }}
            >
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  background: channel.accent,
                  border: `1px solid ${channel.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '14px',
                }}
              >
                {channel.icon}
              </div>
              <h3
                className="text-sm font-bold mb-1"
                style={{ color: 'var(--text, #E8EDF5)' }}
              >
                {channel.title}
              </h3>
              <p
                className="text-sm font-medium mb-1"
                style={{ color: 'var(--cyan, #00E5FF)' }}
              >
                {channel.detail}
              </p>
              <p className="text-xs" style={{ color: 'var(--text3, #8A9DB2)' }}>
                {channel.sub}
              </p>
            </div>
          ))}
        </div>

        {/* Social Media */}
        <div className="mb-6">
          <h2
            className="text-lg font-bold mb-4"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Follow Us
          </h2>
          <div
            className="rounded-2xl p-6"
            style={{
              background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
            }}
          >
            <p
              className="text-sm leading-relaxed mb-4"
              style={{ color: 'var(--text2, #B0C4D8)' }}
            >
              Stay connected with Rouaa on social media for the latest market updates,
              platform announcements, and community discussions. Follow us for real-time
              insights and join a growing community of traders and investors.
            </p>
            <div className="flex flex-wrap gap-3">
              {[
                { name: 'X (Twitter)', handle: '@rouaa_news' },
                { name: 'Telegram', handle: 't.me/rouaa_news' },
                { name: 'LinkedIn', handle: 'Rouaa Financial' },
                { name: 'YouTube', handle: 'Rouaa Finance' },
              ].map(social => (
                <span
                  key={social.name}
                  className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium"
                  style={{
                    background: 'rgba(0,229,255,0.06)',
                    border: '1px solid rgba(0,229,255,0.15)',
                    color: 'var(--text2, #B0C4D8)',
                  }}
                >
                  {social.name}: <span style={{ color: 'var(--cyan, #00E5FF)', marginLeft: '4px' }}>{social.handle}</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* FAQ-style Section */}
        <div className="mb-6">
          <h2
            className="text-lg font-bold mb-4"
            style={{ color: 'var(--text, #E8EDF5)' }}
          >
            Common Questions
          </h2>
          <div className="space-y-3">
            {[
              {
                q: 'How do I report a bug or technical issue?',
                a: 'Send an email to tech@rouaa.com with a description of the issue, the browser or device you are using, and any relevant screenshots. Our technical team typically responds within 24 hours.',
              },
              {
                q: 'How do I request a feature or improvement?',
                a: 'We love hearing from our users! Send your feature requests to support@rouaa.com or message us on Telegram. We review all suggestions and prioritize them based on community demand.',
              },
              {
                q: 'How can I advertise or partner with Rouaa?',
                a: 'For advertising, sponsorships, or strategic partnerships, please reach out to partnerships@rouaa.com with a brief description of your proposal. Our business development team will get back to you.',
              },
            ].map(faq => (
              <div
                key={faq.q}
                className="rounded-xl p-4"
                style={{
                  background: 'var(--bg-elevated, rgba(255,255,255,0.04))',
                  border: '1px solid var(--border-subtle, rgba(255,255,255,0.08))',
                }}
              >
                <h3
                  className="text-sm font-semibold mb-2"
                  style={{ color: 'var(--text, #E8EDF5)' }}
                >
                  {faq.q}
                </h3>
                <p
                  className="text-xs leading-relaxed"
                  style={{ color: 'var(--text3, #8A9DB2)' }}
                >
                  {faq.a}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Office Info */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: 'rgba(139,92,246,0.04)',
            border: '1px solid rgba(139,92,246,0.12)',
          }}
        >
          <p
            className="text-sm font-medium mb-2"
            style={{ color: 'var(--purple, #8B5CF6)' }}
          >
            Rouaa Financial Intelligence
          </p>
          <p className="text-xs leading-relaxed" style={{ color: 'var(--text3, #8A9DB2)' }}>
            Operating globally with a distributed team across multiple time zones,
            ensuring our platform runs 24/7 to serve traders and investors worldwide.
          </p>
        </div>
      </div>
    </main>
  );
}
