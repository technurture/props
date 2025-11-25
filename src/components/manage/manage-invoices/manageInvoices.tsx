"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import { apiClient } from "@/lib/services/api-client";
import { toast } from "react-toastify";
import { Suspense, lazy } from "react";

const InvoiceModal = lazy(() => import("./InvoiceModal"));
const InvoiceViewModal = lazy(() => import("./InvoiceViewModal"));

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  patient: {
    _id: string;
    patientId: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
    email?: string;
  };
  branch: {
    _id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    code?: string;
  };
  encounterId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  balance: number;
  status: 'pending' | 'partially_paid' | 'paid' | 'cancelled' | 'overdue';
  paymentMethod?: string;
  insurance?: {
    provider: string;
    claimNumber: string;
    claimAmount: number;
  };
  dueDate: Date;
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

const ManageInvoices = () => {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
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
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [modalType, setModalType] = useState<"add" | "edit" | "view" | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const userRole = session?.user?.role as string;
  const hasAccess = ["ADMIN", "ACCOUNTING", "BILLING"].includes(userRole);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.currentPage.toString(),
        limit: "20",
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== "all" && { status: filterStatus }),
      });

      const response = await apiClient.get<{ invoices: Invoice[]; pagination: PaginationInfo }>(
        `/api/billing/invoices?${params.toString()}`,
        { showErrorToast: true }
      );

      setInvoices(response.invoices || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setPagination(prev => ({ ...prev, currentPage: 1 }));
  }, [searchTerm]);

  useEffect(() => {
    if (hasAccess) {
      fetchInvoices();
    }
  }, [pagination.currentPage, filterStatus, searchTerm]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
  };

  const handleRefresh = () => {
    fetchInvoices();
  };

  const openModal = (type: "add" | "edit" | "view", invoice?: Invoice) => {
    setModalType(type);
    setSelectedInvoice(invoice || null);
  };

  const closeModal = () => {
    setModalType(null);
    setSelectedInvoice(null);
  };

  const handleSuccess = () => {
    closeModal();
    fetchInvoices();
  };

  const handleDelete = async (id: string) => {
    if (deleteConfirmId === id) {
      try {
        await apiClient.delete(`/api/billing/invoices/${id}`, {
          successMessage: "Invoice deleted successfully",
        });
        fetchInvoices();
        setDeleteConfirmId(null);
      } catch (error) {
        console.error("Failed to delete invoice:", error);
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
      case 'sent':
        return 'badge-soft-info';
      case 'draft':
        return 'badge-soft-secondary';
      case 'overdue':
        return 'badge-soft-danger';
      case 'cancelled':
        return 'badge-soft-dark';
      default:
        return 'badge-soft-secondary';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'sent':
        return 'Sent';
      case 'draft':
        return 'Draft';
      case 'overdue':
        return 'Overdue';
      case 'cancelled':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const calculateStats = () => {
    const totalAmount = invoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
    const paidAmount = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.grandTotal, 0);
    const pendingAmount = invoices.filter(i => i.status === 'pending').reduce((sum, i) => sum + i.balance, 0);
    const overdueAmount = invoices.filter(i => i.status === 'overdue').reduce((sum, i) => sum + i.balance, 0);

    return { totalAmount, paidAmount, pendingAmount, overdueAmount };
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
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Invoices</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Invoices</li>
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
                <i className="ti ti-printer" />
              </button>
              <button className="btn btn-icon btn-white">
                <i className="ti ti-download" />
              </button>
              <button
                onClick={() => openModal("add")}
                className="btn btn-primary"
              >
                <i className="ti ti-square-rounded-plus me-1" />
                New Invoice
              </button>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-xl-3 col-md-6 col-12 mb-3 mb-xl-0">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                    <div>
                      <p className="mb-1 text-muted">Total Invoices</p>
                      <h4 className="mb-0">{formatCurrency(stats.totalAmount)}</h4>
                    </div>
                    <span className="avatar rounded-circle bg-soft-primary text-primary">
                      <i className="ti ti-file-invoice fs-24" />
                    </span>
                  </div>
                  <div>
                    <p className="d-flex align-items-center fs-13 mb-0 text-muted">
                      {pagination.totalCount} invoices
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 col-12 mb-3 mb-xl-0">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                    <div>
                      <p className="mb-1 text-muted">Paid</p>
                      <h4 className="mb-0">{formatCurrency(stats.paidAmount)}</h4>
                    </div>
                    <span className="avatar rounded-circle bg-soft-success text-success">
                      <i className="ti ti-checks fs-24" />
                    </span>
                  </div>
                  <div>
                    <p className="d-flex align-items-center fs-13 mb-0 text-muted">
                      {invoices.filter(i => i.status === 'paid').length} paid
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 col-12 mb-3 mb-md-0">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                    <div>
                      <p className="mb-1 text-muted">Pending</p>
                      <h4 className="mb-0">{formatCurrency(stats.pendingAmount)}</h4>
                    </div>
                    <span className="avatar rounded-circle bg-soft-warning text-warning">
                      <i className="ti ti-clock fs-24" />
                    </span>
                  </div>
                  <div>
                    <p className="d-flex align-items-center fs-13 mb-0 text-muted">
                      {invoices.filter(i => i.status === 'pending').length} pending
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-xl-3 col-md-6 col-12">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                    <div>
                      <p className="mb-1 text-muted">Overdue</p>
                      <h4 className="mb-0">{formatCurrency(stats.overdueAmount)}</h4>
                    </div>
                    <span className="avatar rounded-circle bg-soft-danger text-danger">
                      <i className="ti ti-calendar-exclamation fs-24" />
                    </span>
                  </div>
                  <div>
                    <p className="d-flex align-items-center fs-13 mb-0 text-muted">
                      {invoices.filter(i => i.status === 'overdue').length} overdue
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h5 className="d-inline-flex align-items-center mb-0">
                Invoices
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
                  <option value="sent">Sent</option>
                  <option value="draft">Draft</option>
                  <option value="overdue">Overdue</option>
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
                      <th>Created Date</th>
                      <th>Amount</th>
                      <th>Due Date</th>
                      <th>Status</th>
                      <th className="text-end">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : invoices.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-4">
                          <div className="text-muted">
                            <i className="ti ti-file-invoice fs-48 mb-2 d-block" />
                            <p className="mb-0">No invoices found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      invoices.map((invoice) => (
                        <tr key={invoice._id}>
                          <td>
                            <Link 
                              href="#" 
                              onClick={(e) => {
                                e.preventDefault();
                                openModal("view", invoice);
                              }}
                              className="text-primary fw-medium"
                            >
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td>
                            <div>
                              <div className="fw-medium">
                                {invoice.patient.firstName} {invoice.patient.lastName}
                              </div>
                              <div className="text-muted small">
                                {invoice.patient.patientId}
                              </div>
                            </div>
                          </td>
                          <td>{formatDate(invoice.createdAt)}</td>
                          <td>
                            <div className="fw-medium">{formatCurrency(invoice.grandTotal)}</div>
                            {invoice.balance > 0 && (
                              <div className="text-muted small">
                                Balance: {formatCurrency(invoice.balance)}
                              </div>
                            )}
                          </td>
                          <td>{formatDate(invoice.dueDate)}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(invoice.status)}`}>
                              {getStatusLabel(invoice.status)}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex justify-content-end gap-1">
                              <button
                                onClick={() => openModal("view", invoice)}
                                className="btn btn-icon btn-sm btn-outline-light"
                                title="View"
                              >
                                <i className="ti ti-eye" />
                              </button>
                              <button
                                onClick={() => openModal("edit", invoice)}
                                className="btn btn-icon btn-sm btn-outline-light"
                                title="Edit"
                              >
                                <i className="ti ti-edit" />
                              </button>
                              <button
                                onClick={() => handleDelete(invoice._id)}
                                className={`btn btn-icon btn-sm ${
                                  deleteConfirmId === invoice._id
                                    ? 'btn-danger'
                                    : 'btn-outline-light'
                                }`}
                                title={deleteConfirmId === invoice._id ? 'Click again to confirm' : 'Delete'}
                              >
                                <i className="ti ti-trash" />
                              </button>
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
                <nav>
                  <ul className="pagination justify-content-center mb-0">
                    <li className={`page-item ${!pagination.hasPreviousPage ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage - 1 }))}
                        disabled={!pagination.hasPreviousPage}
                      >
                        <i className="ti ti-chevron-left" />
                      </button>
                    </li>
                    {[...Array(pagination.totalPages)].map((_, i) => (
                      <li
                        key={i}
                        className={`page-item ${pagination.currentPage === i + 1 ? 'active' : ''}`}
                      >
                        <button
                          className="page-link"
                          onClick={() => setPagination(prev => ({ ...prev, currentPage: i + 1 }))}
                        >
                          {i + 1}
                        </button>
                      </li>
                    ))}
                    <li className={`page-item ${!pagination.hasNextPage ? 'disabled' : ''}`}>
                      <button
                        className="page-link"
                        onClick={() => setPagination(prev => ({ ...prev, currentPage: prev.currentPage + 1 }))}
                        disabled={!pagination.hasNextPage}
                      >
                        <i className="ti ti-chevron-right" />
                      </button>
                    </li>
                  </ul>
                </nav>
              </div>
            )}
          </div>
        </div>
      </div>

      {modalType && (
        <Suspense fallback={<div>Loading...</div>}>
          {modalType === "view" ? (
            <InvoiceViewModal
              invoice={selectedInvoice}
              onClose={closeModal}
            />
          ) : (
            <InvoiceModal
              type={modalType as "add" | "edit"}
              invoice={modalType === "edit" ? selectedInvoice : null}
              onClose={closeModal}
              onSuccess={handleSuccess}
            />
          )}
        </Suspense>
      )}
    </>
  );
};

export default ManageInvoices;
