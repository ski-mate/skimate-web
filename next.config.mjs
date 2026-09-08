/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [390, 640, 828, 1080, 1440, 1920, 2560],
    imageSizes: [16, 32, 64, 128, 256, 384],
  },
};

export default nextConfig;
