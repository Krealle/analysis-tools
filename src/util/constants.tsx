export const WCL_CLIENT_ID = (() => {
  if (!import.meta.env.VITE_WCL_CLIENT_ID) {
    throw new Error('missing environment variable: "WCL_CLIENT_ID"');
  }

  return import.meta.env.VITE_WCL_CLIENT_ID;
})();

export const WCL_CLIENT_SECRET = (() => {
  if (!import.meta.env.VITE_WCL_CLIENT_SECRET) {
    throw new Error('missing environment variable: "CLIENT_SECRET"');
  }

  return import.meta.env.VITE_WCL_CLIENT_SECRET;
})();
