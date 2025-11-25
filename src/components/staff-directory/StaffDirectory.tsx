"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import { all_routes } from "@/router/all_routes";
import Link from "next/link";
import { apiClient } from "@/lib/services/api-client";
import { UserRole } from "@/types/emr";

interface StaffMember {
  _id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  branch: {
    name: string;
    city?: string;
  } | null;
  isActive: boolean;
  isOnDuty: boolean;
  profileImage?: string;
  department?: string;
  specialization?: string;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface StaffDirectoryResponse {
  staff: StaffMember[];
  pagination: PaginationInfo;
}

const StaffDirectory = () => {
  const { data: session } = useSession();
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
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
  const [selectedRole, setSelectedRole] = useState("");
  const [onDutyOnly, setOnDutyOnly] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole && { role: selectedRole }),
        ...(onDutyOnly && { onDuty: "true" }),
      });

      const response = await apiClient.get<StaffDirectoryResponse>(
        `/api/staff-directory?${params.toString()}`,
        { showErrorToast: true }
      );

      setStaffList(response.staff || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch staff directory:", error);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedRole, onDutyOnly]);

  useEffect(() => {
    fetchStaff();
  }, [fetchStaff]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchStaff();
  };

  const getRoleDisplay = (role: UserRole) => {
    const roleMap: Record<UserRole, string> = {
      [UserRole.ADMIN]: "Admin",
      [UserRole.MANAGER]: "Manager",
      [UserRole.FRONT_DESK]: "Front Desk",
      [UserRole.NURSE]: "Nurse",
      [UserRole.DOCTOR]: "Doctor",
      [UserRole.LAB]: "Lab Technician",
      [UserRole.PHARMACY]: "Pharmacy",
      [UserRole.BILLING]: "Billing",
      [UserRole.ACCOUNTING]: "Accounting",
    };
    return roleMap[role] || role;
  };

  const getRoleBadgeColor = (role: UserRole) => {
    const colorMap: Record<UserRole, string> = {
      [UserRole.ADMIN]: "bg-danger-transparent",
      [UserRole.MANAGER]: "bg-purple-transparent",
      [UserRole.FRONT_DESK]: "bg-info-transparent",
      [UserRole.NURSE]: "bg-success-transparent",
      [UserRole.DOCTOR]: "bg-primary-transparent",
      [UserRole.LAB]: "bg-warning-transparent",
      [UserRole.PHARMACY]: "bg-teal-transparent",
      [UserRole.BILLING]: "bg-orange-transparent",
      [UserRole.ACCOUNTING]: "bg-dark-transparent",
    };
    return colorMap[role] || "bg-secondary-transparent";
  };

  const renderSkeletonRow = () => (
    <tr>
      <td><div className="skeleton-loader" style={{ width: '150px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '100px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '120px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '100px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '80px', height: '16px' }}></div></td>
    </tr>
  );

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Staff Directory</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Staff Directory</li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              <button
                onClick={handleRefresh}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Refresh"
                data-bs-original-title="Refresh"
                disabled={loading}
              >
                <i className={`ti ti-refresh ${loading ? 'spin' : ''}`} />
              </button>
            </div>
          </div>

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h5 className="d-inline-flex align-items-center mb-0">
                Staff Members
                <span className="badge bg-primary ms-2">
                  {loading ? '...' : pagination.totalCount}
                </span>
              </h5>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <form onSubmit={handleSearch} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by name..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ width: '200px' }}
                  />
                  <button type="submit" className="btn btn-sm btn-primary">
                    <i className="ti ti-search" />
                  </button>
                </form>
                <select
                  className="form-select form-select-sm"
                  value={selectedRole}
                  onChange={(e) => {
                    setSelectedRole(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: 'auto' }}
                >
                  <option value="">All Roles</option>
                  <option value={UserRole.ADMIN}>Admin</option>
                  <option value={UserRole.MANAGER}>Manager</option>
                  <option value={UserRole.FRONT_DESK}>Front Desk</option>
                  <option value={UserRole.NURSE}>Nurse</option>
                  <option value={UserRole.DOCTOR}>Doctor</option>
                  <option value={UserRole.LAB}>Lab Technician</option>
                  <option value={UserRole.PHARMACY}>Pharmacy</option>
                  <option value={UserRole.BILLING}>Billing</option>
                  <option value={UserRole.ACCOUNTING}>Accounting</option>
                </select>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="onDutyFilter"
                    checked={onDutyOnly}
                    onChange={(e) => {
                      setOnDutyOnly(e.target.checked);
                      setCurrentPage(1);
                    }}
                  />
                  <label className="form-check-label" htmlFor="onDutyFilter">
                    On Duty Only
                  </label>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive table-nowrap">
                <table className="table border mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Name</th>
                      <th>Role</th>
                      <th>Branch</th>
                      <th>Department</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <>
                        {renderSkeletonRow()}
                        {renderSkeletonRow()}
                        {renderSkeletonRow()}
                        {renderSkeletonRow()}
                        {renderSkeletonRow()}
                      </>
                    ) : staffList.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <i className="ti ti-users-off fs-1 text-muted mb-2" />
                            <p className="text-muted mb-0">No staff members found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      staffList.map((member, index) => (
                        <tr key={member._id || index}>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar avatar-xs me-2">
                                <ImageWithBasePath
                                  src={member.profileImage || "assets/img/avatars/avatar-01.jpg"}
                                  alt={member.fullName}
                                  className="rounded"
                                />
                              </div>
                              <div>
                                <h6 className="fs-14 mb-0 fw-medium">
                                  {member.fullName}
                                </h6>
                                {member.specialization && (
                                  <small className="text-muted">{member.specialization}</small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className={`badge ${getRoleBadgeColor(member.role)}`}>
                              {getRoleDisplay(member.role)}
                            </span>
                          </td>
                          <td>
                            {member.branch ? (
                              <div>
                                <div>{member.branch.name}</div>
                                {member.branch.city && (
                                  <small className="text-muted">{member.branch.city}</small>
                                )}
                              </div>
                            ) : (
                              'N/A'
                            )}
                          </td>
                          <td>{member.department || '-'}</td>
                          <td>
                            {member.isOnDuty ? (
                              <span className="badge bg-success">
                                <i className="ti ti-circle-filled me-1" style={{ fontSize: '8px' }} />
                                On Duty
                              </span>
                            ) : (
                              <span className="badge bg-secondary">
                                Off Duty
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && staffList.length > 0 && (
                <div className="d-flex justify-content-between align-items-center mt-3 flex-wrap gap-2">
                  <div className="text-muted">
                    Showing {((currentPage - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(currentPage * pagination.limit, pagination.totalCount)} of{' '}
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
                      {[...Array(pagination.totalPages)].map((_, index) => {
                        const page = index + 1;
                        if (
                          page === 1 ||
                          page === pagination.totalPages ||
                          (page >= currentPage - 1 && page <= currentPage + 1)
                        ) {
                          return (
                            <li
                              key={page}
                              className={`page-item ${currentPage === page ? 'active' : ''}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => setCurrentPage(page)}
                              >
                                {page}
                              </button>
                            </li>
                          );
                        } else if (page === currentPage - 2 || page === currentPage + 2) {
                          return (
                            <li key={page} className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          );
                        }
                        return null;
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
    </>
  );
};

export default StaffDirectory;
