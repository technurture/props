"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/services/api-client";
import { useRouter } from "next/navigation";
import { all_routes } from "@/router/all_routes";

interface Notification {
  _id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

interface NotificationsResponse {
  notifications: Notification[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

const SHOWN_NOTIFICATIONS_KEY = "shown_notifications";
const LAST_CLEANUP_KEY = "last_notifications_cleanup";
const POLL_INTERVAL = 30000;
const CLEANUP_INTERVAL = 24 * 60 * 60 * 1000;
const NOTIFICATION_SOUND_PATH = "/notification-sound.mp3";

const NotificationListener = () => {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    if (typeof window !== "undefined") {
      try {
        audioRef.current = new Audio(NOTIFICATION_SOUND_PATH);
        audioRef.current.volume = 0.9;
        audioRef.current.preload = "auto";
      } catch (error) {
        console.warn("Could not initialize notification audio:", error);
      }
    }
  }, []);

  const getShownNotifications = useCallback((): Set<string> => {
    try {
      const stored = localStorage.getItem(SHOWN_NOTIFICATIONS_KEY);
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch (error) {
      console.error("Error reading shown notifications:", error);
      return new Set();
    }
  }, []);

  const setShownNotifications = useCallback((notificationIds: Set<string>) => {
    try {
      localStorage.setItem(
        SHOWN_NOTIFICATIONS_KEY,
        JSON.stringify(Array.from(notificationIds))
      );
    } catch (error) {
      console.error("Error saving shown notifications:", error);
    }
  }, []);

  const cleanupOldNotifications = useCallback(() => {
    try {
      const lastCleanup = localStorage.getItem(LAST_CLEANUP_KEY);
      const now = Date.now();

      if (!lastCleanup || now - parseInt(lastCleanup) > CLEANUP_INTERVAL) {
        localStorage.removeItem(SHOWN_NOTIFICATIONS_KEY);
        localStorage.setItem(LAST_CLEANUP_KEY, now.toString());
      }
    } catch (error) {
      console.error("Error during cleanup:", error);
    }
  }, []);

  const playNotificationSoundWithWebAudio = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }

      const ctx = audioContextRef.current;
      
      const playTone = (frequency: number, startTime: number, duration: number) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, startTime);

        gainNode.gain.setValueAtTime(0, startTime);
        gainNode.gain.linearRampToValueAtTime(0.4, startTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, startTime + duration);

