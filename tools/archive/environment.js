// public/config/environment.js
// Simplified environment detection for Vercel deployment

export const getEnvironment = () => {
  // Use a URL parameter to force environment, e.g., http://localhost:5000?env=dev
  const urlParams = new URLSearchParams(window.location.search);
  const forcedEnv = urlParams.get("env");

  if (forcedEnv === "dev" || forcedEnv === "development") {
    return "development";
  }
  if (forcedEnv === "prod" || forcedEnv === "production") {
    return "production";
  }

  // Default: localhost is development, everything else (including Vercel) is production
  const hostname = window.location.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1"
    ? "development"
    : "production";
};

export const isDevelopment = () => getEnvironment() === "development";
export const isProduction = () => getEnvironment() === "production";

// Simple debug output
console.log("Environment detected:", getEnvironment());
