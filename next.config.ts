/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Ensure Node runtime (you use better-sqlite3)
  // experimental: { runtime: 'nodejs' }, // only if you previously forced edge
};

export default nextConfig;
