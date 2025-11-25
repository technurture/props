"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { all_routes } from "@/router/all_routes";
import Link from "next/link";
import { Suspense, lazy } from "react";
import { apiClient } from "@/lib/services/api-client";
import { Pharmacy, PaginationInfo, Branch } from "@/types/emr";
import { usePermissions } from "@/hooks/usePermissions";
import BulkImportExport from "@/components/common/BulkImportExport";
import { pharmacySchema, ValidationError } from "@/lib/bulk-import/schemas";
import { BulkImportResponse, BulkExportRow } from "@/lib/bulk-import/types";
import { toast } from "react-toastify";

const PharmacyModal = lazy(() => import("./modal/pharmacyModal"));

interface PharmacyResponse {
  products: Pharmacy[];
  pagination: PaginationInfo;
}

const PharmacyComponent = () => {
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [products, setProducts] = useState<Pharmacy[]>([]);
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
  const [selectedProduct, setSelectedProduct] = useState<Pharmacy | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | "delete" | null>(null);
  const [showBulkImportExport, setShowBulkImportExport] = useState(false);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await apiClient.get<PharmacyResponse>(
        `/api/pharmacy?${params.toString()}`,
        { showErrorToast: true }
      );

      setProducts(response.products || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch products:", error);
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setCurrentPage(1);
  };

  const handleRefresh = () => {
    fetchProducts();
  };

  const openModal = (type: "add" | "edit" | "view" | "delete", product?: Pharmacy) => {
    setModalType(type);
    setSelectedProduct(product || null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedProduct(null);
  };

  const handleSuccess = () => {
    closeModal();
    fetchProducts();
  };

  const handleBulkImport = async (data: any[]) => {
    try {
      const response = await apiClient.post<BulkImportResponse>('/api/pharmacy/bulk-import', { data }, {
        successMessage: 'Products imported successfully',
      });
      
      fetchProducts();
      
      return {
        success: response?.success || 0,
        failed: response?.failed || 0,
        errors: response?.errors || [],
      };
    } catch (error: any) {
      toast.error(error.message || 'Failed to import products');
      throw error;
    }
  };

  const handleBulkExport = async (filters?: any): Promise<BulkExportRow[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.category) params.append('category', filters.category);
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive);
      
      const data = await apiClient.get<BulkExportRow[]>(
        `/api/pharmacy/bulk-export?${params.toString()}`,
        { showErrorToast: true }
      );
      
      return data ?? [];
    } catch (error: any) {
      toast.error(error.message || 'Failed to export products');
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

  const isExpiringSoon = (expiryDate: Date | string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return daysUntilExpiry <= 30 && daysUntilExpiry > 0;
  };

  const isExpired = (expiryDate: Date | string) => {
    return new Date(expiryDate) < new Date();
  };

  const getBranchName = (branchId: string | Branch | undefined) => {
    if (!branchId) return "N/A";
    if (typeof branchId === 'string') return branchId;
    return branchId.name || "N/A";
  };

  const renderSkeletonRow = () => (
    <tr>
      <td><div className="skeleton-loader" style={{ width: '60px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '120px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '80px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '80px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '100px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '100px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '60px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '100px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '100px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '60px', height: '16px' }}></div></td>
      <td><div className="skeleton-loader" style={{ width: '80px', height: '16px' }}></div></td>
    </tr>
  );

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Pharmacy</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Pharmacy</li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              <Link
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  handleRefresh();
                }}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Refresh"
                data-bs-original-title="Refresh"
              >
                <i className="ti ti-refresh" />
              </Link>
              {can('pharmacy:create') && (
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowBulkImportExport(true);
                  }}
                  className="btn btn-secondary"
                >
                  <i className="ti ti-upload me-1" />
                  Bulk Import/Export
                </Link>
              )}
              {can('pharmacy:create') && (
                <Link
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    openModal("add");
                  }}
                  className="btn btn-primary"
                >
                  <i className="ti ti-square-rounded-plus me-1" />
                  New Product
                </Link>
              )}
            </div>
          </div>

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h6 className="d-inline-flex align-items-center mb-0">
                Total Products
                <span className="badge bg-primary ms-2">
                  {loading ? "..." : pagination.totalCount}
                </span>
              </h6>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <form onSubmit={handleSearch} className="search-set">
                  <div className="d-flex align-items-center flex-wrap gap-2">
                    <div className="search-input">
                      <Link href="#" className="btn btn-searchset">
                        <i className="ti ti-search" />
                      </Link>
                      <input
                        type="search"
                        className="form-control"
                        placeholder="Search by name, ID, manufacturer..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                  </div>
                </form>
              </div>
            </div>
            <div className="card-body">
              <div className="table-responsive">
                <table className="table mb-0 border">
                  <thead className="table-light">
                    <tr>
                      <th>ID</th>
                      <th>Product Name</th>
                      <th>Price</th>
                      <th>Offer Price</th>
                      <th>Purchase Date</th>
                      <th>Expiry Date</th>
                      <th>Stock</th>
                      <th>Branch</th>
                      <th>Unit</th>
                      <th>Status</th>
                      <th>Actions</th>
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
                    ) : products.length === 0 ? (
                      <tr>
                        <td colSpan={11} className="text-center py-4">
                          <div className="d-flex flex-column align-items-center">
                            <i className="ti ti-package fs-1 text-muted mb-2" />
                            <p className="text-muted mb-0">No products found</p>
                            {searchTerm && (
                              <button
                                onClick={() => {
                                  setSearchTerm("");
                                  setCurrentPage(1);
                                }}
                                className="btn btn-sm btn-link"
                              >
                                Clear search
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      products.map((product) => (
                        <tr key={product._id}>
                          <td>
                            <Link
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                openModal("view", product);
                              }}
                              className="text-primary"
                            >
                              {product.productId}
                            </Link>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">{product.productName}</div>
                              {product.genericName && (
                                <small className="text-muted">{product.genericName}</small>
                              )}
                            </div>
                          </td>
                          <td>{formatCurrency(product.price)}</td>
                          <td>
                            {product.offerPrice ? (
                              <span className="text-success fw-medium">
                                {formatCurrency(product.offerPrice)}
                              </span>
                            ) : (
                              "-"
                            )}
                          </td>
                          <td>{formatDate(product.purchaseDate)}</td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              {formatDate(product.expiryDate)}
                              {isExpired(product.expiryDate) && (
                                <span className="badge bg-danger">Expired</span>
                              )}
                              {!isExpired(product.expiryDate) && isExpiringSoon(product.expiryDate) && (
                                <span className="badge bg-warning">Expiring Soon</span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <span className={product.stock <= (product.minStockLevel || 10) ? 'text-danger fw-medium' : ''}>
                                {product.stock}
                              </span>
                              {product.stock <= (product.minStockLevel || 10) && (
                                <span className="badge bg-danger">Low</span>
                              )}
                            </div>
                          </td>
                          <td>{getBranchName(product.branchId)}</td>
                          <td>{product.unit}</td>
                          <td>
                            <span className={`badge ${product.isActive ? 'bg-success' : 'bg-secondary'}`}>
                              {product.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-1">
                              <Link
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  openModal("view", product);
                                }}
                                className="btn btn-icon btn-sm btn-light"
                                data-bs-toggle="tooltip"
                                title="View"
                              >
                                <i className="ti ti-eye" />
                              </Link>
                              {can('pharmacy:update') && (
                                <Link
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openModal("edit", product);
                                  }}
                                  className="btn btn-icon btn-sm btn-light"
                                  data-bs-toggle="tooltip"
                                  title="Edit"
                                >
                                  <i className="ti ti-edit" />
                                </Link>
                              )}
                              {can('pharmacy:update') && (
                                <Link
                                  href="#"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openModal("delete", product);
                                  }}
                                  className="btn btn-icon btn-sm btn-light"
                                  data-bs-toggle="tooltip"
                                  title="Delete"
                                >
                                  <i className="ti ti-trash" />
                                </Link>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {!loading && products.length > 0 && (
                <div className="d-flex align-items-center justify-content-between flex-wrap mt-3">
                  <div className="text-muted">
                    Showing {((currentPage - 1) * pagination.limit) + 1} to{" "}
                    {Math.min(currentPage * pagination.limit, pagination.totalCount)} of{" "}
                    {pagination.totalCount} entries
                  </div>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${!pagination.hasPreviousPage ? 'disabled' : ''}`}>
                        <Link
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (pagination.hasPreviousPage) setCurrentPage(currentPage - 1);
                          }}
                          className="page-link"
                        >
                          Previous
                        </Link>
                      </li>
                      {[...Array(pagination.totalPages)].map((_, index) => {
                        const pageNumber = index + 1;
                        if (
                          pageNumber === 1 ||
                          pageNumber === pagination.totalPages ||
                          (pageNumber >= currentPage - 1 && pageNumber <= currentPage + 1)
                        ) {
                          return (
                            <li
                              key={pageNumber}
                              className={`page-item ${currentPage === pageNumber ? 'active' : ''}`}
                            >
                              <Link
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  setCurrentPage(pageNumber);
                                }}
                                className="page-link"
                              >
                                {pageNumber}
                              </Link>
                            </li>
                          );
                        } else if (
                          pageNumber === currentPage - 2 ||
                          pageNumber === currentPage + 2
                        ) {
                          return (
                            <li key={pageNumber} className="page-item disabled">
                              <span className="page-link">...</span>
                            </li>
                          );
                        }
                        return null;
                      })}
                      <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                        <Link
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            if (pagination.hasNextPage) setCurrentPage(currentPage + 1);
                          }}
                          className="page-link"
                        >
                          Next
                        </Link>
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
          <PharmacyModal
            type={modalType}
            product={selectedProduct}
            onClose={closeModal}
            onSuccess={handleSuccess}
          />
        )}
      </Suspense>

      <BulkImportExport
        schema={pharmacySchema}
        moduleName="Pharmacy"
        onImport={handleBulkImport}
        onExport={handleBulkExport}
        isOpen={showBulkImportExport}
        onClose={() => setShowBulkImportExport(false)}
      />
    </>
  );
};

export default PharmacyComponent;
