"use client";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import { all_routes } from "@/router/all_routes";
import Link from "next/link";
import { Suspense, lazy, useState, useEffect } from "react";
import { labTestService, LabTestFilters } from "@/lib/services/labTestService";
import { ILabTest } from "@/models/LabTest";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { usePermissions } from "@/hooks/usePermissions";

const MedicalResultsModal = lazy(() => import("./modal/medicalResultsModal"));

const MedicalResultsComponent = () => {
  const { can } = usePermissions();
  const [labTests, setLabTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [statusFilter, setStatusFilter] = useState<"all" | "pending" | "in_progress" | "completed" | "cancelled">("completed");
  const [selectedLabTest, setSelectedLabTest] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [modalType, setModalType] = useState<"create" | "view" | "delete" | null>(null);
  const limit = 20;

  const fetchLabTests = async () => {
    try {
      setLoading(true);
      
      const filters: LabTestFilters = {
        page: currentPage,
        limit: limit,
        search: searchQuery,
      };

      if (statusFilter !== "all") {
        filters.status = statusFilter as "pending" | "in_progress" | "completed" | "cancelled";
      }

      const response = await labTestService.getAll(filters);
      
      setLabTests(response.labTests);
      setTotalPages(response.pagination.totalPages);
      setTotalCount(response.pagination.totalCount);
    } catch (error: any) {
      console.error("Error fetching lab tests:", error);
      toast.error(error.message || "Failed to fetch lab tests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabTests();
  }, [currentPage, searchQuery, sortOrder, statusFilter]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchLabTests();
    toast.success("Medical results refreshed");
  };

  const handleSortChange = (order: "newest" | "oldest") => {
    setSortOrder(order);
    setCurrentPage(1);
  };

  const handleOpenCreateModal = () => {
    setModalType("create");
    setSelectedLabTest(null);
    setIsEditing(false);
  };

  const handleOpenViewModal = (labTest: any) => {
    setModalType("view");
    setSelectedLabTest(labTest);
    setIsEditing(false);
  };

  const handleOpenDeleteModal = (labTest: any) => {
    setModalType("delete");
    setSelectedLabTest(labTest);
  };

  const handleCloseModal = () => {
    setModalType(null);
    setSelectedLabTest(null);
    setIsEditing(false);
  };

  const handleLabTestCreated = () => {
    fetchLabTests();
    handleCloseModal();
  };

  const handleLabTestUpdated = () => {
    fetchLabTests();
    handleCloseModal();
  };

  const handleLabTestDeleted = () => {
    fetchLabTests();
    handleCloseModal();
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "completed":
        return "badge badge-soft-success";
      case "in_progress":
        return "badge badge-soft-info";
      case "pending":
        return "badge badge-soft-warning";
      case "cancelled":
        return "badge badge-soft-danger";
      default:
        return "badge badge-soft-secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed":
        return "Received";
      case "in_progress":
        return "In Progress";
      case "pending":
        return "Pending";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch {
      return "N/A";
    }
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
      <nav aria-label="Medical results pagination">
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
          {/* Page Header */}
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Medical Results</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Medical Results</li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              {can('lab:create') && (
                <button
                  onClick={handleOpenCreateModal}
                  className="btn btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#create_modal"
                >
                  <i className="ti ti-plus me-1" />
                  Add Lab Test
                </button>
              )}
              <button
                onClick={handleRefresh}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Refresh"
                data-bs-original-title="Refresh"
                disabled={loading}
              >
                <i className={`ti ti-refresh ${loading ? "spin" : ""}`} />
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
            </div>
          </div>
          {/* End Page Header */}

          {/* Search Bar */}
          <div className="card mb-3">
            <div className="card-body">
              <form onSubmit={handleSearch}>
                <div className="row g-3 align-items-center">
                  <div className="col-12 col-md-8 col-lg-6">
                    <div className="input-group">
                      <span className="input-group-text">
                        <i className="ti ti-search" />
                      </span>
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search by test ID, test name, or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {searchQuery && (
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => {
                            setSearchQuery("");
                            setCurrentPage(1);
                          }}
                        >
                          <i className="ti ti-x" />
                        </button>
                      )}
                    </div>
                  </div>
                  <div className="col-12 col-md-4 col-lg-3">
                    <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                      <i className="ti ti-search me-1" />
                      Search
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* card start */}
          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h6 className="d-inline-flex align-items-center mb-0">
                Total Medical Results{" "}
                <span className="badge bg-danger ms-2">{totalCount}</span>
              </h6>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="dropdown">
                  <Link
                    href="#"
                    className="dropdown-toggle btn btn-md btn-outline-light d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                    aria-label="Status filter menu"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="ti ti-filter me-1" />
                    <span className="me-1">Status : </span>
                    {statusFilter === "all" && "All"}
                    {statusFilter === "pending" && "Pending"}
                    {statusFilter === "in_progress" && "In Progress"}
                    {statusFilter === "completed" && "Completed"}
                    {statusFilter === "cancelled" && "Cancelled"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-2">
                    <li>
                      <button
                        onClick={() => {
                          setStatusFilter("completed");
                          setCurrentPage(1);
                        }}
                        className={`dropdown-item rounded-1 ${statusFilter === "completed" ? "active" : ""}`}
                        type="button"
                      >
                        Completed
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setStatusFilter("in_progress");
                          setCurrentPage(1);
                        }}
                        className={`dropdown-item rounded-1 ${statusFilter === "in_progress" ? "active" : ""}`}
                        type="button"
                      >
                        In Progress
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setStatusFilter("pending");
                          setCurrentPage(1);
                        }}
                        className={`dropdown-item rounded-1 ${statusFilter === "pending" ? "active" : ""}`}
                        type="button"
                      >
                        Pending
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => {
                          setStatusFilter("cancelled");
                          setCurrentPage(1);
                        }}
                        className={`dropdown-item rounded-1 ${statusFilter === "cancelled" ? "active" : ""}`}
                        type="button"
                      >
                        Cancelled
                      </button>
                    </li>
                    <li><hr className="dropdown-divider" /></li>
                    <li>
                      <button
                        onClick={() => {
                          setStatusFilter("all");
                          setCurrentPage(1);
                        }}
                        className={`dropdown-item rounded-1 ${statusFilter === "all" ? "active" : ""}`}
                        type="button"
                      >
                        All Statuses
                      </button>
                    </li>
                  </ul>
                </div>
                <div className="dropdown">
                  <Link
                    href="#"
                    className="dropdown-toggle btn btn-md btn-outline-light d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                    aria-label="Sort options menu"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="ti ti-sort-descending-2 me-1" />
                    <span className="me-1">Sort By : </span> {sortOrder === "newest" ? "Newest" : "Oldest"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-2">
                    <li>
                      <button
                        onClick={() => handleSortChange("newest")}
                        className="dropdown-item rounded-1"
                        type="button"
                      >
                        Newest
                      </button>
                    </li>
                    <li>
                      <button
                        onClick={() => handleSortChange("oldest")}
                        className="dropdown-item rounded-1"
                        type="button"
                      >
                        Oldest
                      </button>
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
                  <p className="mt-3 text-muted">Loading medical results...</p>
                </div>
              ) : labTests.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-flask-2 display-1 text-muted mb-3" />
                  <h5 className="text-muted">No medical results found</h5>
                  <p className="text-muted">
                    {searchQuery
                      ? "Try adjusting your search criteria"
                      : "Medical results will appear here when available"}
                  </p>
                </div>
              ) : (
                <>
                  {/* table start */}
                  <div className="table-responsive table-nowrap">
                    <table className="table mb-0 border">
                      <thead className="table-light">
                        <tr>
                          <th>Test ID</th>
                          <th>Patient Name</th>
                          <th className="no-sort d-none d-md-table-cell">Gender</th>
                          <th className="no-sort d-none d-lg-table-cell">Requested Date</th>
                          <th className="d-none d-xl-table-cell">Referred By</th>
                          <th>Test Name</th>
                          <th className="no-sort">Status</th>
                          <th className="no-sort" />
                        </tr>
                      </thead>
                      <tbody>
                        {labTests.map((labTest: any) => (
                          <tr key={labTest._id}>
                            <td>
                              <button
                                onClick={() => handleOpenViewModal(labTest)}
                                data-bs-toggle="modal"
                                data-bs-target="#view_modal"
                                className="text-primary fw-medium btn btn-link p-0 text-decoration-none"
                              >
                                #{labTest.testNumber}
                              </button>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <Link
                                  href={`${all_routes.patientDetails}?id=${labTest.patient?._id || ""}`}
                                  className="avatar avatar-xs me-2 flex-shrink-0"
                                >
                                  <ImageWithBasePath
                                    src={labTest.patient?.profileImage || "assets/img/avatars/avatar-01.jpg"}
                                    alt={`${labTest.patient?.firstName || "Patient"} ${labTest.patient?.lastName || ""}`}
                                    className="rounded"
                                  />
                                </Link>
                                <div className="overflow-hidden">
                                  <h6 className="fs-14 mb-0 fw-medium text-truncate">
                                    <Link href={`${all_routes.patientDetails}?id=${labTest.patient?._id || ""}`}>
                                      {labTest.patient?.firstName || "N/A"} {labTest.patient?.lastName || ""}
                                    </Link>
                                  </h6>
                                  <span className="text-muted fs-12 d-md-none">
                                    {labTest.patient?.patientId || ""}
                                  </span>
                                </div>
                              </div>
                            </td>
                            <td className="d-none d-md-table-cell">
                              {labTest.patient?.gender || "N/A"}
                            </td>
                            <td className="d-none d-lg-table-cell">
                              {formatDate(labTest.requestedAt)}
                            </td>
                            <td className="d-none d-xl-table-cell">
                              <div className="d-flex align-items-center">
                                <Link
                                  href={all_routes.doctorDetails}
                                  className="avatar avatar-xs me-2 flex-shrink-0"
                                >
                                  <ImageWithBasePath
                                    src={labTest.doctor?.profileImage || "assets/img/doctors/doctor-01.jpg"}
                                    alt={`Dr. ${labTest.doctor?.firstName || "Doctor"} ${labTest.doctor?.lastName || ""}`}
                                    className="rounded"
                                  />
                                </Link>
                                <div className="overflow-hidden">
                                  <h6 className="fs-14 mb-0 fw-medium text-truncate">
                                    <Link href={all_routes.doctorDetails}>
                                      Dr. {labTest.doctor?.firstName || "N/A"} {labTest.doctor?.lastName || ""}
                                    </Link>
                                  </h6>
                                </div>
                              </div>
                            </td>
                            <td>
                              <span className="fw-medium">{labTest.testName}</span>
                              <span className="d-block text-muted fs-12 d-xl-none">
                                {labTest.testCategory}
                              </span>
                            </td>
                            <td>
                              <span className={getStatusBadgeClass(labTest.status)}>
                                {getStatusLabel(labTest.status)}
                              </span>
                            </td>
                            <td className="text-end">
                              <div className="d-flex gap-2 justify-content-end">
                                <button
                                  onClick={() => handleOpenViewModal(labTest)}
                                  className="btn btn-sm btn-icon btn-light"
                                  data-bs-toggle="modal"
                                  data-bs-target="#view_modal"
                                  aria-label="View medical result details"
                                >
                                  <i className="ti ti-eye" />
                                </button>
                                {can('lab:delete') && (
                                  <button
                                    onClick={() => handleOpenDeleteModal(labTest)}
                                    className="btn btn-sm btn-icon btn-light"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_modal"
                                    aria-label="Delete medical result"
                                  >
                                    <i className="ti ti-trash" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {/* table end */}

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mt-4 gap-3">
                      <div className="text-muted">
                        Showing {(currentPage - 1) * limit + 1} to{" "}
                        {Math.min(currentPage * limit, totalCount)} of {totalCount} results
                      </div>
                      {renderPagination()}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          {/* card end */}
        </div>
        <CommonFooter />
      </div>

      <Suspense fallback={<div>Loading...</div>}>
        <MedicalResultsModal
          selectedLabTest={selectedLabTest}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          onLabTestCreated={handleLabTestCreated}
          onLabTestUpdated={handleLabTestUpdated}
          onLabTestDeleted={handleLabTestDeleted}
          onClose={handleCloseModal}
        />
      </Suspense>

      <style jsx>{`
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .spin {
          animation: spin 1s linear infinite;
        }
        @media (max-width: 767.98px) {
          .table-responsive {
            font-size: 0.875rem;
          }
          .avatar-xs {
            width: 2rem;
            height: 2rem;
          }
        }
      `}</style>
    </>
  );
};

export default MedicalResultsComponent;
