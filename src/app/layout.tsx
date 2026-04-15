import type { Metadata } from 'next';
import Link from 'next/link';
import './globals.css';

export const metadata: Metadata = {
  title: 'ClaudeLoop',
  description: 'Schedule tasks for Claude Code',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-gray-950 text-gray-100 min-h-screen antialiased">
        <header className="border-b border-gray-800 px-6 py-4">
          <Link href="/" className="text-lg font-semibold tracking-tight text-white hover:text-gray-300 transition-colors">
            ClaudeLoop
          </Link>
          <span className="ml-3 text-xs text-gray-500">Schedule tasks for Claude Code</span>
        </header>
        <main className="max-w-5xl mx-auto px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
