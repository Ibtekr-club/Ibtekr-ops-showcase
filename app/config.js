// Supabase project the app talks to. Fill in your own project's URL and its PUBLIC publishable key (RLS protects the data).
// Empty key = not configured: sign-in says so and the rest of the app still loads. The demo (`npm run demo`) brings its own.
// `||` lets a test preset window.IB_CONFIG (Playwright addInitScript).
window.IB_CONFIG = window.IB_CONFIG || {
  supabaseUrl: 'https://<project-ref>.supabase.co',
  supabaseAnonKey: '',
};
