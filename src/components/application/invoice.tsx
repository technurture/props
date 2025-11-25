"use client";
import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { format } from "date-fns";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { apiClient } from "@/lib/services/api-client";

interface Patient {
  _id: string;
  patientId: string;
  firstName: string;
  lastName: string;
  profileImage?: string;
}

interface Invoice {
  _id: string;
  invoiceNumber: string;
  patientId: Patient;
  grandTotal: number;
  balance: number;
  paidAmount: number;
  status: string;
  createdAt: string;
  updatedAt: string;
}

interface InvoiceStats {
  totalRevenue: number;
  unpaidAmount: number;
  pendingAmount: number;
  paidCount: number;
}

interface PaginationInfo {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

interface InvoicesResponse {
  invoices: Invoice[];
  pagination: PaginationInfo;
}

const InvoiceComponent = () => {
  const { data: session } = useSession();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<InvoiceStats | null>(null);
  const [pagination, setPagination] = useState<PaginationInfo>({
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    limit: 20,
    hasNextPage: false,
    hasPreviousPage: false,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchInvoices = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: "20",
      });

      const response = await apiClient.get<InvoicesResponse>(
        `/api/billing/invoices?${params.toString()}`,
        { showErrorToast: false }
      );

      setInvoices(response.invoices || []);
      setPagination(response.pagination);
    } catch (error) {
      console.error("Failed to fetch invoices:", error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [currentPage]);

  const fetchStats = useCallback(async () => {
    try {
      const response = await apiClient.get<InvoicesResponse>(
        `/api/billing/invoices?limit=1000`,
        { showErrorToast: false }
      );

      const allInvoices = response.invoices || [];
      
      const totalRevenue = allInvoices.reduce((sum, inv) => sum + inv.grandTotal, 0);
      const unpaidAmount = allInvoices
        .filter(inv => inv.status === 'PENDING')
        .reduce((sum, inv) => sum + inv.balance, 0);
      const pendingAmount = allInvoices
        .filter(inv => inv.status === 'PARTIALLY_PAID')
        .reduce((sum, inv) => sum + inv.balance, 0);
      const paidCount = allInvoices.filter(inv => inv.status === 'PAID').length;

      setStats({
        totalRevenue,
        unpaidAmount,
        pendingAmount,
        paidCount
      });
    } catch (error) {
      console.error("Failed to fetch invoice stats:", error);
    }
  }, []);

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  useEffect(() => {
    fetchStats();
  }, []);

  const handleDelete = async (id: string) => {
    try {
      await apiClient.delete(`/api/billing/invoices/${id}`, {
        successMessage: "Invoice cancelled successfully",
      });
      setDeleteConfirmId(null);
      fetchInvoices();
      fetchStats();
    } catch (error) {
      console.error("Failed to delete invoice:", error);
    }
  };

  const formatDate = (date: Date | string) => {
    try {
      return format(new Date(date), 'dd MMM yyyy, hh:mm a');
    } catch {
      return 'N/A';
    }
  };

  const formatCurrency = (amount: number) => {
    return `₦${amount.toFixed(2)}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PAID':
        return <span className="badge badge-soft-success">Paid</span>;
      case 'PENDING':
        return <span className="badge badge-soft-warning">Pending</span>;
      case 'PARTIALLY_PAID':
        return <span className="badge badge-soft-info">Partially Paid</span>;
      case 'CANCELLED':
        return <span className="badge badge-soft-danger">Cancelled</span>;
      default:
        return <span className="badge badge-soft-secondary">{status}</span>;
    }
  };

  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Invoice</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href="#">Applications</Link>
                  </li>
                  <li className="breadcrumb-item active">Invoice</li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              <button
                onClick={() => {
                  fetchInvoices();
                  fetchStats();
                }}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Refresh"
                data-bs-original-title="Refresh"
              >
                <i className="ti ti-refresh" />
              </button>
              <Link href={all_routes.addInvoice} className="btn btn-primary">
                <i className="ti ti-square-rounded-plus me-1" />
                New Invoice
              </Link>
            </div>
          </div>

          <div className="row">
            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                    <div>
                      <p className="mb-1">Total Revenue</p>
                      <h6 className="mb-0">
                        {loading ? '...' : formatCurrency(stats?.totalRevenue || 0)}
                      </h6>
                    </div>
                    <span className="avatar rounded-circle bg-soft-primary text-primary">
                      <i className="ti ti-components fs-24" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                    <div>
                      <p className="mb-1">Unpaid Invoice</p>
                      <h6 className="mb-0">
                        {loading ? '...' : formatCurrency(stats?.unpaidAmount || 0)}
                      </h6>
                    </div>
                    <span className="avatar rounded-circle bg-soft-pink text-pink">
                      <i className="ti ti-clipboard-data fs-24" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                    <div>
                      <p className="mb-1">Partially Paid</p>
                      <h6 className="mb-0">
                        {loading ? '...' : formatCurrency(stats?.pendingAmount || 0)}
                      </h6>
                    </div>
                    <span className="avatar rounded-circle bg-soft-indigo text-indigo">
                      <i className="ti ti-cards fs-24" />
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-3 col-md-6 d-flex">
              <div className="card flex-fill">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between border-bottom pb-3 mb-3">
                    <div>
                      <p className="mb-1">Paid Invoices</p>
                      <h6 className="mb-0">
                        {loading ? '...' : stats?.paidCount || 0}
                      </h6>
                    </div>
                    <span className="avatar rounded-circle bg-soft-orange text-orange">
                      <i className="ti ti-calendar-event fs-24" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h6 className="d-inline-flex align-items-center mb-0">
                Total Invoices
                <span className="badge bg-danger ms-2">{pagination.totalCount}</span>
              </h6>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : invoices.length === 0 ? (
                <div className="text-center py-5">
                  <p className="text-muted mb-0">No invoices found</p>
                </div>
              ) : (
                <div className="table-responsive table-nowrap">
                  <table className="table border">
                    <thead className="table-light">
                      <tr>
                        <th>Invoice #</th>
                        <th>Patient</th>
                        <th>Created Date</th>
                        <th>Total Amount</th>
                        <th>Paid Amount</th>
                        <th>Balance</th>
                        <th>Status</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((invoice) => (
                        <tr key={invoice._id}>
                          <td>
                            <Link href={`${all_routes.invoiceDetails}?id=${invoice._id}`}>
                              {invoice.invoiceNumber}
                            </Link>
                          </td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link href="#" className="avatar avatar-sm me-2">
                                {invoice.patientId?.profileImage ? (
                                  <ImageWithBasePath
                                    src={invoice.patientId.profileImage}
                                    alt="patient"
                                  />
                                ) : (
                                  <span className="avatar-text bg-primary rounded">
                                    {invoice.patientId?.firstName?.[0]}{invoice.patientId?.lastName?.[0]}
                                  </span>
                                )}
                              </Link>
                              <h6 className="mb-0 fs-14 fw-medium">
                                <Link href={`${all_routes.patientDetails}?id=${invoice.patientId?._id}`}>
                                  {invoice.patientId?.firstName} {invoice.patientId?.lastName}
                                </Link>
                              </h6>
                            </div>
                          </td>
                          <td>{formatDate(invoice.createdAt)}</td>
                          <td>{formatCurrency(invoice.grandTotal)}</td>
                          <td>{formatCurrency(invoice.paidAmount)}</td>
                          <td>{formatCurrency(invoice.balance)}</td>
                          <td>{getStatusBadge(invoice.status)}</td>
                          <td className="text-end">
                            <div className="d-flex gap-2 justify-content-end">
                              <Link
                                href={`${all_routes.invoiceDetails}?id=${invoice._id}`}
                                className="btn btn-sm btn-icon btn-light"
                                data-bs-toggle="tooltip"
                                title="View Details"
                              >
                                <i className="ti ti-eye" />
                              </Link>
                              <Link
                                href={`${all_routes.editInvoice}?id=${invoice._id}`}
                                className="btn btn-sm btn-icon btn-light"
                                data-bs-toggle="tooltip"
                                title="Edit"
                              >
                                <i className="ti ti-edit" />
                              </Link>
                              {isAdmin && (
                                <button
                                  onClick={() => setDeleteConfirmId(invoice._id)}
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
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {!loading && invoices.length > 0 && (
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
              <p>Are you sure you want to cancel this invoice? This action cannot be undone.</p>
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

export default InvoiceComponent;
