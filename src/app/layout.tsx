import type { Metadata } from 'next';
import { Toaster } from "@/components/ui/toaster"
import { ThemeProvider } from '@/components/theme-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'CodeForge',
  description: 'A powerful and intuitive code editor for developers, featuring AI-powered error detection and auto-completion.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="data:image/svg+xml,<svg xmlns=%27http://www.w3.org/2000/svg%27 viewBox=%270 0 100 100%27><rect width=%27100%27 height=%27100%27 rx=%2720%27 fill=%27%231E293B%27></rect><text x=%2750%27 y=%2758%27 font-size=%2750%27 fill=%27%2394A3B8%27 text-anchor=%27middle%27 font-family=%27monospace%27>%26lt;/%26gt;</text></svg>" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Source+Code+Pro:wght@400;500&family=Space+Grotesk:wght@500;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased">
        <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem
            disableTransitionOnChange
        >
          {children}
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
