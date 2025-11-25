"use client";
import { useEffect } from "react";

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

interface InvoiceViewModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

const InvoiceViewModal = ({ invoice, onClose }: InvoiceViewModalProps) => {
  useEffect(() => {
    if (invoice) {
      const modalElement = document.getElementById("view_invoice");
      if (modalElement) {
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();

        const handleHidden = () => {
          onClose();
        };
        modalElement.addEventListener('hidden.bs.modal', handleHidden);

        return () => {
          modalElement.removeEventListener('hidden.bs.modal', handleHidden);
          modal.dispose();
        };
      }
    }
  }, [invoice, onClose]);

  if (!invoice) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
      case 'overdue':
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
      case 'overdue':
        return 'Overdue';
      default:
        return status;
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div
      className="modal fade"
      id="view_invoice"
      tabIndex={-1}
      aria-labelledby="view_invoice_label"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="view_invoice_label">
              Invoice Details
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
          </div>
          <div className="modal-body">
            <div className="card bg-light mb-3">
              <div className="card-body">
                <div className="row">
                  <div className="col-md-6 mb-3 mb-md-0">
                    <h6 className="text-muted mb-2">Invoice Information</h6>
                    <p className="mb-1">
                      <strong>Invoice #:</strong> {invoice.invoiceNumber}
                    </p>
                    <p className="mb-1">
                      <strong>Date:</strong> {formatDate(invoice.createdAt)}
                    </p>
                    <p className="mb-0">
                      <strong>Status:</strong>{' '}
                      <span className={`badge ${getStatusBadge(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </p>
                  </div>
                  <div className="col-md-6">
                    <h6 className="text-muted mb-2">Patient Information</h6>
                    <p className="mb-1">
                      <strong>Name:</strong> {invoice.patient?.firstName} {invoice.patient?.lastName}
                    </p>
                    <p className="mb-1">
                      <strong>Patient ID:</strong> {invoice.patient?.patientId}
                    </p>
                    <p className="mb-1">
                      <strong>Phone:</strong> {invoice.patient?.phoneNumber}
                    </p>
                    {invoice.patient?.email && (
                      <p className="mb-0">
                        <strong>Email:</strong> {invoice.patient.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-3">
              <h6 className="mb-2">Branch Information</h6>
              <p className="mb-1">
                <strong>Branch:</strong> {invoice.branch?.name}
              </p>
              <p className="mb-0 text-muted">
                {invoice.branch?.address}, {invoice.branch?.city}, {invoice.branch?.state}
              </p>
            </div>

            {invoice.encounterId && (
              <div className="mb-3">
                <p className="mb-0">
                  <strong>Encounter ID:</strong> {invoice.encounterId}
                </p>
              </div>
            )}

            <div className="mb-3">
              <h6 className="mb-2">Invoice Items</h6>
              <div className="table-responsive">
                <table className="table table-bordered table-sm">
                  <thead className="table-light">
                    <tr>
                      <th>Description</th>
                      <th>Qty</th>
                      <th>Unit Price</th>
                      <th>Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoice.items?.map((item, index) => (
                      <tr key={index}>
                        <td>{item.description}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td>{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="row mb-3">
              <div className="col-md-6 offset-md-6">
                <table className="table table-sm">
                  <tbody>
                    <tr>
                      <td className="text-end"><strong>Subtotal:</strong></td>
                      <td className="text-end">{formatCurrency(invoice.subtotal)}</td>
                    </tr>
                    <tr>
                      <td className="text-end"><strong>Tax:</strong></td>
                      <td className="text-end">{formatCurrency(invoice.tax)}</td>
                    </tr>
                    <tr>
                      <td className="text-end"><strong>Discount:</strong></td>
                      <td className="text-end">-{formatCurrency(invoice.discount)}</td>
                    </tr>
                    <tr className="table-light">
                      <td className="text-end"><strong>Grand Total:</strong></td>
                      <td className="text-end"><strong>{formatCurrency(invoice.grandTotal)}</strong></td>
                    </tr>
                    <tr>
                      <td className="text-end"><strong>Paid Amount:</strong></td>
                      <td className="text-end text-success">{formatCurrency(invoice.paidAmount)}</td>
                    </tr>
                    <tr className="table-warning">
                      <td className="text-end"><strong>Balance:</strong></td>
                      <td className="text-end"><strong>{formatCurrency(invoice.balance)}</strong></td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {invoice.paymentMethod && (
              <div className="mb-3">
                <p className="mb-0">
                  <strong>Payment Method:</strong> {invoice.paymentMethod}
                </p>
              </div>
            )}

            {invoice.insurance && (
              <div className="mb-3">
                <h6 className="mb-2">Insurance Claim Details</h6>
                <div className="card bg-light">
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-4">
                        <p className="mb-1">
                          <strong>Provider:</strong> {invoice.insurance.provider}
                        </p>
                      </div>
                      <div className="col-md-4">
                        <p className="mb-1">
                          <strong>Claim Number:</strong> {invoice.insurance.claimNumber}
                        </p>
                      </div>
                      <div className="col-md-4">
                        <p className="mb-1">
                          <strong>Claim Amount:</strong> {formatCurrency(invoice.insurance.claimAmount)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="border-top pt-3">
              <p className="text-muted mb-0 small">
                <strong>Created:</strong> {formatDate(invoice.createdAt)}
              </p>
              {invoice.updatedAt && (
                <p className="text-muted mb-0 small">
                  <strong>Last Updated:</strong> {formatDate(invoice.updatedAt)}
                </p>
              )}
            </div>
          </div>
          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={handlePrint}
            >
              <i className="ti ti-printer me-1" />
              Print
            </button>
            <button
              type="button"
              className="btn btn-primary"
              data-bs-dismiss="modal"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoiceViewModal;
