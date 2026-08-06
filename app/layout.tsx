import '@/app/ui/global.css';
import { ThemeProvider } from '@/app/ui/theme/theme-provider';

// Runs before hydration so the correct theme class is present for first
// paint — otherwise a dark-mode visitor briefly sees the light theme flash.
// The storage key here must match THEME_STORAGE_KEY in theme-provider.tsx.
const noFlashThemeScript = `
(function () {
  try {
    var stored = localStorage.getItem('taskboard-theme');
    var theme = stored === 'light' || stored === 'dark'
      ? stored
      : (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: noFlashThemeScript }} />
      </head>
      <body className="bg-white text-gray-900 transition-colors dark:bg-gray-900 dark:text-gray-100">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
