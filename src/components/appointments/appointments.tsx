"use client";
import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { useSession } from "next-auth/react";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import { all_routes } from "@/router/all_routes";
import Link from "next/link";
import { apiClient } from "@/lib/services/api-client";
import { PaginationInfo } from "@/types/emr";
import { usePermissions } from "@/hooks/usePermissions";

const AppointmentModal = lazy(() => import("./modal/appointmentModal"));

interface AppointmentData {
  _id: string;
  appointmentNumber: string;
  patientId: {
    _id: string;
    patientId: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    email?: string;
  };
  doctorId: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
    phoneNumber?: string;
  };
  branchId?: {
    _id: string;
    name: string;
    address?: string;
  };
  appointmentDate: string;
  appointmentTime: string;
  duration: number;
  status: string;
  type: string;
  reasonForVisit: string;
  notes?: string;
}

interface AppointmentsResponse {
  appointments: AppointmentData[];
  pagination: PaginationInfo;
}

const AppointmentComponent = () => {
  const { data: session } = useSession();
  const { can, canEditResource, userRole } = usePermissions();
  const [appointments, setAppointments] = useState<AppointmentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedAppointment, setSelectedAppointment] = useState<AppointmentData | null>(null);
  const [editAppointmentId, setEditAppointmentId] = useState<string | null>(null);

  const fetchAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        sortBy: sortBy,
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await apiClient.get<AppointmentsResponse>(
        `/api/appointments?${params.toString()}`,
        { showErrorToast: true }
      );

      setAppointments(response.appointments || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch appointments:", error);
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, sortBy]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).bootstrap && appointments.length > 0) {
      const dropdownElementList = document.querySelectorAll('[data-bs-toggle="dropdown"]');
      dropdownElementList.forEach((dropdownToggleEl) => {
        if (!(window as any).bootstrap.Dropdown.getInstance(dropdownToggleEl)) {
          new (window as any).bootstrap.Dropdown(dropdownToggleEl);
        }
      });
    }
  }, [appointments]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAppointments();
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/appointments/${id}`, {
        successMessage: "Appointment cancelled successfully",
      });
      setDeleteConfirmId(null);
      fetchAppointments();
    } catch (error) {
      console.error("Failed to cancel appointment:", error);
    }
  };

  const handleViewAppointment = (appointment: AppointmentData) => {
    setSelectedAppointment(appointment);
  };

  const handleEditAppointment = (appointmentId: string) => {
    setEditAppointmentId(appointmentId);
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status.toUpperCase()) {
      case 'SCHEDULED':
        return 'badge-soft-purple';
      case 'CONFIRMED':
        return 'badge-soft-info';
      case 'IN_PROGRESS':
        return 'badge-soft-warning';
      case 'COMPLETED':
        return 'badge-soft-success';
      case 'CANCELLED':
        return 'badge-soft-danger';
      case 'NO_SHOW':
        return 'badge-soft-secondary';
      default:
        return 'badge-soft-secondary';
    }
  };

  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <tr key={index}>
        <td>
          <div className="placeholder-glow">
            <span className="placeholder col-6"></span>
          </div>
        </td>
        <td>
          <div className="placeholder-glow">
            <span className="placeholder col-8"></span>
          </div>
        </td>
        <td>
          <div className="placeholder-glow">
            <span className="placeholder col-8"></span>
          </div>
        </td>
        <td>
          <div className="placeholder-glow">
            <span className="placeholder col-7"></span>
          </div>
        </td>
        <td>
          <div className="placeholder-glow">
            <span className="placeholder col-6"></span>
          </div>
        </td>
        <td>
          <div className="placeholder-glow">
            <span className="placeholder col-5"></span>
          </div>
        </td>
      </tr>
    ));
  };

  const isAdmin = userRole === "ADMIN";

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Appointments</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Appointments</li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              <button
                onClick={fetchAppointments}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Refresh"
                data-bs-original-title="Refresh"
              >
                <i className="ti ti-refresh" />
              </button>
              <Link
                href="#"
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Print"
                data-bs-original-title="Print"
              >
                <i className="ti ti-printer" />
              </Link>
              <Link
                href="#"
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Download"
                data-bs-original-title="Download"
              >
                <i className="ti ti-cloud-download" />
              </Link>
              {can('appointment:create') && (
                <Link
                  href="#"
                  className="btn btn-primary d-inline-flex align-items-center"
                  data-bs-toggle="modal"
                  data-bs-target="#add_modal"
                  onClick={() => setEditAppointmentId(null)}
                >
                  <i className="ti ti-square-rounded-plus me-1" />
                  New Appointment
                </Link>
              )}
            </div>
          </div>

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h5 className="d-inline-flex align-items-center mb-0">
                Total Appointments
                <span className="badge bg-danger ms-2">{pagination.totalCount}</span>
              </h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <form onSubmit={handleSearch} className="me-2">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search appointments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="btn btn-outline-secondary" type="submit">
                      <i className="ti ti-search" />
                    </button>
                  </div>
                </form>
                <div className="dropdown">
                  <Link
                    href="#"
                    className="dropdown-toggle btn btn-md btn-outline-light d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                    aria-label="Sort menu"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="ti ti-sort-descending-2 me-1" />
                    <span className="me-1">Sort By : </span> {sortBy === 'newest' ? 'Newest' : 'Oldest'}
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-2">
                    <li>
                      <Link 
                        href="#" 
                        className={`dropdown-item rounded-1 ${sortBy === 'newest' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setSortBy('newest');
                          setCurrentPage(1);
                        }}
                      >
                        Newest
                      </Link>
                    </li>
                    <li>
                      <Link 
                        href="#" 
                        className={`dropdown-item rounded-1 ${sortBy === 'oldest' ? 'active' : ''}`}
                        onClick={(e) => {
                          e.preventDefault();
                          setSortBy('oldest');
                          setCurrentPage(1);
                        }}
                      >
                        Oldest
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive table-nowrap">
                <table className="table mb-0 border">
                  <thead className="table-light">
                    <tr>
                      <th>Appointment ID</th>
                      <th>Patient Name</th>
                      <th>Doctor Name</th>
                      <th className="no-sort">Date & Time</th>
                      <th className="no-sort">Reason</th>
                      <th className="no-sort">Status</th>
                      {isAdmin && <th>Branch</th>}
                      <th className="no-sort" />
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      renderSkeletonRows()
                    ) : appointments.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 8 : 7} className="text-center py-5">
                          <p className="text-muted">No appointments found</p>
                        </td>
                      </tr>
                    ) : (
                      appointments.map((appointment) => (
                        <tr key={appointment._id}>
                          <td>
                            <Link
                              href="#"
                              data-bs-toggle="modal"
                              data-bs-target="#view_modal"
                              onClick={() => handleViewAppointment(appointment)}
                            >
                              {appointment.appointmentNumber}
                            </Link>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {appointment.patientId?._id && (
                                <Link
                                  href={`${all_routes.patientDetails}?id=${appointment.patientId._id}`}
                                  className="avatar avatar-xs me-2"
                                >
                                  <ImageWithBasePath
                                    src="assets/img/avatars/avatar-31.jpg"
                                    alt="patient"
                                    className="rounded"
                                  />
                                </Link>
                              )}
                              <div>
                                <h6 className="fs-14 mb-0 fw-medium">
                                  {appointment.patientId?._id ? (
                                    <Link href={`${all_routes.patientDetails}?id=${appointment.patientId._id}`}>
                                      {appointment.patientId?.firstName} {appointment.patientId?.lastName}
                                    </Link>
                                  ) : (
                                    <span>N/A</span>
                                  )}
                                </h6>
                                <span className="fs-12 text-muted">{appointment.patientId?.patientId || 'N/A'}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              {appointment.doctorId?._id && (
                                <Link
                                  href={`${all_routes.doctorDetails}?id=${appointment.doctorId._id}`}
                                  className="avatar avatar-xs me-2"
                                >
                                  <ImageWithBasePath
                                    src="assets/img/doctors/doctor-01.jpg"
                                    alt="doctor"
                                    className="rounded"
                                  />
                                </Link>
                              )}
                              <div>
                                <h6 className="fs-14 mb-0 fw-medium">
                                  {appointment.doctorId?._id ? (
                                    <Link href={`${all_routes.doctorDetails}?id=${appointment.doctorId._id}`}>
                                      Dr. {appointment.doctorId?.firstName} {appointment.doctorId?.lastName}
                                    </Link>
                                  ) : (
                                    <span>N/A</span>
                                  )}
                                </h6>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div>
                              <p className="mb-0">{formatDate(appointment.appointmentDate)}</p>
                              <span className="fs-12 text-muted">{formatTime(appointment.appointmentTime)}</span>
                            </div>
                          </td>
                          <td>
                            <span className="text-truncate d-inline-block" style={{ maxWidth: '200px' }}>
                              {appointment.reasonForVisit}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                              {appointment.status.replace('_', ' ')}
                            </span>
                          </td>
                          {isAdmin && (
                            <td>
                              {appointment.branchId?.name || 'N/A'}
                            </td>
                          )}
                          <td className="text-end">
                            <div className="d-flex gap-2 justify-content-end">
                              <Link
                                href="#"
                                className="btn btn-sm btn-icon btn-light"
                                data-bs-toggle="modal"
                                data-bs-target="#view_modal"
                                onClick={(e) => {
                                  e.preventDefault();
                                  handleViewAppointment(appointment);
                                }}
                                title="View Details"
                              >
                                <i className="ti ti-eye" />
                              </Link>
                              {can('appointment:update') && (
                                userRole === 'DOCTOR' 
                                  ? appointment.doctorId?._id === session?.user?.id && (
                                      <Link
                                        href="#"
                                        className="btn btn-sm btn-icon btn-light"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit_modal"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleEditAppointment(appointment._id);
                                        }}
                                        title="Edit"
                                      >
                                        <i className="ti ti-edit" />
                                      </Link>
                                    )
                                  : canEditResource(appointment.doctorId?._id) && (
                                      <Link
                                        href="#"
                                        className="btn btn-sm btn-icon btn-light"
                                        data-bs-toggle="modal"
                                        data-bs-target="#edit_modal"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          handleEditAppointment(appointment._id);
                                        }}
                                        title="Edit"
                                      >
                                        <i className="ti ti-edit" />
                                      </Link>
                                    )
                              )}
                              {userRole === 'DOCTOR' && appointment.doctorId?._id === session?.user?.id && (
                                <Link
                                  href={`${all_routes.doctorQueue}`}
                                  className="btn btn-sm btn-icon btn-light"
                                  title="View in Queue"
                                >
                                  <i className="ti ti-stethoscope" />
                                </Link>
                              )}
                              {can('appointment:delete') && (
                                userRole === 'DOCTOR'
                                  ? appointment.doctorId?._id === session?.user?.id && (
                                      <button
                                        onClick={() => setDeleteConfirmId(appointment._id)}
                                        className="btn btn-sm btn-icon btn-light"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete_modal"
                                        title="Delete"
                                      >
                                        <i className="ti ti-trash" />
                                      </button>
                                    )
                                  : canEditResource(appointment.doctorId?._id) && (
                                      <button
                                        onClick={() => setDeleteConfirmId(appointment._id)}
                                        className="btn btn-sm btn-icon btn-light"
                                        data-bs-toggle="modal"
                                        data-bs-target="#delete_modal"
                                        title="Delete"
                                      >
                                        <i className="ti ti-trash" />
                                      </button>
                                    )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && appointments.length > 0 && (
                <div className="d-flex align-items-center justify-content-between flex-wrap mt-3">
                  <div className="dataTables_info">
                    Showing {((currentPage - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(currentPage * pagination.limit, pagination.totalCount)} of{" "}
                    {pagination.totalCount} entries
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${!pagination.hasPreviousPage ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={!pagination.hasPreviousPage}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: Math.min(pagination.totalPages, 5) }, (_, i) => {
                        let page;
                        if (pagination.totalPages <= 5) {
                          page = i + 1;
                        } else if (currentPage <= 3) {
                          page = i + 1;
                        } else if (currentPage >= pagination.totalPages - 2) {
                          page = pagination.totalPages - 4 + i;
                        } else {
                          page = currentPage - 2 + i;
                        }
                        return (
                          <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                            <button
                              className="page-link"
                              onClick={() => setCurrentPage(page)}
                            >
                              {page}
                            </button>
                          </li>
                        );
                      })}
                      <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage + 1)}
                          disabled={!pagination.hasNextPage}
                        >
                          Next
                        </button>
                      </li>
                    </ul>
                  </nav>
                </div>
              )}
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <AppointmentModal 
          onSuccess={fetchAppointments}
          selectedAppointment={selectedAppointment}
          editAppointmentId={editAppointmentId}
        />
      </Suspense>

      <div className="modal fade" id="delete_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative">
              <div className="mb-2 position-relative z-1">
                <span className="avatar avatar-md bg-danger rounded-circle">
                  <i className="ti ti-trash fs-24" />
                </span>
              </div>
              <h5 className="mb-1">Cancel Appointment</h5>
              <p className="mb-3">Are you sure you want to cancel this appointment?</p>
              <div className="d-flex justify-content-center gap-2">
                <button
                  type="button"
                  className="btn btn-white position-relative z-1 w-100"
                  data-bs-dismiss="modal"
                >
                  No, Keep It
                </button>
                <button
                  type="button"
                  className="btn btn-danger position-relative z-1 w-100"
                  onClick={() => {
                    if (deleteConfirmId) {
                      handleDelete(deleteConfirmId);
                    }
                  }}
                  data-bs-dismiss="modal"
                >
                  Yes, Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppointmentComponent;
