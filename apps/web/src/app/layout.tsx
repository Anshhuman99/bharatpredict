import type { Metadata } from 'next';
import './globals.css';
import ToastContainer from '../components/ToastContainer';

export const metadata: Metadata = {
  title: 'BharatPredict — Trade What India Thinks',
  description: 'Predict sports, politics, finance, and culture in real time. Optimized Indian onboarding prediction platform.',
  icons: {
    icon: '/favicon.ico',
  },
  openGraph: {
    title: 'BharatPredict — Trade What India Thinks',
    description: 'Predict sports, politics, finance, and culture in real time. India\'s premier event prediction market sandbox.',
    url: 'https://bharatpredict.in',
    siteName: 'BharatPredict',
    images: [
      {
        url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=630&q=80',
        width: 1200,
        height: 630,
        alt: 'BharatPredict — Trade What India Thinks',
      },
    ],
    locale: 'en_IN',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BharatPredict — Trade What India Thinks',
    description: 'Predict sports, politics, finance, and culture in real time. India\'s premier event prediction market sandbox.',
    images: ['https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1200&h=630&q=80'],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>🇮🇳</text></svg>" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const storedTheme = localStorage.getItem('theme');
                  if (storedTheme === 'light') {
                    document.documentElement.classList.remove('dark');
                    document.documentElement.classList.add('light');
                  } else {
                    document.documentElement.classList.remove('light');
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="bg-background text-foreground antialiased font-sans">
        {children}
        <ToastContainer />
      </body>
    </html>
  );
}
