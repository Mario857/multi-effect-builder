import type { Metadata } from 'next';
import { Press_Start_2P, Silkscreen, JetBrains_Mono } from 'next/font/google';
import '@/app/globals.css';

const pixelHeading = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-pixel',
  display: 'swap',
});

const pixelBody = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-pixel-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Multi-Effect Builder',
  description: 'Guitar multi-effect pedalboard builder with real-time audio processing',
};

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en" className={`${pixelHeading.variable} ${pixelBody.variable} ${mono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
