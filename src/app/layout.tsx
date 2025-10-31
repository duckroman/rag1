import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ThemeRegistry from './ThemeRegistry';
import Script from 'next/script';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: "Chatea con tus documentos",
  description: "Upload documents and chat with them.",
  icons: [{
    rel: 'icon',
    url: '/rag_favicon.png',
  }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const polyfill = `
    if (typeof Promise.withResolvers === 'undefined') {
      Promise.withResolvers = function withResolvers() {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
          resolve = res;
          reject = rej;
        });
        return { promise, resolve, reject };
      };
    }
  `;

  return (
    <html lang="en">
      <body className={inter.className} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Script id="promise-with-resolvers-polyfill" strategy="beforeInteractive">
          {polyfill}
        </Script>
        <ThemeRegistry>
          <main style={{ flex: 1 }}>
            {children}
          </main>
        </ThemeRegistry>
      </body>
    </html>
  );
}
