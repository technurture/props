"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import { all_routes } from "@/router/all_routes";
import Link from "next/link";
import { Suspense, lazy } from "react";
import { apiClient } from "@/lib/services/api-client";
import { Staff, PaginationInfo, Branch, UserRole } from "@/types/emr";
import { usePermissions } from "@/hooks/usePermissions";
import BulkImportExport from "@/components/common/BulkImportExport";
import { staffSchema, ValidationError } from "@/lib/bulk-import/schemas";
import { toast } from "react-toastify";

const StaffsModal = lazy(() => import("./modal/staffsModal"));

interface StaffResponse {
  staff: Staff[];
  pagination: PaginationInfo;
}

const StaffsComponent = () => {
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [staffList, setStaffList] = useState<Staff[]>([]);
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
  const [selectedStatus, setSelectedStatus] = useState("active");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [showBulkImportExport, setShowBulkImportExport] = useState(false);

  const fetchStaff = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(selectedRole && { role: selectedRole }),
        ...(selectedStatus && { status: selectedStatus }),
      });

      const response = await apiClient.get<StaffResponse>(
        `/api/staff?${params.toString()}`,
        { showErrorToast: true }
      );

      setStaffList(response.staff || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch staff:", error);
      setStaffList([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedRole, selectedStatus]);

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

  const openModal = (type: "add" | "edit" | "view" | "delete", staff?: Staff) => {
    setModalType(type);
    setSelectedStaff(staff || null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedStaff(null);
  };

  const handleSuccess = () => {
    closeModal();
    fetchStaff();
  };

  const handleReactivate = async (staffId: string) => {
    const confirmReactivate = confirm("Are you sure you want to reactivate this staff member?");
    if (!confirmReactivate) return;
    
    const newPassword = prompt("Enter a new password for this user (must be at least 6 characters, or leave blank to keep existing password):");
    
    if (newPassword === null) return;
    
    const trimmedPassword = newPassword.trim();
    
    if (trimmedPassword && trimmedPassword.length < 6) {
      alert("Password must be at least 6 characters long");
      return;
    }
    
    try {
      const payload = trimmedPassword ? { password: trimmedPassword } : {};
      
      await apiClient.patch(`/api/staff/${staffId}/reactivate`, payload, { 
        showErrorToast: true,
        successMessage: 'Staff member reactivated successfully'
      });
      fetchStaff();
    } catch (error) {
      console.error("Failed to reactivate staff:", error);
    }
  };

  const handleBulkImport = async (data: any[]) => {
    try {
      const response = await apiClient.post('/api/staff/bulk-import', { data }, {
        successMessage: 'Staff imported successfully',
      }) as any;
      
      fetchStaff();
      
      if (response.passwords && response.passwords.length > 0) {
        const passwordList = response.passwords.map((p: any) => 
          `${p.name}: ${p.email} - Password: ${p.password}`
        ).join('\n');
        
        const message = `${response.success} staff members imported successfully!\n\nGenerated passwords for new staff:\n${passwordList}\n\nPlease save these passwords and share them with the respective staff members.`;
        
        alert(message);
      }
      
      return {
        success: response.success || 0,
        failed: response.failed || 0,
        errors: response.errors || [],
      };
    } catch (error: any) {
      toast.error(error.message || 'Failed to import staff');
      throw error;
    }
  };

  const handleBulkExport = async (filters?: any) => {
    try {
      const params = new URLSearchParams();
      if (filters?.role) params.append('role', filters.role);
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive);
      
      const data = await apiClient.get(
        `/api/staff/bulk-export?${params.toString()}`,
        { showErrorToast: true }
      ) as any[];
      
      return data;
    } catch (error: any) {
      toast.error(error.message || 'Failed to export staff');
      throw error;
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

  const getBranchName = (branchId: string | Branch | undefined) => {
    if (!branchId) return "N/A";
    if (typeof branchId === 'string') return branchId;
    return branchId.name || "N/A";
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

  const renderSkeletonRow = () => (
    <tr>
      <td><div className="skeleton-loader" style={{ width: '80px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '150px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '100px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '120px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '100px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '150px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '100px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '50px', height: '16px' }}></div></td>
    </tr>
  );

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Staffs</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Staffs</li>
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
              {can('user:create') && (
                <button
                  onClick={() => setShowBulkImportExport(true)}
                  className="btn btn-secondary"
                >
                  <i className="ti ti-upload me-1" />
                  Bulk Import/Export
                </button>
              )}
              {can('user:create') && (
                <button
                  onClick={() => openModal("add")}
                  className="btn btn-primary"
                >
                  <i className="ti ti-square-rounded-plus me-1" />
                  New Staff
                </button>
              )}
            </div>
          </div>

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h5 className="d-inline-flex align-items-center mb-0">
                Total Staffs
                <span className="badge bg-danger ms-2">
                  {loading ? '...' : pagination.totalCount}
                </span>
              </h5>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <form onSubmit={handleSearch} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by name, email..."
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
                  <option value={UserRole.FRONT_DESK}>Front Desk</option>
                  <option value={UserRole.NURSE}>Nurse</option>
                  <option value={UserRole.DOCTOR}>Doctor</option>
                  <option value={UserRole.LAB}>Lab Technician</option>
                  <option value={UserRole.PHARMACY}>Pharmacy</option>
                  <option value={UserRole.BILLING}>Billing</option>
                  <option value={UserRole.ACCOUNTING}>Accounting</option>
                </select>
                <select
                  className="form-select form-select-sm"
                  value={selectedStatus}
                  onChange={(e) => {
                    setSelectedStatus(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: 'auto' }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="all">All Status</option>
                </select>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive table-nowrap">
                <table className="table border mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Staff ID</th>
                      <th>Staff Name</th>
                      <th>Role</th>
                      <th>Branch</th>
                      <th>Phone Number</th>
                      <th>Email</th>
                      <th>Created Date</th>
                      <th className="text-end">Actions</th>
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
                        <td colSpan={8} className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <i className="ti ti-users-off fs-1 text-muted mb-2" />
                            <p className="text-muted mb-0">No staff members found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      staffList.map((staff, index) => (
                        <tr key={staff._id || index}>
                          <td>
                            <Link 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                openModal("view", staff);
                              }}
                              aria-label={`View staff member ${staff.firstName} ${staff.lastName} details`}
                            >
                              #{staff._id?.slice(-6).toUpperCase()}
                            </Link>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <div className="avatar avatar-xs me-2">
                                <ImageWithBasePath
                                  src={staff.profile?.profileImage || "assets/img/avatars/avatar-01.jpg"}
                                  alt="staff"
                                  className="rounded"
                                />
                              </div>
                              <div>
                                <h6 className="fs-14 mb-0 fw-medium">
                                  <Link 
                                    href="#"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      openModal("view", staff);
                                    }}
                                  >
                                    {staff.firstName} {staff.lastName}
                                  </Link>
                                </h6>
                              </div>
                            </div>
                          </td>
                          <td>
                            {staff.role ? (
                              <span className="badge bg-info-transparent">
                                {getRoleDisplay(staff.role)}
                              </span>
                            ) : (
                              <span className="text-muted">No Role</span>
                            )}
                          </td>
                          <td>{getBranchName(staff.branchId)}</td>
                          <td>{staff.phoneNumber || "N/A"}</td>
                          <td>{staff.email}</td>
                          <td>{formatDate(staff.createdAt)}</td>
                          <td className="text-end">
                            <div className="d-flex gap-2 justify-content-end">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  openModal("view", staff);
                                }}
                                className="btn btn-sm btn-icon btn-light"
                                data-bs-toggle="tooltip"
                                title="View Details"
                              >
                                <i className="ti ti-eye" />
                              </button>
                              {staff.isActive ? (
                                <>
                                  {can('user:update') && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        openModal("edit", staff);
                                      }}
                                      className="btn btn-sm btn-icon btn-light"
                                      data-bs-toggle="tooltip"
                                      title="Edit"
                                    >
                                      <i className="ti ti-edit" />
                                    </button>
                                  )}
                                  {can('user:delete') && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        openModal("delete", staff);
                                      }}
                                      className="btn btn-sm btn-icon btn-light"
                                      data-bs-toggle="tooltip"
                                      title="Delete"
                                    >
                                      <i className="ti ti-trash" />
                                    </button>
                                  )}
                                </>
                              ) : (
                                can('user:update') && staff._id && (
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleReactivate(staff._id!);
                                    }}
                                    className="btn btn-sm btn-icon btn-success"
                                    data-bs-toggle="tooltip"
                                    title="Reactivate"
                                  >
                                    <i className="ti ti-refresh" />
                                  </button>
                                )
                              )}
                            </div>
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

      <Suspense fallback={<div>Loading...</div>}>
        {modalType && (
          <StaffsModal
            type={modalType}
            staff={selectedStaff}
            onClose={closeModal}
            onSuccess={handleSuccess}
          />
        )}
      </Suspense>

      <BulkImportExport
        schema={staffSchema}
        moduleName="Staff"
        onImport={handleBulkImport}
        onExport={handleBulkExport}
        isOpen={showBulkImportExport}
        onClose={() => setShowBulkImportExport(false)}
      />
    </>
  );
};

export default StaffsComponent;
