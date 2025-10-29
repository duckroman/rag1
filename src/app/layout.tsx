import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import ThemeRegistry from './ThemeRegistry'; // Assuming this is the correct path for ThemeRegistry

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
  return (
    <html lang="en">
      <body className={inter.className} style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <ThemeRegistry>
          <main style={{ flex: 1 }}>
            {children}
          </main>
          <footer style={{ padding: '1rem', marginTop: 'auto', textAlign: 'right' }}>
            <p>
              &copy; JRC 2025
            </p>
          </footer>
        </ThemeRegistry>
      </body>
    </html>
  );
}
