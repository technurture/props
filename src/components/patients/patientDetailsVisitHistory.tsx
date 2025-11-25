"use client";
import { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PatientDetailsHeader from "./PatientDetailsHeader";
import { all_routes } from "@/router/all_routes";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { visitService } from "@/lib/services/visitService";
import { IPatientVisit } from "@/models/PatientVisit";
import { toast } from "react-toastify";
import { format } from "date-fns";

const VisitModal = lazy(() => import("./modals/visitModal"));

const PatientDetailsVisitHistoryComponent = () => {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");

  const [visits, setVisits] = useState<IPatientVisit[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const limit = 10;

  const [selectedVisit, setSelectedVisit] = useState<IPatientVisit | null>(null);
  const [modalMode, setModalMode] = useState<"view" | "edit" | "delete" | null>(null);

  const fetchVisits = async () => {
    if (!patientId) {
      toast.error("Patient ID not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await visitService.getAll({
        patient: patientId,
        page: currentPage,
        limit: limit,
      });

      setVisits(response.visits || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalCount(response.pagination?.totalCount || 0);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch visits";
      console.error("Error fetching visits:", error);
      toast.error(errorMessage);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVisits();
  }, [patientId, currentPage, sortOrder]);

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch {
      return "N/A";
    }
  };

  const formatDateTime = (date: string | Date) => {
    try {
      return format(new Date(date), "dd MMM yyyy, hh:mm a");
    } catch {
      return "N/A";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "badge badge-soft-success";
      case "in_progress":
        return "badge badge-soft-info";
      case "cancelled":
        return "badge badge-soft-danger";
      default:
        return "badge badge-soft-secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    return status.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const getStageBadgeClass = (stage: string) => {
    switch (stage) {
      case "front_desk":
        return "badge badge-soft-primary";
      case "nurse":
        return "badge badge-soft-info";
      case "doctor":
        return "badge badge-soft-warning";
      case "lab":
        return "badge badge-soft-purple";
      case "pharmacy":
        return "badge badge-soft-teal";
      case "billing":
        return "badge badge-soft-danger";
      case "completed":
        return "badge badge-soft-success";
      default:
        return "badge badge-soft-secondary";
    }
  };

  const getStageLabel = (stage: string) => {
    return stage.split("_").map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
  };

  const handleOpenViewModal = (visit: IPatientVisit) => {
    setSelectedVisit(visit);
    setModalMode("view");
  };

  const handleOpenEditModal = (visit: IPatientVisit) => {
    setSelectedVisit(visit);
    setModalMode("edit");
  };

  const handleOpenDeleteModal = (visit: IPatientVisit) => {
    setSelectedVisit(visit);
    setModalMode("delete");
  };

  const handleCloseModal = () => {
    setSelectedVisit(null);
    setModalMode(null);
  };

  const handleVisitUpdated = () => {
    fetchVisits();
  };

  const handleVisitDeleted = () => {
    fetchVisits();
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
      <nav aria-label="Visits pagination">
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
                Total Visits
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
                  <p className="mt-2 text-muted">Loading visits...</p>
                </div>
              ) : visits.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i
                      className="ti ti-clipboard-list"
                      style={{ fontSize: "48px", color: "#6c757d" }}
                    />
                  </div>
                  <h5 className="text-muted">No Visits Found</h5>
                  <p className="text-muted mb-0">
                    This patient has no visit history yet.
                  </p>
                </div>
              ) : (
                <>
                  <div className="table-responsive table-nowrap">
                    <table className="table mb-0 border">
                      <thead className="table-light">
                        <tr>
                          <th>Visit Number</th>
                          <th>Visit Date</th>
                          <th>Current Stage</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {visits.map((visit) => (
                          <tr key={visit._id?.toString()}>
                            <td>
                              <Link
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toast.info("View visit details will be implemented soon");
                                }}
                              >
                                {visit.visitNumber}
                              </Link>
                            </td>
                            <td>{formatDateTime(visit.visitDate)}</td>
                            <td>
                              <span className={getStageBadgeClass(visit.currentStage)}>
                                {getStageLabel(visit.currentStage)}
                              </span>
                            </td>
                            <td>
                              <span className={getStatusBadgeClass(visit.status)}>
                                {getStatusLabel(visit.status)}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <button
                                  className="btn btn-sm btn-icon btn-outline-primary"
                                  onClick={() => handleOpenViewModal(visit)}
                                  title="View Details"
                                >
                                  <i className="ti ti-eye" />
                                </button>
                                <button
                                  className="btn btn-sm btn-icon btn-outline-success"
                                  onClick={() => handleOpenEditModal(visit)}
                                  title="Edit Visit"
                                >
                                  <i className="ti ti-edit" />
                                </button>
                                <button
                                  className="btn btn-sm btn-icon btn-outline-danger"
                                  onClick={() => handleOpenDeleteModal(visit)}
                                  title="Cancel Visit"
                                >
                                  <i className="ti ti-trash" />
                                </button>
                              </div>
                            </td>
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

      {modalMode && selectedVisit && (
        <Suspense fallback={<div>Loading...</div>}>
          <VisitModal
            selectedVisit={selectedVisit}
            mode={modalMode}
            onVisitUpdated={handleVisitUpdated}
            onVisitDeleted={handleVisitDeleted}
            onClose={handleCloseModal}
          />
        </Suspense>
      )}
    </>
  );
};

export default PatientDetailsVisitHistoryComponent;
