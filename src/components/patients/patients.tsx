"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { apiClient } from "@/lib/services/api-client";
import { Patient, PaginationInfo } from "@/types/emr";
import { usePermissions } from "@/hooks/usePermissions";
import { emitHandoffEvent } from "@/lib/utils/queue-events";

interface PatientsResponse {
  patients: Patient[];
  pagination: PaginationInfo;
}

const PatientsComponent = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { can } = usePermissions();
  const [patients, setPatients] = useState<Patient[]>([]);
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
  const [clockingInPatient, setClockingInPatient] = useState<string | null>(null);

  const fetchPatients = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await apiClient.get<PatientsResponse>(
        `/api/patients?${params.toString()}`,
        { showErrorToast: true }
      );

      setPatients(response.patients || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
      setPatients([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchPatients();
  }, [fetchPatients]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchPatients();
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/patients/${id}`, {
        successMessage: "Patient deactivated successfully",
      });
      setDeleteConfirmId(null);
      fetchPatients();
    } catch (error) {
      console.error("Failed to delete patient:", error);
    }
  };

  const handleClockIn = async (patientId: string) => {
    try {
      setClockingInPatient(patientId);
      
      const branchId = typeof session?.user?.branch === 'object' 
        ? session.user.branch._id 
        : session?.user?.branch;

      if (!branchId) {
        throw new Error("Branch information not found");
      }

      const response: any = await apiClient.post("/api/clocking/clock-in", {
        patientId,
        branchId,
      }, {
        successMessage: "Patient clocked in successfully",
      });

      if (response?.visit) {
        emitHandoffEvent(response.visit._id, '', 'front_desk');
        router.push(all_routes.visits);
      }
    } catch (error: any) {
      console.error("Failed to clock in patient:", error);
      if (error.status === 409) {
        router.push(all_routes.visits);
      }
    } finally {
      setClockingInPatient(null);
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

  const isAdmin = session?.user?.role === "ADMIN";

  const renderSkeletonCard = () => (
    <div className="col-xl-4 col-md-6 d-flex">
      <div className="card shadow flex-fill w-100">
        <div className="card-body">
          <div className="placeholder-glow">
            <span className="placeholder col-4 mb-3"></span>
            <div className="text-center mb-3">
              <span className="placeholder avatar avatar-xl avatar-rounded d-block mx-auto mb-2"></span>
              <span className="placeholder col-6 d-block mx-auto mb-1"></span>
              <span className="placeholder col-8 d-block mx-auto"></span>
            </div>
            <div className="border p-1 rounded mb-3">
              <div className="row g-0">
                <div className="col-4 text-center border-end p-1">
                  <span className="placeholder col-8"></span>
                </div>
                <div className="col-4 text-center border-end p-1">
                  <span className="placeholder col-8"></span>
                </div>
                <div className="col-4 text-center p-1">
                  <span className="placeholder col-8"></span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Patients</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Patients</li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              <Link
                href={all_routes.patients}
                className="btn btn-icon btn-white active"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Grid"
                data-bs-original-title="Grid View"
              >
                <i className="ti ti-layout-grid" />
              </Link>
              <Link
                href={all_routes.allPatientsList}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="List"
                data-bs-original-title="List View"
              >
                <i className="ti ti-layout-list" />
              </Link>
              <button
                onClick={fetchPatients}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Refresh"
                data-bs-original-title="Refresh"
              >
                <i className="ti ti-refresh" />
              </button>
              {can('patient:create') && (
                <Link href={all_routes.addPatient} className="btn btn-primary">
                  <i className="ti ti-square-rounded-plus me-1" />
                  Add New Patient
                </Link>
              )}
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <form onSubmit={handleSearch}>
                <div className="row align-items-center">
                  <div className="col-md-6">
                    <h5 className="d-inline-flex align-items-center mb-0">
                      Total Patients
                      <span className="badge bg-danger ms-2">{pagination.totalCount}</span>
                    </h5>
                  </div>
                  <div className="col-md-6">
                    <div className="input-group">
                      <input
                        type="text"
                        className="form-control"
                        placeholder="Search patients..."
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

          <div className="row justify-content-center">
            {loading ? (
              Array.from({ length: 6 }).map((_, index) => (
                <div key={index}>{renderSkeletonCard()}</div>
              ))
            ) : patients.length === 0 ? (
              <div className="col-12">
                <div className="card">
                  <div className="card-body text-center py-5">
                    <p className="text-muted">No patients found</p>
                  </div>
                </div>
              </div>
            ) : (
              patients.map((patient) => (
                <div key={patient._id} className="col-xl-4 col-md-6 d-flex">
                  <div className="card shadow flex-fill w-100">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="badge badge-soft-primary">
                          {patient.bloodGroup || "N/A"}
                        </span>
                        <div className="d-flex gap-2">
                          <Link
                            href={`${all_routes.patientDetails}?id=${patient._id}`}
                            className="btn btn-sm btn-icon btn-light"
                            data-bs-toggle="tooltip"
                            title="View Details"
                          >
                            <i className="ti ti-eye" />
                          </Link>
                          {can('patient:update') && (
                            <Link
                              href={`${all_routes.editPatient}?id=${patient._id}`}
                              className="btn btn-sm btn-icon btn-light"
                              data-bs-toggle="tooltip"
                              title="Edit"
                            >
                              <i className="ti ti-edit" />
                            </Link>
                          )}
                          {can('patient:delete') && (
                            <button
                              onClick={() => setDeleteConfirmId(patient._id || null)}
                              className="btn btn-sm btn-icon btn-light"
                              data-bs-toggle="modal"
                              data-bs-target="#delete_modal"
                              title="Delete"
                            >
                              <i className="ti ti-trash" />
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-center mb-3">
                        <span className="avatar avatar-xl avatar-rounded d-block mx-auto mb-2">
                          <Link
                            href={`${all_routes.patientDetails}?id=${patient._id}`}
                            className="d-inline-block"
                          >
                            <ImageWithBasePath
                              src={patient.profileImage || "assets/img/users/user-01.jpg"}
                              alt="patient"
                            />
                          </Link>
                        </span>
                        <Link
                          href={`${all_routes.patientDetails}?id=${patient._id}`}
                          className="d-inline-block mb-1"
                        >
                          {patient.patientId}
                        </Link>
                        <h6 className="mb-0">
                          <Link href={`${all_routes.patientDetails}?id=${patient._id}`}>
                            {patient.firstName} {patient.lastName}
                          </Link>
                        </h6>
                      </div>
                      <div className="border p-1 rounded mb-3">
                        <div className="row g-0">
                          <div className="col-4 text-center border-end p-1">
                            <h6 className="fw-semibold fs-14 text-truncate mb-1">
                              DOB
                            </h6>
                            <p className="fs-13 mb-0">{formatDate(patient.dateOfBirth)}</p>
                          </div>
                          <div className="col-4 text-center border-end p-1">
                            <h6 className="fw-semibold fs-14 text-truncate mb-1">
                              Gender
                            </h6>
                            <p className="fs-13 mb-0">{patient.gender}</p>
                          </div>
                          <div className="col-4 text-center p-1">
                            <h6 className="fw-semibold fs-14 text-truncate mb-1">
                              Location
                            </h6>
                            <p className="fs-13 mb-0">{patient.city || 'N/A'}</p>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => patient._id && handleClockIn(patient._id)}
                        className="btn btn-dark w-100"
                        disabled={clockingInPatient === patient._id || !patient._id}
                      >
                        {clockingInPatient === patient._id ? (
                          <>
                            <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                            Clocking In...
                          </>
                        ) : (
                          'Clock-In'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {!loading && patients.length > 0 && (
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
              <h5 className="modal-title">Confirm Deletion</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <p>Are you sure you want to deactivate this patient?</p>
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
                Delete
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default PatientsComponent;
