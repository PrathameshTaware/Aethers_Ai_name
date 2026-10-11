import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // The old prototype routes now live inside the four real ones.
  async redirects() {
    return [
      { source: "/dashboard/:path*", destination: "/", permanent: false },
      { source: "/city-board", destination: "/", permanent: false },
      { source: "/conditions", destination: "/#how", permanent: false },
      { source: "/login", destination: "/today", permanent: false },
      { source: "/verification", destination: "/receipt", permanent: false },
      { source: "/verification/:id", destination: "/receipt/:id", permanent: false },
    ];
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
