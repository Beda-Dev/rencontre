// Minimal ambient types for Google Identity Services (loaded via <Script>
// from https://accounts.google.com/gsi/client) — just enough for the
// "server auth code" flow used in login/page.tsx.

interface GoogleCodeClientConfig {
  client_id: string;
  scope: string;
  ux_mode: "popup" | "redirect";
  callback: (response: { code?: string; error?: string }) => void;
}

interface GoogleCodeClient {
  requestCode: () => void;
}

interface Window {
  google?: {
    accounts: {
      oauth2: {
        initCodeClient: (config: GoogleCodeClientConfig) => GoogleCodeClient;
      };
    };
  };
}
