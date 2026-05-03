import { useEffect } from 'react';
import { useRouter } from 'expo-router';

import { SplashScreen } from '../screens/SplashScreen';

export default function SplashRoute() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.replace('/home');
    }, 2000);
    return () => clearTimeout(timer);
  }, [router]);

  return <SplashScreen />;
}
