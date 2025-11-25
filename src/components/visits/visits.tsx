"use client";
import { useState, useEffect, useCallback, Suspense, lazy } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { apiClient } from "@/lib/services/api-client";
import { PatientVisit, PaginationInfo } from "@/types/emr";
import { usePermissions } from "@/hooks/usePermissions";

const VisitsModal = lazy(() => import("./modal/visitsModal"));

interface VisitsResponse {
  visits: PatientVisit[];
  pagination: PaginationInfo;
}

const VisitsComponent = () => {
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [visits, setVisits] = useState<PatientVisit[]>([]);
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
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await apiClient.get<VisitsResponse>(
        `/api/visits?${params.toString()}`,
        { showErrorToast: true }
      );

      setVisits(response.visits || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch visits:", error);
      setVisits([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchVisits();
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/visits/${id}`, {
        successMessage: "Visit cancelled successfully",
      });
      setDeleteConfirmId(null);
      fetchVisits();
    } catch (error) {
      console.error("Failed to cancel visit:", error);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-soft-success';
      case 'in_progress':
        return 'badge-soft-info';
      case 'cancelled':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-warning';
    }
  };

  const getStageBadgeClass = (stage: string) => {
    switch (stage) {
      case 'completed':
        return 'badge-soft-success';
      case 'doctor':
        return 'badge-soft-primary';
      case 'nurse':
        return 'badge-soft-info';
      case 'lab':
        return 'badge-soft-warning';
      case 'pharmacy':
        return 'badge-soft-purple';
      case 'billing':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  const isAdmin = session?.user?.role === "ADMIN";

  const renderSkeletonRow = (key: number) => (
    <tr key={key}>
      <td><span className="placeholder col-8"></span></td>
      <td><span className="placeholder col-10"></span></td>
      <td><span className="placeholder col-6"></span></td>
      <td><span className="placeholder col-8"></span></td>
      <td><span className="placeholder col-6"></span></td>
      <td><span className="placeholder col-4"></span></td>
    </tr>
  );

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Visits</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Visits</li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              <button
                onClick={fetchVisits}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Refresh"
                data-bs-original-title="Refresh"
              >
                <i className="ti ti-refresh" />
              </button>
              {can('appointment:update') && (
                <button
                  type="button"
                  className="btn btn-primary"
                  data-bs-toggle="modal"
                  data-bs-target="#add_visit"
                >
                  <i className="ti ti-square-rounded-plus me-1" />
                  New Visit
                </button>
              )}
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <form onSubmit={handleSearch}>
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <h5 className="d-inline-flex align-items-center mb-0">
                      Total Visits
                      <span className="badge bg-danger ms-2">{pagination.totalCount}</span>
                    </h5>
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search visits by patient name, visit number..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                      <button type="submit" className="btn btn-primary">
                        <i className="ti ti-search" />
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>

          <div className="card mb-0">
            <div className="card-body">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Visit Number</th>
                      <th>Patient</th>
                      <th>Visit Date</th>
                      <th>Current Stage</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      Array.from({ length: 5 }).map((_, index) => 
                        renderSkeletonRow(index)
                      )
                    ) : visits.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5">
                          <p className="text-muted">No visits found</p>
                        </td>
                      </tr>
                    ) : (
                      visits.map((visit) => {
                        const patient = typeof visit.patient === 'object' ? visit.patient : null;
                        return (
                          <tr key={visit._id}>
                            <td>
                              <Link 
                                href={`${all_routes.startVisits}?id=${visit._id}`}
                                className="text-primary fw-medium"
                              >
                                {visit.visitNumber}
                              </Link>
                            </td>
                            <td>
                              <div className="d-flex align-items-center">
                                <span className="avatar avatar-xs me-2">
                                  <ImageWithBasePath
                                    src={patient?.profileImage || "assets/img/users/user-01.jpg"}
                                    alt="patient"
                                    className="rounded"
                                  />
                                </span>
                                <div>
                                  <h6 className="fs-14 mb-0 fw-medium">
                                    {patient ? `${patient.firstName} ${patient.lastName}` : 'N/A'}
                                  </h6>
                                  <p className="fs-12 text-muted mb-0">
                                    {patient?.patientId || 'N/A'}
                                  </p>
                                </div>
                              </div>
                            </td>
                            <td>{formatDate(visit.visitDate)}</td>
                            <td>
                              <span className={`badge ${getStageBadgeClass(visit.currentStage)}`}>
                                {visit.currentStage.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </td>
                            <td>
                              <span className={`badge ${getStatusBadgeClass(visit.status)}`}>
                                {visit.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                              </span>
                            </td>
                            <td className="text-end">
                              <div className="d-flex gap-2 justify-content-end">
                                <Link
                                  href={`${all_routes.startVisits}?id=${visit._id}`}
                                  className="btn btn-sm btn-icon btn-light"
                                  data-bs-toggle="tooltip"
                                  title="View Details"
                                >
                                  <i className="ti ti-eye" />
                                </Link>
                                {visit.status !== 'completed' && visit.status !== 'cancelled' && (
                                  <Link
                                    href={`${all_routes.startVisits}?id=${visit._id}&edit=true`}
                                    className="btn btn-sm btn-icon btn-light"
                                    data-bs-toggle="tooltip"
                                    title="Edit"
                                  >
                                    <i className="ti ti-edit" />
                                  </Link>
                                )}
                                {isAdmin && visit.status !== 'cancelled' && (
                                  <button
                                    onClick={() => setDeleteConfirmId(visit._id || null)}
                                    className="btn btn-sm btn-icon btn-light"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_modal"
                                    title="Cancel Visit"
                                  >
                                    <i className="ti ti-trash" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {!loading && visits.length > 0 && (
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
                  {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
                    .slice(Math.max(0, currentPage - 3), Math.min(pagination.totalPages, currentPage + 2))
                    .map((page) => (
                      <li key={page} className={`page-item ${page === currentPage ? 'active' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </li>
                    ))}
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
        <CommonFooter />
      </div>

      {/* Delete Confirmation Modal */}
      <div className="modal fade" id="delete_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title">Confirm Cancellation</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <p>Are you sure you want to cancel this visit? This action cannot be undone.</p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  if (deleteConfirmId) {
                    handleDelete(deleteConfirmId);
                  }
                }}
                data-bs-dismiss="modal"
              >
                Cancel Visit
              </button>
            </div>
          </div>
        </div>
      </div>

      <Suspense fallback={<div />}>
        <VisitsModal onVisitCreated={fetchVisits} />
      </Suspense>
    </>
  );
};

export default VisitsComponent;
