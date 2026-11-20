import type { Metadata } from 'next';
import { Press_Start_2P, Silkscreen, JetBrains_Mono } from 'next/font/google';
import { mergeClassNames } from '@/lib/helpers/mergeClassNames';
import '@/app/globals.css';

// The `variable` names must differ from the Tailwind theme variables (--font-sans, --font-mono,
// --font-pixel) that consume them in globals.css — see the comment on the theme's font block.
const pixelHeading = Press_Start_2P({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-family-pixel-heading',
  display: 'swap',
});

const pixelBody = Silkscreen({
  weight: ['400', '700'],
  subsets: ['latin'],
  variable: '--font-family-pixel-body',
  display: 'swap',
});

const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-family-mono',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Multi-Effect Builder',
  description: 'Guitar multi-effect pedalboard builder with real-time audio processing',
};

interface Props {
  children: React.ReactNode;
}

/** Root layout: loads the three app fonts and exposes them to the theme as CSS variables. */
export default function RootLayout({ children }: Props) {
  return (
    <html
      lang="en"
      className={mergeClassNames(pixelHeading.variable, pixelBody.variable, mono.variable)}
    >
      <body>{children}</body>
    </html>
  );
}
