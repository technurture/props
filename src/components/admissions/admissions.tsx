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
import CommonSelect from "@/core/common-components/common-select/commonSelect";

const AdmissionModal = lazy(() => import("./modal/admissionModal"));
const DischargeModal = lazy(() => import("./modal/dischargeModal"));

interface AdmissionData {
  _id: string;
  admissionNumber: string;
  patientId: {
    _id: string;
    patientId: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    email?: string;
  };
  admittingDoctorId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  primaryDoctorId: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  branchId?: {
    _id: string;
    name: string;
  };
  admissionDate: string;
  dischargeDate?: string;
  expectedDischargeDate?: string;
  status: string;
  type: string;
  ward?: string;
  room?: string;
  bed?: string;
  admissionReason: string;
  diagnosis?: string;
  treatmentPlan?: string;
  dailyRate?: number;
  totalBillingAmount?: number;
}

interface AdmissionsResponse {
  admissions: AdmissionData[];
  pagination: PaginationInfo;
}

const statusOptions = [
  { value: "", label: "All Status" },
  { value: "ADMITTED", label: "Admitted" },
  { value: "DISCHARGED", label: "Discharged" },
  { value: "TRANSFERRED", label: "Transferred" },
  { value: "CANCELLED", label: "Cancelled" }
];

