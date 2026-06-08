import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BharatPredict — Trade What India Thinks',
  description: 'Predict sports, politics, finance, and culture in real time. Optimized Indian onboarding prediction platform.',
  icons: {
    icon: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🇮🇳</text></svg>" />
      </head>
      <body className="bg-background text-foreground antialiased font-sans">
        {children}
      </body>
    </html>
  );
}
