"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { all_routes } from "@/router/all_routes";
import Link from "next/link";
import { apiClient } from "@/lib/services/api-client";
import { toast } from "react-toastify";
import { PermissionGate } from "@/components/common/PermissionGate";
import { usePermissions } from "@/hooks/usePermissions";

interface Payment {
  _id: string;
  invoiceId: {
    _id: string;
    invoiceNumber: string;
    totalAmount: number;
  };
  patientId: {
    firstName: string;
    lastName: string;
    patientId: string;
  };
  amount: number;
  paymentMethod: string;
  paymentDate: Date;
  status: string;
  transactionId?: string;
  notes?: string;
}

const AccountingComponent = () => {
  const { data: session } = useSession();
  const { can } = usePermissions();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(searchTerm && { search: searchTerm }),
        ...(filterStatus !== "all" && { status: filterStatus }),
      });
      
      const response = await apiClient.get<{ payments: Payment[] }>(
        `/api/billing/payments?${params.toString()}`,
        { showErrorToast: true }
      );
      
      setPayments(response.payments || []);
    } catch (error) {
      console.error("Failed to fetch payments:", error);
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayments();
  }, [filterStatus]);

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    fetchPayments();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed':
        return 'badge-soft-success';
      case 'pending':
        return 'badge-soft-warning';
      case 'failed':
        return 'badge-soft-danger';
      case 'refunded':
        return 'badge-soft-info';
      default:
        return 'badge-soft-secondary';
    }
  };

  const calculateTotals = () => {
    const total = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const completed = payments.filter(p => p.status === 'completed').reduce((sum, p) => sum + p.amount, 0);
    const pending = payments.filter(p => p.status === 'pending').reduce((sum, p) => sum + p.amount, 0);
    
    return { total, completed, pending };
  };

  const totals = calculateTotals();

  return (
    <PermissionGate 
      required="accounting:read"
      fallback={
        <div className="page-wrapper">
          <div className="content">
            <div className="text-center py-5">
              <h4>Access Denied</h4>
              <p>You don't have permission to access this page.</p>
            </div>
          </div>
        </div>
      }
    >
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Accounting & Payments</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item">Manage</li>
                  <li className="breadcrumb-item active">Accounting</li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              <button
                onClick={fetchPayments}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Refresh"
              >
                <i className="ti ti-refresh" />
              </button>
              <button className="btn btn-icon btn-white">
                <i className="ti ti-download" />
              </button>
            </div>
          </div>

          <div className="row mb-4">
            <div className="col-lg-4 col-md-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-muted">Total Revenue</p>
                      <h4 className="mb-0">{formatCurrency(totals.total)}</h4>
                    </div>
                    <span className="avatar rounded-circle bg-soft-success text-success">
                      <i className="ti ti-currency-dollar fs-24" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-muted">Completed Payments</p>
                      <h4 className="mb-0">{formatCurrency(totals.completed)}</h4>
                    </div>
                    <span className="avatar rounded-circle bg-soft-primary text-primary">
                      <i className="ti ti-checks fs-24" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <div className="col-lg-4 col-md-6">
              <div className="card">
                <div className="card-body">
                  <div className="d-flex align-items-center justify-content-between">
                    <div>
                      <p className="mb-1 text-muted">Pending Payments</p>
                      <h4 className="mb-0">{formatCurrency(totals.pending)}</h4>
                    </div>
                    <span className="avatar rounded-circle bg-soft-warning text-warning">
                      <i className="ti ti-clock fs-24" />
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h5 className="d-inline-flex align-items-center mb-0">
                Payment Transactions
                <span className="badge bg-primary ms-2">{payments.length}</span>
              </h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <form onSubmit={handleSearch} className="me-2">
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Search payments..."
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
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                  <option value="refunded">Refunded</option>
                </select>
              </div>
            </div>
            <div className="card-body p-0">
              <div className="table-responsive">
                <table className="table table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th>Transaction ID</th>
                      <th>Invoice #</th>
                      <th>Patient</th>
                      <th>Amount</th>
                      <th>Payment Method</th>
                      <th>Date</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <div className="spinner-border text-primary" role="status">
                            <span className="visually-hidden">Loading...</span>
                          </div>
                        </td>
                      </tr>
                    ) : payments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-4">
                          <div className="text-muted">
                            <i className="ti ti-file-invoice fs-48 mb-2 d-block" />
                            <p className="mb-0">No payments found</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      payments.map((payment) => (
                        <tr key={payment._id}>
                          <td>
                            <span className="fw-medium">
                              {payment.transactionId || '-'}
                            </span>
                          </td>
                          <td>
                            <Link href="#" className="text-primary">
                              {payment.invoiceId?.invoiceNumber || '-'}
                            </Link>
                          </td>
                          <td>
                            <div>
                              <p className="mb-0 fw-medium">
                                {payment.patientId?.firstName} {payment.patientId?.lastName}
                              </p>
                              <span className="text-muted fs-13">
                                ID: {payment.patientId?.patientId}
                              </span>
                            </div>
                          </td>
                          <td className="fw-semibold text-success">
                            {formatCurrency(payment.amount)}
                          </td>
                          <td>
                            <span className="badge badge-soft-info">
                              {payment.paymentMethod}
                            </span>
                          </td>
                          <td>{formatDate(payment.paymentDate)}</td>
                          <td>
                            <span className={`badge ${getStatusBadge(payment.status)}`}>
                              {payment.status}
                            </span>
                          </td>
                          <td>
                            <div className="dropdown">
                              <button
                                className="btn btn-sm btn-icon btn-white"
                                type="button"
                                data-bs-toggle="dropdown"
                                aria-expanded="false"
                              >
                                <i className="ti ti-dots-vertical" />
                              </button>
                              <ul className="dropdown-menu dropdown-menu-end">
                                <li>
                                  <Link className="dropdown-item" href="#">
                                    <i className="ti ti-eye me-2" />
                                    View Details
                                  </Link>
                                </li>
                                <li>
                                  <Link className="dropdown-item" href="#">
                                    <i className="ti ti-download me-2" />
                                    Download Receipt
                                  </Link>
                                </li>
                                {payment.status === 'completed' && can('accounting:update') && (
                                  <li>
                                    <button className="dropdown-item text-danger">
                                      <i className="ti ti-arrow-back-up me-2" />
                                      Issue Refund
                                    </button>
                                  </li>
                                )}
                              </ul>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>
    </PermissionGate>
  );
};

export default AccountingComponent;
