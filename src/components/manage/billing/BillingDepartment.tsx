"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import { apiClient } from "@/lib/services/api-client";
import { toast } from "react-toastify";
import { Suspense, lazy } from "react";
import { usePermissions } from "@/hooks/usePermissions";

const BillingModal = lazy(() => import("./BillingModal"));
const BillingViewModal = lazy(() => import("./BillingViewModal"));

interface BillingItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: 'consultation' | 'procedure' | 'medication' | 'lab_test' | 'other';
}

interface BillingRecord {
  _id: string;
  invoiceNumber: string;
  patient: {
    _id: string;
    patientId: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
    insurance?: {
      provider: string;
      policyNumber: string;
    };
  };
  branch: {
    _id: string;
    name: string;
    address: string;
    city: string;
    state: string;
  };
  items: BillingItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'cancelled';
  paymentStatus: 'unpaid' | 'partially_paid' | 'paid';
  insurance?: {
    provider: string;
    policyNumber: string;
    claimAmount: number;
    claimStatus: 'pending' | 'approved' | 'rejected';
    approvalNumber?: string;
  };
  dueDate: Date;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

const BillingDepartmentComponent = () => {
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [billingRecords, setBillingRecords] = useState<BillingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [selectedRecord, setSelectedRecord] = useState<BillingRecord | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const hasAccess = can('billing:read');

  const fetchBillingRecords = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== "all" && { status: filterStatus }),
      });

      const response = await apiClient.get<{ billingRecords: BillingRecord[]; pagination: PaginationInfo }>(
        `/api/billing/records?${params.toString()}`,
        { showErrorToast: true }
      );

      setBillingRecords(response.billingRecords || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch billing records:", error);
      setBillingRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchTerm]);

  useEffect(() => {
    if (hasAccess) {
      fetchBillingRecords();
    }
  }, [pagination.currentPage, filterStatus, searchTerm]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleRefresh = () => {
    fetchBillingRecords();
  };

  const openModal = (type: "add" | "edit" | "view", record?: BillingRecord) => {
    setModalType(type);
    setSelectedRecord(record || null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedRecord(null);
  };

  const handleSuccess = () => {
    closeModal();
    fetchBillingRecords();
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirmId === id) {
      try {
        await apiClient.delete(`/api/billing/records/${id}`, {
          successMessage: "Billing record deleted successfully",
        });
        fetchBillingRecords();
        setDeleteConfirmId(null);
      } catch (error) {
        console.error("Failed to delete billing record:", error);
      }
    } else {
      setDeleteConfirmId(id);
      setTimeout(() => setDeleteConfirmId(null), 3000);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'badge-soft-success';
      case 'pending':
        return 'badge-soft-warning';
      case 'partially_paid':
        return 'badge-soft-info';
      case 'cancelled':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'partially_paid':
        return 'Partially Paid';
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const calculateStats = () => {
    const totalRevenue = billingRecords.reduce((sum, record) => sum + record.totalAmount, 0);
    const pendingAmount = billingRecords.filter(r => r.status === 'pending').reduce((sum, r) => sum + r.balance, 0);
    const paidAmount = billingRecords.filter(r => r.status === 'paid').reduce((sum, r) => sum + r.totalAmount, 0);
    const pendingCount = billingRecords.filter(r => r.status === 'pending').length;
    const paidCount = billingRecords.filter(r => r.status === 'paid').length;

    return { totalRevenue, pendingAmount, paidAmount, pendingCount, paidCount };
  };

  const stats = calculateStats();

  if (!hasAccess) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center py-5">
            <h4>Access Denied</h4>
            <p>You don't have permission to access this page.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content billing-dashboard-page">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Billing Department</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item">Manage</li>
                  <li className="breadcrumb-item active">Billing Department</li>
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
                disabled={loading}
              >
                <i className={`ti ti-refresh ${loading ? 'spin' : ''}`} />
              </button>
              <button className="btn btn-icon btn-white">
                <i className="ti ti-download" />
              </button>
              {can('billing:create') && (
                <button
                  onClick={() => openModal("add")}
                  className="btn btn-primary"
                >
                  <i className="ti ti-square-rounded-plus me-1" />
                  New Billing Record
                </button>
              )}
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-lg-4 col-md-6 col-12 mb-3 mb-lg-0">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-muted">Total Revenue</p>
                      <h4 className="mb-0">{formatCurrency(stats.totalRevenue)}</h4>
                    </div>
                    <span className="avatar rounded-circle bg-soft-success text-success">
                      <i className="ti ti-currency-dollar fs-24" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 col-12 mb-3 mb-lg-0">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-muted">Pending ({stats.pendingCount})</p>
                      <h4 className="mb-0">{formatCurrency(stats.pendingAmount)}</h4>
                    </div>
                    <span className="avatar rounded-circle bg-soft-warning text-warning">
                      <i className="ti ti-clock fs-24" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6 col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-muted">Paid ({stats.paidCount})</p>
                      <h4 className="mb-0">{formatCurrency(stats.paidAmount)}</h4>
                    </div>
                    <span className="avatar rounded-circle bg-soft-primary text-primary">
                      <i className="ti ti-checks fs-24" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h5 className="d-inline-flex align-items-center mb-0">
                Billing Records
                <span className="badge bg-primary ms-2">{pagination.totalCount}</span>
              </h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <form onSubmit={handleSearch} className="me-2">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search by invoice, patient..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <button className="btn btn-outline-secondary" type="submit">
                      <i className="ti ti-search" />
                    </button>
                  </div>
                </form>
                <select
                  className="form-select w-auto"
                  value={filterStatus}
                  onChange={(e) => {
                    setFilterStatus(e.target.value);
                    setPagination(prev => ({ ...prev, currentPage: 1 }));
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="paid">Paid</option>
                  <option value="unpaid">Unpaid</option>
                  <option value="partial">Partially Paid</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Invoice #</th>
                      <th>Patient</th>
                      <th>Date</th>
                      <th>Amount</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : billingRecords.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="text-center py-4">
                          <div className="text-muted">
                            <i className="ti ti-file-invoice fs-48 mb-2 d-block" />
                            <p className="mb-0">No billing records found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      billingRecords.map((record) => (
                        <tr key={record._id}>
                          <td>
                            <Link 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                openModal("view", record);
                              }}
                              className="text-primary fw-medium"
                            >
                              {record.invoiceNumber}
                            </Link>
                          </td>
                          <td>
                            <div>
                              <p className="mb-0 fw-medium">
                                {record.patient?.firstName} {record.patient?.lastName}
                              </p>
                              <span className="text-muted fs-13">
                                ID: {record.patient?.patientId}
                              </span>
                            </div>
                          </td>
                          <td>{formatDate(record.createdAt)}</td>
                          <td className="fw-semibold text-success">
                            {formatCurrency(record.totalAmount)}
                          </td>
                          <td>
                            <span className={`badge ${getStatusBadge(record.status)}`}>
                              {getStatusLabel(record.status)}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center justify-content-end gap-2">
                              <button
                                onClick={() => openModal("view", record)}
                                className="btn btn-icon btn-sm btn-white"
                                data-bs-toggle="tooltip"
                                data-bs-placement="top"
                                title="View"
                              >
                                <i className="ti ti-eye" />
                              </button>
                              {can('billing:update') && (
                                <button
                                  onClick={() => openModal("edit", record)}
                                  className="btn btn-icon btn-sm btn-white"
                                  data-bs-toggle="tooltip"
                                  data-bs-placement="top"
                                  title="Edit"
                                >
                                  <i className="ti ti-edit" />
                                </button>
                              )}
                              {can('billing:delete') && (
                                <button
                                  onClick={() => handleDelete(record._id)}
                                  className={`btn btn-icon btn-sm ${deleteConfirmId === record._id ? 'btn-danger' : 'btn-white'}`}
                                  data-bs-toggle="tooltip"
                                  data-bs-placement="top"
                                  title={deleteConfirmId === record._id ? "Click again to confirm" : "Delete"}
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
                <div className="d-flex align-items-center justify-content-between flex-wrap gap-2">
                  <p className="mb-0 text-muted">
                    Showing {((pagination.currentPage - 1) * pagination.limit) + 1} to{' '}
                    {Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of{' '}
                    {pagination.totalCount} records
                  </p>
                  <nav>
                    <ul className="pagination mb-0">
                      <li className={`page-item ${!pagination.hasPreviousPage ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                          disabled={!pagination.hasPreviousPage}
                        >
                          Previous
                        </button>
                      </li>
                      {[...Array(pagination.totalPages)].map((_, index) => (
                        <li
                          key={index}
                          className={`page-item ${pagination.currentPage === index + 1 ? 'active' : ''}`}
                        >
                          <button
                            className="page-link"
                            onClick={() => setPagination(prev => ({ ...prev, currentPage: index + 1 }))}
                          >
                            {index + 1}
                          </button>
                        </li>
                      ))}
                      <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                        <button
                          className="page-link"
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
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
      </div>

      {modalType && (
        <Suspense fallback={<div>Loading...</div>}>
          {modalType === "view" ? (
            <BillingViewModal
              record={selectedRecord}
              onClose={closeModal}
            />
          ) : (
            <BillingModal
              type={modalType}
              record={selectedRecord}
              onClose={closeModal}
              onSuccess={handleSuccess}
            />
          )}
        </Suspense>
      )}
    </>
  );
};

export default BillingDepartmentComponent;
