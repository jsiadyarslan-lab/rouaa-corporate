import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'رؤى — أخبار وتحليلات الأسواق المالية',
  description: 'منصة رؤى للأخبار المالية والتداول — مدعومة بالذكاء الاصطناعي',
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#0a0a1a',
};

export default function TgLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" className="dark">
      <head>
        {/* Telegram WebApp SDK — must be loaded before our app code */}
        <script src="https://telegram.org/js/telegram-web-app.js" async />
      </head>
      <body
        style={{
          margin: 0,
          padding: 0,
          background: '#0a0a1a',
          color: '#B0C4D8',
          direction: 'rtl',
          fontFamily: 'var(--font-readex-pro), var(--font-cairo), system-ui, -apple-system, sans-serif',
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
          overflowX: 'hidden',
          minHeight: '100vh',
        }}
      >
        {children}
      </body>
    </html>
  );
}
