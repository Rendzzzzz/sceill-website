/** @type {import('next').NextConfig} */
const nextConfig = {
  // Tambahkan allowedDevOrigins untuk akses dari network
  allowedDevOrigins: ['172.20.10.5', 'localhost', '192.168.110.188'],
  experimental: {
    // Jika diperlukan
  },
}

module.exports = nextConfig