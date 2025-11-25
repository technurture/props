"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiClient } from "@/lib/services/api-client";
import { Patient, PaginationInfo } from "@/types/emr";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import { all_routes } from "@/router/all_routes";

interface PatientsResponse {
  patients: Patient[];
  pagination: PaginationInfo;
}

const AllPatientsListComponent = () => {
  const { data: session } = useSession();
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

  const renderSkeletonRows = () => {
    return Array.from({ length: 5 }).map((_, index) => (
      <tr key={index}>
        <td>
          <div className="placeholder-glow">
            <span className="placeholder col-3"></span>
          </div>
        </td>
        <td>
          <div className="placeholder-glow">
            <span className="placeholder col-8"></span>
          </div>
        </td>
        <td>
          <div className="placeholder-glow">
            <span className="placeholder col-6"></span>
          </div>
        </td>
        <td>
          <div className="placeholder-glow">
            <span className="placeholder col-7"></span>
          </div>
        </td>
        <td>
          <div className="placeholder-glow">
            <span className="placeholder col-4"></span>
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

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const isAdmin = session?.user?.role === "ADMIN";

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
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Grid"
                data-bs-original-title="Grid View"
              >
                <i className="ti ti-layout-grid" />
              </Link>
              <Link
                href={all_routes.allPatientsList}
                className="btn btn-icon btn-white active"
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
              <Link href={all_routes.addPatient} className="btn btn-primary">
                <i className="ti ti-square-rounded-plus me-1" />
                Add New Patient
              </Link>
            </div>
          </div>

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h5 className="d-inline-flex align-items-center mb-0">
                Total Patients
                <span className="badge bg-danger ms-2">{pagination.totalCount}</span>
              </h5>
              <div className="d-flex align-items-center">
                <form onSubmit={handleSearch} className="me-2">
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
                </form>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive table-nowrap">
                <table className="table mb-0 border">
                  <thead className="table-light">
                    <tr>
                      <th>Patient ID</th>
                      <th>Patient Name</th>
                      <th className="no-sort">Gender</th>
                      <th className="no-sort">Phone</th>
                      <th className="no-sort">Blood Group</th>
                      <th>Date of Birth</th>
                      {isAdmin && <th>Branch</th>}
                      <th className="no-sort" />
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      renderSkeletonRows()
                    ) : patients.length === 0 ? (
                      <tr>
                        <td colSpan={isAdmin ? 8 : 7} className="text-center py-5">
                          <p className="text-muted">No patients found</p>
                        </td>
                      </tr>
                    ) : (
                      patients.map((patient) => (
                        <tr key={patient._id}>
                          <td>
                            <Link href={`${all_routes.patientDetails}?id=${patient._id}`}>
                              {patient.patientId}
                            </Link>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link
                                href={`${all_routes.patientDetails}?id=${patient._id}`}
                                className="avatar avatar-xs me-2"
                              >
                                <ImageWithBasePath
                                  src={patient.profileImage || "assets/img/avatars/avatar-01.jpg"}
                                  alt="patient"
                                  className="rounded"
                                />
                              </Link>
                              <div>
                                <h6 className="fs-14 mb-0 fw-medium">
                                  <Link href={`${all_routes.patientDetails}?id=${patient._id}`}>
                                    {patient.firstName} {patient.lastName}
                                  </Link>
                                </h6>
                              </div>
                            </div>
                          </td>
                          <td>{patient.gender}</td>
                          <td>{patient.phoneNumber || patient.phone || "N/A"}</td>
                          <td>{patient.bloodGroup || "N/A"}</td>
                          <td>{formatDate(patient.dateOfBirth)}</td>
                          {isAdmin && (
                            <td>
                              {typeof patient.branchId === 'object' && patient.branchId
                                ? patient.branchId.name
                                : 'N/A'}
                            </td>
                          )}
                          <td className="text-end">
                            <div className="d-flex gap-2 justify-content-end">
                              <Link
                                href={`${all_routes.patientDetails}?id=${patient._id}`}
                                className="btn btn-sm btn-icon btn-light"
                                data-bs-toggle="tooltip"
                                title="View Details"
                              >
                                <i className="ti ti-eye" />
                              </Link>
                              <Link
                                href={`${all_routes.editPatient}?id=${patient._id}`}
                                className="btn btn-sm btn-icon btn-light"
                                data-bs-toggle="tooltip"
                                title="Edit"
                              >
                                <i className="ti ti-edit" />
                              </Link>
                              {isAdmin && (
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
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
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
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
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
          </div>
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

export default AllPatientsListComponent;
