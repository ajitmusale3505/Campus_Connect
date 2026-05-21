'use client';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [timeoutReached, setTimeoutReached] = useState(false);

  // Safety timeout: redirect to login after 2 seconds if still loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading timeout reached, redirecting to login');
        setTimeoutReached(true);
        router.replace('/login');
      }
    }, 2000);

    return () => clearTimeout(timeout);
  }, [loading, router]);

  useEffect(() => {
    if (!loading && !timeoutReached) {
      if (user) {
        switch (user.role) {
          case 'student':
            router.replace('/student');
            break;
          case 'teacher':
            router.replace('/teacher');
            break;
          case 'hod':
            router.replace('/hod');
            break;
          case 'principal':
            router.replace('/principal');
            break;
          default:
            router.replace('/login');
        }
      } else {
        router.replace('/login');
      }
    }
  }, [user, loading, router, timeoutReached]);

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-muted-foreground">Loading CampusConnect...</p>
      </div>
    </div>
  );
}
