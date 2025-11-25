"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import { all_routes } from "@/router/all_routes";
import Link from "next/link";
import { apiClient } from "@/lib/services/api-client";
import { ServiceCharge, PaginationInfo } from "@/types/emr";
import { usePermissions } from "@/hooks/usePermissions";
import ServiceChargeModal from "./ServiceChargeModal";
import BulkImportExport from "@/components/common/BulkImportExport";
import { serviceChargeSchema } from "@/lib/bulk-import/schemas";
import { ValidationError } from "@/lib/bulk-import/schemas";
import { toast } from "react-toastify";

interface ServiceChargeResponse {
  serviceCharges: ServiceCharge[];
  pagination: PaginationInfo;
}

const ServiceChargesComponent = () => {
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [serviceChargeList, setServiceChargeList] = useState<ServiceCharge[]>([]);
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
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedServiceCharge, setSelectedServiceCharge] = useState<ServiceCharge | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [showBulkImportExport, setShowBulkImportExport] = useState(false);

  const fetchServiceCharges = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedStatus && { isActive: selectedStatus }),
      });

      const response = await apiClient.get<ServiceChargeResponse>(
        `/api/service-charges?${params.toString()}`,
        { showErrorToast: true }
      );

      setServiceChargeList(response.serviceCharges || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch service charges:", error);
      setServiceChargeList([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, selectedCategory, selectedStatus]);

  useEffect(() => {
    fetchServiceCharges();
  }, [fetchServiceCharges]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchServiceCharges();
  };

  const openModal = (type: "add" | "edit" | "view" | "delete", serviceCharge?: ServiceCharge) => {
    setModalType(type);
    setSelectedServiceCharge(serviceCharge || null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedServiceCharge(null);
  };

  const handleSuccess = () => {
    closeModal();
    fetchServiceCharges();
  };

  const handleBulkImport = async (data: any[]): Promise<{ success: number; failed: number; errors: ValidationError[] }> => {
    try {
      const response = await apiClient.post<{ success: number; failed: number; errors: ValidationError[] }>(
        '/api/service-charges/bulk-import',
        { data },
        { showSuccessToast: false, showErrorToast: true }
      );
      
      fetchServiceCharges();
      return response;
    } catch (error: any) {
      toast.error(error.message || 'Failed to import data');
      throw error;
    }
  };

  const handleBulkExport = async (filters?: any): Promise<any[]> => {
    try {
      const params = new URLSearchParams({
        ...(selectedCategory && { category: selectedCategory }),
        ...(selectedStatus && { isActive: selectedStatus }),
      });

      const response = await apiClient.get<any[]>(
        `/api/service-charges/bulk-export?${params.toString()}`,
        { showErrorToast: true }
      );
      
      return response;
    } catch (error: any) {
      toast.error(error.message || 'Failed to export data');
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

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getCategoryDisplay = (category: string) => {
    const categoryMap: Record<string, string> = {
      consultation: "Consultation",
      laboratory: "Laboratory",
      pharmacy: "Pharmacy",
      procedure: "Procedure",
      imaging: "Imaging",
      emergency: "Emergency",
      admission: "Admission",
      other: "Other",
    };
    return categoryMap[category] || category;
  };

  const getCategoryBadgeClass = (category: string) => {
    const badgeMap: Record<string, string> = {
      consultation: "bg-primary-transparent",
      laboratory: "bg-info-transparent",
      pharmacy: "bg-success-transparent",
      procedure: "bg-warning-transparent",
      imaging: "bg-secondary-transparent",
      emergency: "bg-danger-transparent",
      admission: "bg-purple-transparent",
      other: "bg-dark-transparent",
    };
    return badgeMap[category] || "bg-light-transparent";
  };

  const renderSkeletonRow = () => (
    <tr>
      <td><div className="skeleton-loader" style={{ width: '80px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '150px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '100px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '80px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '200px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '80px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '50px', height: '16px' }}></div></td>
    </tr>
  );

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Service Charges</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Service Charges</li>
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
              {(can('service_charge:create') || can('service_charge:update')) && (
                <button
                  onClick={() => setShowBulkImportExport(true)}
                  className="btn btn-outline-primary"
                  data-bs-toggle="tooltip"
                  data-bs-placement="top"
                  aria-label="Bulk Import/Export"
                  data-bs-original-title="Bulk Import/Export"
                >
                  <i className="ti ti-file-import me-1" />
                  Bulk Import/Export
                </button>
              )}
              {can('service_charge:create') && (
                <button
                  onClick={() => openModal("add")}
                  className="btn btn-primary"
                >
                  <i className="ti ti-square-rounded-plus me-1" />
                  New Service Charge
                </button>
              )}
            </div>
          </div>

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h5 className="d-inline-flex align-items-center mb-0">
                Total Service Charges
                <span className="badge bg-danger ms-2">
                  {loading ? '...' : pagination.totalCount}
                </span>
              </h5>
              <div className="d-flex align-items-center gap-2 flex-wrap">
                <form onSubmit={handleSearch} className="d-flex gap-2">
                  <input
                    type="text"
                    className="form-control form-control-sm"
                    placeholder="Search by service name..."
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
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setCurrentPage(1);
                  }}
                  style={{ width: 'auto' }}
                >
                  <option value="">All Categories</option>
                  <option value="consultation">Consultation</option>
                  <option value="laboratory">Laboratory</option>
                  <option value="pharmacy">Pharmacy</option>
                  <option value="procedure">Procedure</option>
                  <option value="imaging">Imaging</option>
                  <option value="emergency">Emergency</option>
                  <option value="admission">Admission</option>
                  <option value="other">Other</option>
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
                  <option value="">All Status</option>
                  <option value="true">Active</option>
                  <option value="false">Inactive</option>
                </select>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive table-nowrap">
                <table className="table border mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Service ID</th>
                      <th>Service Name</th>
                      <th>Category</th>
                      <th>Price</th>
                      <th>Description</th>
                      <th>Status</th>
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
                    ) : serviceChargeList.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <i className="ti ti-receipt-off fs-1 text-muted mb-2" />
                            <p className="text-muted mb-0">No service charges found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      serviceChargeList.map((serviceCharge, index) => (
                        <tr key={serviceCharge._id || index}>
                          <td>
                            <Link 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                openModal("view", serviceCharge);
                              }}
                              aria-label={`View service charge ${serviceCharge.serviceName} details`}
                            >
                              #{serviceCharge._id?.slice(-6).toUpperCase()}
                            </Link>
                          </td>
                          <td>
                            <h6 className="fs-14 mb-0 fw-medium">
                              <Link 
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  openModal("view", serviceCharge);
                                }}
                              >
                                {serviceCharge.serviceName}
                              </Link>
                            </h6>
                          </td>
                          <td>
                            <span className={`badge ${getCategoryBadgeClass(serviceCharge.category)}`}>
                              {getCategoryDisplay(serviceCharge.category)}
                            </span>
                          </td>
                          <td>
                            <span className="fw-semibold text-dark">
                              {formatCurrency(serviceCharge.price)}
                            </span>
                          </td>
                          <td>
                            <span className="text-muted" style={{ maxWidth: '200px', display: 'inline-block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {serviceCharge.description || "N/A"}
                            </span>
                          </td>
                          <td>
                            <span className={`badge ${serviceCharge.isActive ? 'bg-success' : 'bg-danger'}`}>
                              {serviceCharge.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="text-end">
                            <div className="d-flex gap-2 justify-content-end">
                              <button
                                onClick={() => openModal("view", serviceCharge)}
                                className="btn btn-sm btn-icon btn-primary"
                                data-bs-toggle="tooltip"
                                title="View"
                                aria-label="View service charge details"
                              >
                                <i className="ti ti-eye" />
                              </button>
                              {can('service_charge:update') && (
                                <button
                                  onClick={() => openModal("edit", serviceCharge)}
                                  className="btn btn-sm btn-icon btn-success"
                                  data-bs-toggle="tooltip"
                                  title="Edit"
                                  aria-label="Edit service charge"
                                >
                                  <i className="ti ti-edit" />
                                </button>
                              )}
                              {can('service_charge:delete') && (
                                <button
                                  onClick={() => openModal("delete", serviceCharge)}
                                  className="btn btn-sm btn-icon btn-danger"
                                  data-bs-toggle="tooltip"
                                  title="Delete"
                                  aria-label="Delete service charge"
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

              {!loading && serviceChargeList.length > 0 && (
                <div className="d-flex align-items-center justify-content-between flex-wrap mt-3 pt-3 border-top">
                  <div className="text-muted">
                    Showing {((currentPage - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(currentPage * pagination.limit, pagination.totalCount)} of{" "}
                    {pagination.totalCount} entries
                  </div>
                  <nav aria-label="Page navigation">
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
                      {[...Array(pagination.totalPages)].map((_, idx) => {
                        const pageNum = idx + 1;
                        if (
                          pageNum === 1 ||
                          pageNum === pagination.totalPages ||
                          (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                        ) {
                          return (
                            <li
                              key={pageNum}
                              className={`page-item ${currentPage === pageNum ? 'active' : ''}`}
                            >
                              <button
                                className="page-link"
                                onClick={() => setCurrentPage(pageNum)}
                              >
                                {pageNum}
                              </button>
                            </li>
                          );
                        } else if (
                          pageNum === currentPage - 2 ||
                          pageNum === currentPage + 2
                        ) {
                          return (
                            <li key={pageNum} className="page-item disabled">
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

      {modalType && (
        <ServiceChargeModal
          type={modalType}
          serviceCharge={selectedServiceCharge}
          onClose={closeModal}
          onSuccess={handleSuccess}
        />
      )}

      <BulkImportExport
        schema={serviceChargeSchema}
        moduleName="Service Charges"
        onImport={handleBulkImport}
        onExport={handleBulkExport}
        isOpen={showBulkImportExport}
        onClose={() => setShowBulkImportExport(false)}
        exportFilters={{ category: selectedCategory, isActive: selectedStatus }}
      />
    </>
  );
};

export default ServiceChargesComponent;
