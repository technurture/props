'use client';

import { useEffect, useState } from 'react';
import { signOut, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function LogoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [status, setStatus] = useState('Clocking out...');

  useEffect(() => {
    const performLogout = async () => {
      try {
        if (session?.user) {
          setStatus('Clocking out...');
          try {
            const response = await fetch('/api/attendance', {
              method: 'PUT',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                userId: session.user.id
              })
            });

            if (response.ok) {
              console.log('Auto clock-out successful');
            } else {
              console.log('Clock-out not needed or already done');
            }
          } catch (error) {
            console.error('Clock-out error:', error);
          }
        }

        setStatus('Logging out...');
        await signOut({ 
          redirect: false,
          callbackUrl: '/' 
        });
        router.push('/');
        router.refresh();
      } catch (error) {
        console.error('Logout error:', error);
        router.push('/');
      }
    };

    performLogout();
  }, [router, session]);

  return (
    <div className="min-vh-100 d-flex align-items-center justify-content-center bg-light">
      <div className="text-center">
        <div className="spinner-border text-primary mb-3" role="status" style={{ width: '3rem', height: '3rem' }}>
          <span className="visually-hidden">{status}</span>
        </div>
        <p className="text-muted fs-5">{status}</p>
      </div>
    </div>
  );
}