const AdmissionsComponent = () => {
  const { data: session } = useSession();
  const { can, canEditResource, userRole } = usePermissions();
  const [admissions, setAdmissions] = useState<AdmissionData[]>([]);
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
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [editAdmissionId, setEditAdmissionId] = useState<string | null>(null);
  const [dischargeAdmission, setDischargeAdmission] = useState<{ id: string; patientName: string } | null>(null);

  const fetchAdmissions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
      });

      const response = await apiClient.get<AdmissionsResponse>(
        `/api/admissions?${params.toString()}`,
        { showErrorToast: true }
      );

      setAdmissions(response.admissions || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch admissions:", error);
      setAdmissions([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter]);

  useEffect(() => {
    fetchAdmissions();
  }, [fetchAdmissions]);

  useEffect(() => {
    let isMounted = true;

    const initializeBootstrapComponents = async () => {
      if (!isMounted || admissions.length === 0) return;

      try {
        if (typeof window !== 'undefined') {
          const bootstrap = await import('bootstrap/dist/js/bootstrap.bundle.min.js');
          
          await new Promise(resolve => setTimeout(resolve, 100));
          
          if (!isMounted) return;

          const dropdownElementList = document.querySelectorAll('[data-bs-toggle="dropdown"]');
          dropdownElementList.forEach((dropdownToggleEl) => {
            try {
              const existingInstance = bootstrap.Dropdown.getInstance(dropdownToggleEl);
              if (existingInstance) {
                existingInstance.dispose();
              }
              new bootstrap.Dropdown(dropdownToggleEl, {
                autoClose: true,
                boundary: 'clippingParents'
              });
            } catch (error) {
              console.error('Failed to initialize dropdown:', error);
            }
          });

          const modalElementList = document.querySelectorAll('.modal');
          modalElementList.forEach((modalEl) => {
            try {
              const existingInstance = bootstrap.Modal.getInstance(modalEl);
              if (!existingInstance) {
                new bootstrap.Modal(modalEl);
              }
            } catch (error) {
              console.error('Failed to initialize modal:', error);
            }
          });
        }
      } catch (error) {
        console.error('Failed to load Bootstrap:', error);
      }
    };

    if (typeof window !== 'undefined') {
      requestAnimationFrame(() => {
        initializeBootstrapComponents();
      });
    }

    return () => {
      isMounted = false;
    };
  }, [admissions]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchAdmissions();
  };

  const handleEditAdmission = (admissionId: string) => {
    setEditAdmissionId(admissionId);
  };

  const handleDischarge = (admission: AdmissionData) => {
    setDischargeAdmission({
      id: admission._id,
      patientName: `${admission.patientId.firstName} ${admission.patientId.lastName}`
    });
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'ADMITTED':
        return 'badge-soft-success';
      case 'DISCHARGED':
        return 'badge-soft-info';
      case 'TRANSFERRED':
        return 'badge-soft-warning';
      case 'CANCELLED':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  const getTypeBadgeClass = (type: string) => {
    switch (type?.toUpperCase()) {
      case 'EMERGENCY':
        return 'badge-soft-danger';
      case 'SCHEDULED':
        return 'badge-soft-success';
      case 'OBSERVATION':
        return 'badge-soft-info';
      case 'DAY_CARE':
        return 'badge-soft-warning';
      default:
        return 'badge-soft-secondary';
    }
  };

  const handlePageChange = (page: number) => {
    if (page > 0 && page <= pagination.totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Admissions</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Admissions</li>
                </ol>
              </div>
            </div>
            {can('admission:create') && (
              <button
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#admission_modal"
                onClick={() => setEditAdmissionId(null)}
              >
                <i className="ti ti-square-rounded-plus me-2" />
                Create Admission
              </button>
            )}
          </div>

          <div className="card">
            <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
              <h5 className="mb-0">Admissions List</h5>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <form onSubmit={handleSearch} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search by patient or admission no."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ minWidth: '250px' }}
                  />
                  <button type="submit" className="btn btn-primary">
                    <i className="ti ti-search" />
                  </button>
                </form>
                <div style={{ minWidth: '180px' }}>
                  <CommonSelect
                    className="select"
                    options={statusOptions}
                    value={statusOptions.find(s => s.value === statusFilter)}
                    onChange={(option: any) => {
                      setStatusFilter(option?.value || '');
                      setCurrentPage(1);
                    }}
                    placeholder="Filter by Status"
                  />
                </div>
              </div>
            </div>
            <div className="card-body p-0">
              {loading ? (
                <div className="d-flex justify-content-center align-items-center p-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : admissions.length === 0 ? (
                <div className="p-5 text-center">
                  <p className="text-muted mb-0">No admissions found</p>
                </div>
              ) : (
                <div className="table-responsive">
                  <table className="table table-hover mb-0">
                    <thead>
                      <tr>
                        <th>Admission No.</th>
                        <th>Patient</th>
                        <th>Type</th>
                        <th>Ward/Room/Bed</th>
                        <th>Admission Date</th>
                        <th>Status</th>
                        <th>Primary Doctor</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {admissions.map((admission) => (
                        <tr key={admission._id}>
                          <td>
                            <span className="fw-medium text-primary">
                              {admission.admissionNumber}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link
                                href={`${all_routes.patientDetails}?id=${admission.patientId._id}`}
                                className="avatar avatar-sm me-2"
                              >
                                <ImageWithBasePath
                                  src="assets/img/profiles/avatar-03.jpg"
                                  className="rounded"
                                  alt="Patient"
                                />
                              </Link>
                              <div>
                                <h6 className="mb-0">
                                  <Link href={`${all_routes.patientDetails}?id=${admission.patientId._id}`}>
                                    {admission.patientId.firstName} {admission.patientId.lastName}
                                  </Link>
                                </h6>
                                <span className="text-muted fs-13">{admission.patientId.patientId}</span>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getTypeBadgeClass(admission.type)}`}>
                              {admission.type}
                            </span>
                          </td>
                          <td>
                            {admission.ward || 'N/A'} / {admission.room || 'N/A'} / {admission.bed || 'N/A'}
                          </td>
                          <td>{formatDate(admission.admissionDate)}</td>
                          <td>
                            <span className={`badge ${getStatusBadgeClass(admission.status)}`}>
                              {admission.status}
                            </span>
                          </td>
                          <td>
                            Dr. {admission.primaryDoctorId.firstName} {admission.primaryDoctorId.lastName}
                          </td>
                          <td className="text-end">
                            <div className="d-flex align-items-center justify-content-end gap-1">
                              <Link
                                href={`${all_routes.patientDetails}?id=${admission.patientId._id}`}
                                className="btn btn-white btn-icon btn-sm rounded-circle"
                                title="View Details"
                              >
                                <i className="ti ti-eye" />
                              </Link>
                              {admission.status === 'ADMITTED' && can('admission:update') && (
                                <button
                                  type="button"
                                  className="btn btn-white btn-icon btn-sm rounded-circle"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleEditAdmission(admission._id);
                                  }}
                                  data-bs-toggle="modal"
                                  data-bs-target="#admission_modal"
                                  title="Edit"
                                >
                                  <i className="ti ti-edit" />
                                </button>
                              )}
                              {admission.status === 'ADMITTED' && can('admission:discharge') && (
                                <button
                                  type="button"
                                  className="btn btn-white btn-icon btn-sm rounded-circle"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    handleDischarge(admission);
                                  }}
                                  data-bs-toggle="modal"
                                  data-bs-target="#discharge_modal"
                                  title="Discharge"
                                >
                                  <i className="ti ti-logout" />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
            {!loading && admissions.length > 0 && (
              <div className="card-footer">
                <div className="d-flex justify-content-between align-items-center flex-wrap">
                  <div className="text-muted">
                    Showing {((currentPage - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(currentPage * pagination.limit, pagination.totalCount)} of{" "}
                    {pagination.totalCount} entries
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${!pagination.hasPreviousPage ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage - 1)}
                          disabled={!pagination.hasPreviousPage}
                        >
                          Previous
                        </button>
                      </li>
                      {[...Array(pagination.totalPages)].map((_, index) => (
                        <li
                          key={index + 1}
                          className={`page-item ${currentPage === index + 1 ? 'active' : ''}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => handlePageChange(index + 1)}
                          >
                            {index + 1}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => handlePageChange(currentPage + 1)}
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

      <Suspense fallback={<div>Loading...</div>}>
        <AdmissionModal
          onSuccess={fetchAdmissions}
          editAdmissionId={editAdmissionId}
        />
        {dischargeAdmission && (
          <DischargeModal
            admissionId={dischargeAdmission.id}
            patientName={dischargeAdmission.patientName}
            onSuccess={fetchAdmissions}
          />
        )}
      </Suspense>
    </>
  );
};

export default AdmissionsComponent;
