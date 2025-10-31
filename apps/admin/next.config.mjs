/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@repo/ui", "@repo/graphql"],
  images: {
    domains: ["res.cloudinary.com"],
  },
};

export default nextConfig;