        oscillator.start(startTime);
        oscillator.stop(startTime + duration);
      };

      const now = ctx.currentTime;
      playTone(1318.51, now, 0.15);
      playTone(1567.98, now + 0.15, 0.15);
      playTone(1760, now + 0.3, 0.15);
    } catch (error) {
      console.warn("Could not play notification sound with Web Audio API:", error);
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    try {
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        const playPromise = audioRef.current.play();
        
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
            if (error.name === 'NotAllowedError' || error.name === 'NotSupportedError') {
              console.warn("Audio playback not allowed by browser policy. Playing fallback sound.");
              playNotificationSoundWithWebAudio();
            } else {
              console.warn("Could not play notification sound:", error);
              playNotificationSoundWithWebAudio();
            }
          });
        }
      } else {
        playNotificationSoundWithWebAudio();
      }
    } catch (error) {
      console.warn("Error playing notification sound:", error);
      playNotificationSoundWithWebAudio();
    }
  }, [playNotificationSoundWithWebAudio]);

  const getNotificationIcon = useCallback((type: string) => {
    switch (type) {
      case "success":
        return "✅";
      case "error":
        return "❌";
      case "warning":
        return "⚠️";
      case "appointment":
        return "📅";
      default:
        return "ℹ️";
    }
  }, []);

  const handleNotificationClick = useCallback(
    async (notificationId: string) => {
      try {
        await apiClient.put(
          `/api/notifications/${notificationId}/read`,
          { isRead: true },
          {
            showSuccessToast: false,
            showErrorToast: false,
          }
        );
        router.push(all_routes.notifications);
      } catch (error) {
        console.error("Error marking notification as read:", error);
      }
    },
    [router]
  );

  const showNotificationToast = useCallback(
    (notification: Notification) => {
      const icon = getNotificationIcon(notification.type);
      const messagePreview =
        notification.message.length > 120
          ? `${notification.message.substring(0, 120)}...`
          : notification.message;

      const getIconClass = (type: string) => {
        switch (type) {
          case "success":
            return "icon-success";
          case "error":
            return "icon-error";
          case "warning":
            return "icon-warning";
          case "appointment":
            return "icon-appointment";
          default:
            return "icon-info";
        }
      };

      const formatTimeAgo = (dateString: string) => {
        const now = new Date();
        const notificationDate = new Date(dateString);
        const diffInMs = now.getTime() - notificationDate.getTime();
        const diffInMins = Math.floor(diffInMs / 60000);

        if (diffInMins < 1) return "Just now";
        if (diffInMins < 60) return `${diffInMins}m ago`;
        if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)}h ago`;
        return `${Math.floor(diffInMins / 1440)}d ago`;
      };

      playNotificationSound();

      toast(
        <div className="notification-toast-content" style={{ 
          background: '#ffffff',
          borderRadius: '12px',
          overflow: 'hidden',
          width: '380px',
          maxWidth: '100%'
        }}>
          <div className="notification-toast-header" style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '12px',
            padding: '16px',
            borderBottom: '1px solid #f0f0f0'
          }}>
            <div className={`notification-icon-wrapper ${getIconClass(notification.type)}`} style={{
              flexShrink: 0,
              width: '48px',
              height: '48px',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px'
            }}>
              {icon}
            </div>
            <div className="notification-text-content" style={{ flex: 1, minWidth: 0 }}>
              <h6 className="notification-title" style={{
                fontSize: '15px',
                fontWeight: 600,
                color: '#1a1a1a',
                margin: '0 0 6px 0',
                lineHeight: 1.4
              }}>{notification.title}</h6>
              <p className="notification-message" style={{
                fontSize: '14px',
                color: '#666',
                margin: 0,
                lineHeight: 1.5
              }}>{messagePreview}</p>
            </div>
          </div>
          <div className="notification-toast-footer" style={{
            padding: '12px 16px',
            background: '#fafafa',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <span className="notification-time" style={{
              fontSize: '12px',
              color: '#999',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}>
              <i className="ti ti-clock" />
              {formatTimeAgo(notification.createdAt)}
            </span>
            <button
              className="notification-action-btn"
              style={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: '#fff',
                border: 'none',
                padding: '6px 16px',
                borderRadius: '6px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
              onClick={(e) => {
                e.stopPropagation();
                handleNotificationClick(notification._id);
              }}
            >
              <i className="ti ti-eye" />
              View Details
            </button>
          </div>
        </div>,
        {
          position: "top-right",
          autoClose: 8000,
          hideProgressBar: false,
          closeOnClick: false,
          pauseOnHover: true,
          draggable: true,
          className: "custom-notification-toast",
          type: notification.type === "error" ? "error" : notification.type === "warning" ? "warning" : notification.type === "success" ? "success" : "info",
        }
      );
    },
    [getNotificationIcon, handleNotificationClick, playNotificationSound]
  );

  const pollNotifications = useCallback(async () => {
    if (!session?.user) return;

    try {
      const response = await apiClient.get<NotificationsResponse>(
        `/api/notifications?page=1&limit=10`,
        { showErrorToast: false }
      );

      const notifications = response.notifications || [];
      const shownNotifications = getShownNotifications();
      const newShownNotifications = new Set(shownNotifications);

      notifications.forEach((notification) => {
        if (
          !notification.isRead &&
          !shownNotifications.has(notification._id)
        ) {
          showNotificationToast(notification);
          newShownNotifications.add(notification._id);
        }
      });

      if (newShownNotifications.size > shownNotifications.size) {
        setShownNotifications(newShownNotifications);
      }
    } catch (error) {
      console.error("Error polling notifications:", error);
    }
  }, [session?.user, getShownNotifications, setShownNotifications, showNotificationToast]);

  useEffect(() => {
    if (!isMounted) return;
    cleanupOldNotifications();
  }, [isMounted, cleanupOldNotifications]);

  useEffect(() => {
    if (!isMounted || status === "loading") return;

    if (status === "authenticated" && session?.user) {
      pollNotifications();

      pollingIntervalRef.current = setInterval(() => {
        pollNotifications();
      }, POLL_INTERVAL);
    } else {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    }

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
        pollingIntervalRef.current = null;
      }
    };
  }, [isMounted, status, session?.user, pollNotifications]);

  return null;
};

export default NotificationListener;
