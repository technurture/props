"use client";

import React, { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Modal } from 'react-bootstrap';
import { apiClient } from '@/lib/services/api-client';

interface ClockInGuardProps {
  children: React.ReactNode;
}

export default function ClockInGuard({ children }: ClockInGuardProps) {
  const { data: session, status } = useSession();
  const [showModal, setShowModal] = useState(false);
  const [isClockingIn, setIsClockingIn] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const checkClockInStatus = async () => {
      if (status !== 'authenticated' || !session?.user?.id) {
        if (status === 'unauthenticated' || status === 'authenticated') {
          setIsChecking(false);
        }
        return;
      }

      if (hasChecked) {
        return;
      }

      try {
        const response = await apiClient.get<{ hasClockedIn: boolean; attendanceId?: string }>(
          '/api/clocking/staff-status',
          { showErrorToast: false }
        );

        if (!response.hasClockedIn) {
          setShowModal(true);
        }
      } catch (error) {
        console.error('Failed to check clock-in status:', error);
      } finally {
        setIsChecking(false);
        setHasChecked(true);
      }
    };

    checkClockInStatus();
  }, [status, session?.user?.id, hasChecked]);

  useEffect(() => {
    setHasChecked(false);
    setShowModal(false);
  }, [session?.user?.id]);

  const handleClockIn = async () => {
    if (!session?.user?.id || isClockingIn) return;

    setIsClockingIn(true);
    try {
      await apiClient.post('/api/attendance', {
        userId: session.user.id
      }, {
        successMessage: 'Successfully clocked in!',
      });
      
      setShowModal(false);
    } catch (error: any) {
      console.error('Clock-in failed:', error);
    } finally {
      setIsClockingIn(false);
    }
  };

  if (status === 'loading') {
    return null;
  }

  if (status === 'unauthenticated') {
    return <>{children}</>;
  }

  if (isChecking) {
    return null;
  }

  return (
    <>
      {children}
      
      <Modal
        show={showModal}
        backdrop="static"
        keyboard={false}
        centered
        className="clock-in-modal"
      >
        <Modal.Body className="text-center p-5">
          <div className="mb-4">
            <i className="ti ti-clock fs-1 text-primary" aria-hidden="true" />
          </div>
          <h3 className="mb-3">Please Clock-In</h3>
          <p className="text-muted mb-4">
            You need to clock in before accessing the system
          </p>
          <button
            className="btn btn-primary btn-lg px-5"
            onClick={handleClockIn}
            disabled={isClockingIn}
            type="button"
          >
            {isClockingIn ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                Clocking In...
              </>
            ) : (
              <>
                <i className="ti ti-login me-2" aria-hidden="true" />
                Clock In
              </>
            )}
          </button>
        </Modal.Body>
      </Modal>
    </>
  );
}
