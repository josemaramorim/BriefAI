import createMiddleware from 'next-intl/middleware';
import { locales } from './i18n/request';

export default createMiddleware({
  // A list of all locales that are supported
  locales: ['pt', 'en', 'es'],

  // Used when no locale matches
  defaultLocale: 'pt',
  
  // Always show locale prefix
  localePrefix: 'always',
  
  // Disable automatic locale detection - always use default
  localeDetection: false
});

export const config = {
  // Match only internationalized pathnames
  matcher: [
    // Match all pathnames except for
    // - … if they start with `/api`, `/_next` or `/_vercel`
    // - … the ones containing a dot (e.g. `favicon.ico`)
    '/((?!api|_next|_vercel|.*\\..*).*)'
  ]
};
