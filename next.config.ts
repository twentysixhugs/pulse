
import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'picsum.photos',
        port: '',
        pathname: '/**',
      },
    ],
  },
  env: {
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: 'studio-2674085050-7674d',
    NEXT_PUBLIC_FIREBASE_APP_ID: '1:826559198124:web:b08ad5b597771bff20c009',
    NEXT_PUBLIC_FIREBASE_API_KEY: 'AIzaSyBn7D8FSpuZZSorl8jFEfEDy1O-ixV5vb0',
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: 'studio-2674085050-7674d.firebaseapp.com',
    NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '826559198124',
  }
};

export default nextConfig;
