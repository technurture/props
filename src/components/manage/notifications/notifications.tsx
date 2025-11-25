"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import { all_routes } from "@/router/all_routes";
import Link from "next/link";
import { apiClient } from "@/lib/services/api-client";
import { UserRole } from "@/types/emr";

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
  recipient?: {
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

const NotificationsComponent = () => {
  const { data: session } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPrevPage: false,
  });

  const [formData, setFormData] = useState({
    title: "",
    message: "",
    type: "info",
    targetType: "all",
    targetValue: "",
  });

  const [users, setUsers] = useState<any[]>([]);

  const isAdmin = session?.user?.role === UserRole.ADMIN;

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: "20",
        ...(isAdmin && { viewAll: "true" }),
      });

      const response = await apiClient.get<NotificationsResponse>(
        `/api/notifications?${params.toString()}`,
        { showErrorToast: true }
      );

      setNotifications(response.notifications || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.currentPage, isAdmin]);

  const fetchUsers = useCallback(async () => {
    if (!isAdmin) return;
    try {
      const response = await apiClient.get<any>(
        `/api/staff?limit=1000`,
        { showErrorToast: false }
      );
      setUsers(response.staff || []);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  }, [isAdmin]);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  useEffect(() => {
    if (showCreateModal) {
      fetchUsers();
    }
  }, [showCreateModal, fetchUsers]);

  const handleMarkAsRead = async (id: string, isRead: boolean = true) => {
    try {
      await apiClient.put(`/api/notifications/${id}/read`, { isRead }, {
        successMessage: `Notification marked as ${isRead ? 'read' : 'unread'}`,
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to update notification status:", error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await apiClient.put(`/api/notifications/mark-all-read`, {}, {
        successMessage: "All notifications marked as read",
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to mark all notifications as read:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/notifications/${id}`, {
        successMessage: "Notification deleted successfully",
      });
      setDeleteConfirmId(null);
      fetchNotifications();
    } catch (error) {
      console.error("Failed to delete notification:", error);
    }
  };

  const handleDeleteAll = async () => {
    try {
      await apiClient.delete(`/api/notifications?all=true`, {
        successMessage: "All notifications deleted successfully",
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to delete all notifications:", error);
    }
  };

  const handleCreateNotification = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiClient.post(`/api/notifications`, formData, {
        successMessage: "Notification sent successfully",
      });
      setShowCreateModal(false);
      setFormData({
        title: "",
        message: "",
        type: "info",
        targetType: "all",
        targetValue: "",
      });
      fetchNotifications();
    } catch (error) {
      console.error("Failed to create notification:", error);
    }
  };

  const formatTime = (date: string) => {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffInMs = now.getTime() - notificationDate.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);

    if (diffInMins < 1) return "Just now";
    if (diffInMins < 60) return `${diffInMins} min ago`;
    if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)} hours ago`;
    return `${Math.floor(diffInMins / 1440)} days ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "success":
        return "ti-check-circle";
      case "error":
        return "ti-alert-circle";
      case "warning":
        return "ti-alert-triangle";
      case "appointment":
        return "ti-calendar";
      default:
        return "ti-info-circle";
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Notifications</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Notifications</li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              <button
                onClick={fetchNotifications}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Refresh"
                data-bs-original-title="Refresh"
              >
                <i className="ti ti-refresh" />
              </button>
              {isAdmin && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="btn btn-primary"
                >
                  <i className="ti ti-bell-plus me-1" />
                  Send Notification
                </button>
              )}
            </div>
          </div>

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-3 justify-content-between">
              <h5 className="d-inline-flex align-items-center mb-0">
                Notifications
                <span className="badge bg-danger ms-2">
                  {loading ? "..." : pagination.totalCount}
                </span>
              </h5>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <button 
                  onClick={handleMarkAllAsRead} 
                  className="btn btn-outline-light"
                  disabled={loading || notifications.length === 0}
                >
                  <i className="ti ti-checks me-1" />
                  Mark all as read
                </button>
                {isAdmin && (
                  <button
                    onClick={handleDeleteAll}
                    className="btn btn-danger"
                    disabled={loading || notifications.length === 0}
                  >
                    <i className="ti ti-trash me-1" />
                    Delete All
                  </button>
                )}
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-bell-off fs-1 text-muted mb-2 d-block" />
                  <p className="text-muted mb-0">No notifications found</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification._id}
                    className={`card notication-card mb-3 ${
                      !notification.isRead ? "border-primary" : ""
                    }`}
                  >
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                        <div className="d-flex align-items-center flex-grow-1">
                          <div className="avatar flex-shrink-0 me-2">
                            <span className={`avatar-title rounded-circle bg-${notification.type === "success" ? "success" : notification.type === "error" ? "danger" : notification.type === "warning" ? "warning" : "info"}-transparent`}>
                              <i className={`${getNotificationIcon(notification.type)} fs-20`} />
                            </span>
                          </div>
                          <div className="flex-grow-1">
                            <h6 className="mb-1 fw-semibold">{notification.title}</h6>
                            <p className="mb-1">{notification.message}</p>
                            <div className="d-flex align-items-center gap-3 flex-wrap">
                              <p className="fs-12 mb-0 d-inline-flex align-items-center text-muted">
                                <i className="ti ti-clock me-1" />
                                {formatTime(notification.createdAt)}
                              </p>
                              {notification.sender && (
                                <p className="fs-12 mb-0 d-inline-flex align-items-center text-muted">
                                  <i className="ti ti-user me-1" />
                                  {notification.sender.firstName} {notification.sender.lastName}
                                </p>
                              )}
                              {!notification.isRead && (
                                <span className="badge bg-primary">New</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="noti-btn d-flex gap-2">
                          {!notification.isRead ? (
                            <button
                              onClick={() => handleMarkAsRead(notification._id, true)}
                              className="btn btn-sm btn-success d-inline-flex align-items-center"
                            >
                              <i className="ti ti-check me-1" />
                              Mark Read
                            </button>
                          ) : (
                            <button
                              onClick={() => handleMarkAsRead(notification._id, false)}
                              className="btn btn-sm btn-outline-secondary d-inline-flex align-items-center"
                            >
                              <i className="ti ti-mail me-1" />
                              Mark Unread
                            </button>
                          )}
                          <button
                            onClick={() => setDeleteConfirmId(notification._id)}
                            className="btn btn-sm btn-danger d-inline-flex align-items-center"
                            data-bs-toggle="modal"
                            data-bs-target="#delete_modal"
                          >
                            <i className="ti ti-trash me-1" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {!loading && notifications.length > 0 && pagination.totalPages > 1 && (
              <div className="card-footer">
                <div className="d-flex justify-content-between align-items-center">
                  <div className="text-muted">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                    {pagination.totalCount} notifications
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${!pagination.hasPrevPage ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                          disabled={!pagination.hasPrevPage}
                        >
                          Previous
                        </button>
                      </li>
                      <li className="page-item active">
                        <span className="page-link">{pagination.currentPage}</span>
                      </li>
                      <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                          disabled={!pagination.hasNextPage}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              </div>
            )}
          </div>
        </div>
        <CommonFooter />
      </div>

      {/* Create Notification Modal */}
      {isAdmin && (
        <div 
          className={`modal fade ${showCreateModal ? 'show d-block' : ''}`} 
          style={{ backgroundColor: showCreateModal ? 'rgba(0,0,0,0.5)' : 'transparent' }}
          onClick={() => setShowCreateModal(false)}
        >
          <div className="modal-dialog modal-dialog-centered" onClick={(e) => e.stopPropagation()}>
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Send Notification</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowCreateModal(false)}
                />
              </div>
              <form onSubmit={handleCreateNotification}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Title <span className="text-danger">*</span></label>
                    <input
                      type="text"
                      className="form-control"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Message <span className="text-danger">*</span></label>
                    <textarea
                      className="form-control"
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      required
                    />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Type</label>
                    <select
                      className="form-select"
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="info">Info</option>
                      <option value="success">Success</option>
                      <option value="warning">Warning</option>
                      <option value="error">Error</option>
                      <option value="appointment">Appointment</option>
                    </select>
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Send To</label>
                    <select
                      className="form-select"
                      value={formData.targetType}
                      onChange={(e) => setFormData({ ...formData, targetType: e.target.value, targetValue: "" })}
                    >
                      <option value="all">All Users</option>
                      <option value="role">Specific Department</option>
                      <option value="user">Specific User</option>
                    </select>
                  </div>
                  {formData.targetType === "role" && (
                    <div className="mb-3">
                      <label className="form-label">Select Department</label>
                      <select
                        className="form-select"
                        value={formData.targetValue}
                        onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                        required
                      >
                        <option value="">Choose Department</option>
                        <option value={UserRole.DOCTOR}>Doctors</option>
                        <option value={UserRole.NURSE}>Nurses</option>
                        <option value={UserRole.LAB}>Lab</option>
                        <option value={UserRole.PHARMACY}>Pharmacy</option>
                        <option value={UserRole.BILLING}>Billing</option>
                        <option value={UserRole.ACCOUNTING}>Accounting</option>
                        <option value={UserRole.FRONT_DESK}>Front Desk</option>
                      </select>
                    </div>
                  )}
                  {formData.targetType === "user" && (
                    <div className="mb-3">
                      <label className="form-label">Select User</label>
                      <select
                        className="form-select"
                        value={formData.targetValue}
                        onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                        required
                      >
                        <option value="">Choose User</option>
                        {users.map((user) => (
                          <option key={user._id} value={user._id}>
                            {user.firstName} {user.lastName} ({user.email})
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Send Notification
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="delete_modal" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center">
              <div className="mb-2">
                <span className="avatar avatar-md rounded-circle bg-danger">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h6 className="fs-16 mb-1">Confirm Deletion</h6>
              <p className="mb-3">Are you sure you want to delete this notification?</p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-white w-100"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger w-100"
                  onClick={() => {
                    if (deleteConfirmId) {
                      handleDelete(deleteConfirmId);
                    }
                  }}
                  data-bs-dismiss="modal"
                >
                  Yes, Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default NotificationsComponent;
