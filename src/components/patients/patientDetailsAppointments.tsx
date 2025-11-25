"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import PatientDetailsHeader from "./PatientDetailsHeader";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { toast } from "react-toastify";
import { format } from "date-fns";

const PatientDetailsAppointmentsComponent = () => {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");

  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const limit = 10;

  const fetchAppointments = async () => {
    if (!patientId) {
      toast.error("Patient ID not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/appointments?patient=${patientId}&page=${currentPage}&limit=${limit}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch appointments");
      }

      const data = await response.json();
      setAppointments(data.appointments || []);
      setTotalPages(data.pagination?.totalPages || 1);
      setTotalCount(data.pagination?.totalCount || 0);
    } catch (error: any) {
      console.error("Error fetching appointments:", error);
      toast.error(error.message || "Failed to fetch appointments");
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [patientId, currentPage, sortOrder]);

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch {
      return "N/A";
    }
  };

  const formatTime = (date: string | Date) => {
    try {
      return format(new Date(date), "hh:mm a");
    } catch {
      return "N/A";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "confirmed":
        return "badge badge-soft-success";
      case "pending":
        return "badge badge-soft-warning";
      case "cancelled":
        return "badge badge-soft-danger";
      case "completed":
        return "badge badge-soft-info";
      default:
        return "badge badge-soft-secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPage ? "active" : ""}`}>
          <button
            className="page-link"
            onClick={() => setCurrentPage(i)}
            disabled={loading}
          >
            {i}
          </button>
        </li>
      );
    }

    return (
      <nav aria-label="Appointments pagination">
        <ul className="pagination justify-content-center mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              aria-label="Previous page"
            >
              <i className="ti ti-chevron-left" />
            </button>
          </li>
          {startPage > 1 && (
            <>
              <li className="page-item">
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(1)}
                  disabled={loading}
                >
                  1
                </button>
              </li>
              {startPage > 2 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
            </>
          )}
          {pages}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
              <li className="page-item">
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={loading}
                >
                  {totalPages}
                </button>
              </li>
            </>
          )}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              aria-label="Next page"
            >
              <i className="ti ti-chevron-right" />
            </button>
          </li>
        </ul>
      </nav>
    );
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Patient Details</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Patient Details</li>
                </ol>
              </div>
            </div>
            <Link
              href={all_routes.patients}
              className="fw-medium d-flex align-items-center"
            >
              <i className="ti ti-arrow-left me-1" />
              Back to Patient
            </Link>
          </div>

          <PatientDetailsHeader />

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h5 className="d-inline-flex align-items-center mb-0">
                Total Appointments
                <span className="badge bg-danger ms-2">{totalCount}</span>
              </h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="dropdown">
                  <Link
                    href="#"
                    className="dropdown-toggle btn btn-md btn-outline-light d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                    aria-label="Patient actions menu"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="ti ti-sort-descending-2 me-1" />
                    <span className="me-1">Sort By : </span>{" "}
                    {sortOrder === "newest" ? "Newest" : "Oldest"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-2">
                    <li>
                      <Link
                        href="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setSortOrder("newest");
                          setCurrentPage(1);
                        }}
                      >
                        Newest
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setSortOrder("oldest");
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
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading appointments...</p>
                </div>
              ) : appointments.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i className="ti ti-calendar-off" style={{ fontSize: "48px", color: "#6c757d" }} />
                  </div>
                  <h5 className="text-muted">No Appointments Found</h5>
                  <p className="text-muted mb-0">
                    This patient has no appointments yet.
                  </p>
                </div>
              ) : (
                <>
                  <div className="table-responsive table-nowrap">
                    <table className="table mb-0 border">
                      <thead className="table-light">
                        <tr>
                          <th>Appointment ID</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Doctor</th>
                          <th>Type</th>
                          <th>Status</th>
                          <th>Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((appointment) => (
                          <tr key={appointment._id}>
                            <td>
                              <Link href="#" className="text-primary">
                                {appointment.appointmentId || "N/A"}
                              </Link>
                            </td>
                            <td>{formatDate(appointment.appointmentDate)}</td>
                            <td>
                              {formatTime(appointment.appointmentDate)}
                              {appointment.duration ? ` (${appointment.duration} min)` : ""}
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <div className="avatar avatar-xs me-2">
                                  <ImageWithBasePath
                                    src={
                                      appointment.doctor?.profileImage ||
                                      "assets/img/doctors/doctor-01.jpg"
                                    }
                                    alt="doctor"
                                    className="rounded"
                                  />
                                </div>
                                <div>
                                  <h6 className="fs-14 mb-0 fw-medium">
                                    Dr. {appointment.doctor?.firstName}{" "}
                                    {appointment.doctor?.lastName}
                                  </h6>
                                </div>
                              </div>
                            </td>
                            <td>{appointment.appointmentType || "General"}</td>
                            <td>
                              <span className={getStatusBadgeClass(appointment.status)}>
                                {getStatusLabel(appointment.status)}
                              </span>
                            </td>
                            <td>{appointment.reason || "N/A"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {totalPages > 1 && (
                    <div className="mt-4">{renderPagination()}</div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />
    </>
  );
};

export default PatientDetailsAppointmentsComponent;
