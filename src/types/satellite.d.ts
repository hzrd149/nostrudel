interface Window {
  satellite?: {
    getLocalRelay: () => Promise<string>;
    getAdminAuth: () => Promise<string>;
  };
}
