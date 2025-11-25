"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { apiClient } from "@/lib/services/api-client";
import { Doctor, PaginationInfo } from "@/types/emr";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import { all_routes } from "@/router/all_routes";

interface DoctorsResponse {
  doctors: Doctor[];
  pagination: PaginationInfo;
}

const AllDoctorsListComponent = () => {
  const { data: session } = useSession();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
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

  const fetchDoctors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await apiClient.get<DoctorsResponse>(
        `/api/doctors?${params.toString()}`,
        { showErrorToast: true }
      );

      setDoctors(response.doctors || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
      setDoctors([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchDoctors();
  }, [fetchDoctors]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchDoctors();
  };

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/doctors/${id}`, {
        successMessage: "Doctor deactivated successfully",
      });
      setDeleteConfirmId(null);
      fetchDoctors();
    } catch (error) {
      console.error("Failed to delete doctor:", error);
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

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Doctors</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Doctors</li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              <Link
                href={all_routes.doctors}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Grid"
                data-bs-original-title="Grid View"
              >
                <i className="ti ti-layout-grid" />
              </Link>
              <Link
                href={all_routes.allDoctorsList}
                className="btn btn-icon btn-white active"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="List"
                data-bs-original-title="List View"
              >
                <i className="ti ti-layout-list" />
              </Link>
              <button
                onClick={fetchDoctors}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Refresh"
                data-bs-original-title="Refresh"
              >
                <i className="ti ti-refresh" />
              </button>
              <Link href={all_routes.addDoctors} className="btn btn-primary">
                <i className="ti ti-square-rounded-plus me-1" />
                New Doctor
              </Link>
            </div>
          </div>

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h5 className="d-inline-flex align-items-center mb-0">
                Total Doctors
                <span className="badge bg-danger ms-2">{pagination.totalCount}</span>
              </h5>
              <div className="d-flex align-items-center">
                <form onSubmit={handleSearch} className="me-2">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search doctors..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="btn btn-outline-secondary" type="submit">
                      <i className="ti ti-search" />
                    </button>
                  </div>
                </form>
              </div>
            </div>

            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover table-striped mb-0">
                  <thead>
                    <tr>
                      <th>Doctor ID</th>
                      <th>Name</th>
                      <th>Specialization</th>
                      <th>Email</th>
                      <th>Phone</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      renderSkeletonRows()
                    ) : doctors.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-5">
                          <div className="text-muted">
                            <i className="ti ti-user-off fs-1 mb-3 d-block" />
                            <p className="mb-0">No doctors found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      doctors.map((doctor) => (
                        <tr key={doctor._id}>
                          <td>
                            <Link
                              href={`${all_routes.doctorDetails}?id=${doctor._id}`}
                              className="text-primary fw-medium"
                            >
                              #DR{doctor._id?.slice(-6).toUpperCase()}
                            </Link>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link
                                href={`${all_routes.doctorDetails}?id=${doctor._id}`}
                                className="avatar avatar-sm me-2"
                              >
                                <ImageWithBasePath
                                  src={
                                    doctor.profile?.profileImage ||
                                    "assets/img/doctors/doctor-01.jpg"
                                  }
                                  alt={`${doctor.firstName} ${doctor.lastName}`}
                                  className="rounded-circle"
                                />
                              </Link>
                              <Link
                                href={`${all_routes.doctorDetails}?id=${doctor._id}`}
                                className="text-dark"
                              >
                                {doctor.firstName} {doctor.lastName}
                              </Link>
                            </div>
                          </td>
                          <td>{doctor.profile?.specialization || "N/A"}</td>
                          <td>{doctor.email}</td>
                          <td>{doctor.phoneNumber}</td>
                          <td>
                            <div className="d-flex gap-2">
                              <Link
                                href={`${all_routes.doctorDetails}?id=${doctor._id}`}
                                className="btn btn-sm btn-icon btn-light"
                                data-bs-toggle="tooltip"
                                title="View Details"
                              >
                                <i className="ti ti-eye" />
                              </Link>
                              <Link
                                href={`${all_routes.editDoctors}?id=${doctor._id}`}
                                className="btn btn-sm btn-icon btn-light"
                                data-bs-toggle="tooltip"
                                title="Edit"
                              >
                                <i className="ti ti-edit" />
                              </Link>
                              {isAdmin && (
                                <button
                                  onClick={() => setDeleteConfirmId(doctor._id!)}
                                  className="btn btn-sm btn-icon btn-light"
                                  data-bs-toggle="tooltip"
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
            </div>

            {pagination.totalPages > 1 && (
              <div className="card-footer">
                <div className="d-flex justify-content-between align-items-center">
                  <div>
                    Showing {(currentPage - 1) * pagination.limit + 1} to{" "}
                    {Math.min(currentPage * pagination.limit, pagination.totalCount)} of{" "}
                    {pagination.totalCount} entries
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${!pagination.hasPreviousPage ? "disabled" : ""}`}>
                        <button
                          className="page-link"
                          onClick={() => setCurrentPage(currentPage - 1)}
                          disabled={!pagination.hasPreviousPage}
                        >
                          Previous
                        </button>
                      </li>
                      {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((page) => (
                        <li
                          key={page}
                          className={`page-item ${page === currentPage ? "active" : ""}`}
                        >
                          <button className="page-link" onClick={() => setCurrentPage(page)}>
                            {page}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${!pagination.hasNextPage ? "disabled" : ""}`}>
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
              </div>
            )}
          </div>
        </div>
        <CommonFooter />
      </div>

      {deleteConfirmId && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setDeleteConfirmId(null)}
                />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to deactivate this doctor?</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setDeleteConfirmId(null)}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={() => handleDelete(deleteConfirmId)}
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AllDoctorsListComponent;
