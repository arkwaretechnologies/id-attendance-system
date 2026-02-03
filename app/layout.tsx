import './globals.css';
import Providers from './Providers';
import type { Viewport } from 'next';

export const metadata = {
  title: 'ID Attendance System',
  description: 'ID Attendance System',
};

// Viewport meta: width=device-width, initial-scale=1 for responsive behavior
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
