import type { Metadata } from 'next';
import '../styles/globals.css';

export const metadata: Metadata = {
  title: 'Summit Path - Trail Planner',
  description: 'Automatisez votre planification de courses trail',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#003426" />
      </head>
      <body className="bg-background text-on-background">
        {children}
      </body>
    </html>
  );
}
