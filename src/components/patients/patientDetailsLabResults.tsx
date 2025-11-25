"use client";
import { useState, useEffect, lazy, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PatientDetailsHeader from "./PatientDetailsHeader";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { labTestService } from "@/lib/services/labTestService";
import { toast } from "react-toastify";
import { format } from "date-fns";

const LabResultsModal = lazy(() => import("../laboratory/lab-results/modal/labResultsModal"));

const PatientDetailsLabResultsComponent = () => {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");

  const [labTests, setLabTests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [selectedLabTest, setSelectedLabTest] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const limit = 10;

  const fetchLabTests = async () => {
    if (!patientId) {
      toast.error("Patient ID not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await labTestService.getAll({
        patient: patientId,
        page: currentPage,
        limit: limit,
      });

      setLabTests(response.labTests || []);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalCount(response.pagination?.totalCount || 0);
    } catch (error: any) {
      console.error("Error fetching lab tests:", error);
      toast.error(error.message || "Failed to fetch lab tests");
      setLabTests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLabTests();
  }, [patientId, currentPage, sortOrder]);

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "dd MMM yyyy");
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
        return "Completed";
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

  const handleOpenViewModal = (labTest: any) => {
    setSelectedLabTest(labTest);
    setIsEditing(false);
  };

  const handleOpenDeleteModal = (labTest: any) => {
    setSelectedLabTest(labTest);
  };

  const handleLabTestCreated = () => {
    fetchLabTests();
  };

  const handleLabTestUpdated = () => {
    fetchLabTests();
  };

  const handleLabTestDeleted = () => {
    fetchLabTests();
  };

  const handleCloseModal = () => {
    setSelectedLabTest(null);
    setIsEditing(false);
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
      <nav aria-label="Lab results pagination">
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
                Total Lab Results{" "}
                <span className="badge bg-danger ms-2">{totalCount}</span>
              </h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <button
                  className="btn btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#create_modal"
                >
                  <i className="ti ti-plus me-1" />
                  Add Lab Test
                </button>
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
                  <p className="mt-2 text-muted">Loading lab results...</p>
                </div>
              ) : labTests.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i
                      className="ti ti-test-pipe"
                      style={{ fontSize: "48px", color: "#6c757d" }}
                    />
                  </div>
                  <h5 className="text-muted">No Lab Results Found</h5>
                  <p className="text-muted mb-3">
                    This patient has no lab test results yet.
                  </p>
                  <button
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#create_modal"
                  >
                    <i className="ti ti-plus me-1" />
                    Add Lab Test
                  </button>
                </div>
              ) : (
                <>
                  <div className="table-responsive table-nowrap">
                    <table className="table mb-0 border">
                      <thead className="table-light">
                        <tr>
                          <th>Test ID</th>
                          <th>Date</th>
                          <th>Referred By</th>
                          <th>Test Name</th>
                          <th>Status</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {labTests.map((labTest) => (
                          <tr key={labTest._id}>
                            <td>
                              <Link
                                href="#"
                                className="text-primary"
                                data-bs-toggle="modal"
                                data-bs-target="#view_modal"
                                onClick={() => handleOpenViewModal(labTest)}
                              >
                                {labTest.testNumber || "N/A"}
                              </Link>
                            </td>
                            <td>{formatDate(labTest.createdAt)}</td>
                            <td>
                              <div className="d-flex align-items-center">
                                {labTest.doctor && (
                                  <>
                                    <div className="avatar avatar-xs me-2">
                                      <ImageWithBasePath
                                        src={
                                          labTest.doctor.profileImage ||
                                          "assets/img/doctors/doctor-01.jpg"
                                        }
                                        alt="doctor"
                                        className="rounded"
                                      />
                                    </div>
                                    <div>
                                      <h6 className="fs-14 mb-0 fw-medium">
                                        Dr. {labTest.doctor.firstName}{" "}
                                        {labTest.doctor.lastName}
                                      </h6>
                                    </div>
                                  </>
                                )}
                                {!labTest.doctor && <span>N/A</span>}
                              </div>
                            </td>
                            <td>{labTest.testName || "N/A"}</td>
                            <td>
                              <span className={getStatusBadgeClass(labTest.status)}>
                                {getStatusLabel(labTest.status)}
                              </span>
                            </td>
                            <td>
                              <div className="d-flex align-items-center gap-2">
                                <button
                                  className="btn btn-sm btn-icon btn-outline-primary"
                                  data-bs-toggle="modal"
                                  data-bs-target="#view_modal"
                                  onClick={() => handleOpenViewModal(labTest)}
                                >
                                  <i className="ti ti-eye" />
                                </button>
                                <button
                                  className="btn btn-sm btn-icon btn-outline-danger"
                                  data-bs-toggle="modal"
                                  data-bs-target="#delete_modal"
                                  onClick={() => handleOpenDeleteModal(labTest)}
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

      <Suspense fallback={<div>Loading...</div>}>
        <LabResultsModal
          selectedLabTest={selectedLabTest}
          isEditing={isEditing}
          setIsEditing={setIsEditing}
          onLabTestCreated={handleLabTestCreated}
          onLabTestUpdated={handleLabTestUpdated}
          onLabTestDeleted={handleLabTestDeleted}
          onClose={handleCloseModal}
        />
      </Suspense>
    </>
  );
};

export default PatientDetailsLabResultsComponent;
