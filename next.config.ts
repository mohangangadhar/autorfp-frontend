import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
  { key: "X-DNS-Prefetch-Control", value: "off" },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains",
  },
];

const nextConfig: NextConfig = {
  output: "standalone",
  reactStrictMode: true,
  poweredByHeader: false,
  allowedDevOrigins: ["127.0.0.1", "localhost"],
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async rewrites() {
    // Same-origin API proxy: the browser calls /api/v1/* on this (HTTPS) app
    // and the Next server relays to the backend. This keeps the browser on
    // HTTPS even when the backend is plain HTTP (mixed-content is blocked by
    // browsers). Resolved at build/start from the server env.
    const backendUrl = (
      process.env.BACKEND_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000"
    ).replace(/\/+$/, "");
    return [
      {
        source: "/api/v1/:path*",
        destination: `${backendUrl}/api/v1/:path*`,
      },
    ];
  },
};

const sentryWebpackPluginOptions = {
  silent: true,
  telemetry: false,
  autoInstrumentServerFunctions: false,
};

export default withSentryConfig(nextConfig, sentryWebpackPluginOptions);