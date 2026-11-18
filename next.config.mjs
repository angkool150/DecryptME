/** @type {import('next').NextConfig} */
const nextConfig = {
    allowedDevOrigins: ['192.168.254.101', '192.168.254.103', '192.168.56.1'],
    serverExternalPackages: [
        'pg',
        '@supabase/supabase-js',
        'bcryptjs',
        'jsonwebtoken',
        'express',
        'cors',
        'dotenv',
    ],
}

export default nextConfig
