"use client";
import { useEffect, useRef } from "react";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";

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
    address?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
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
    phoneNumber?: string;
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

interface BillingViewModalProps {
  record: BillingRecord | null;
  onClose: () => void;
}

const BillingViewModal = ({ record, onClose }: BillingViewModalProps) => {
  const modalRef = useRef<any>(null);
  const handlerRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    if (!record) return;

    const timer = setTimeout(() => {
      const modalElement = document.getElementById("view_billing");
      if (modalElement) {
        try {
          modalRef.current = new (window as any).bootstrap.Modal(modalElement);
          modalRef.current.show();

          handlerRef.current = () => {
            onClose();
          };
          modalElement.addEventListener('hidden.bs.modal', handlerRef.current);
        } catch (error) {
          console.error('Error initializing modal:', error);
        }
      }
    }, 10);

    return () => {
      clearTimeout(timer);
      const modalElement = document.getElementById("view_billing");
      if (modalElement) {
        if (handlerRef.current) {
          try {
            modalElement.removeEventListener('hidden.bs.modal', handlerRef.current);
          } catch (e) {
            console.log('Error removing event listener');
          }
          handlerRef.current = null;
        }
      }
      if (modalRef.current) {
        try {
          modalRef.current.dispose();
        } catch (e) {
          console.log('Modal already disposed');
        }
        modalRef.current = null;
      }
    };
  }, [record, onClose]);

  if (!record) return null;

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
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'paid':
        return 'bg-success';
      case 'pending':
        return 'bg-warning';
      case 'partially_paid':
        return 'bg-info';
      case 'cancelled':
        return 'bg-danger';
      default:
        return 'bg-secondary';
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

  const handlePrint = () => {
    window.print();
  };

  const patient = record.patient;
  const branch = record.branch;

  return (
    <div
      className="modal fade"
      id="view_billing"
      tabIndex={-1}
      aria-labelledby="view_billing_label"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-xl modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="view_billing_label">
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
            <div className="invoice-print-content">
              <div className="bg-light invoice-details rounded p-3 mb-3">
                <div className="d-flex align-items-center justify-content-between mb-4">
                  <div className="">
                    <ImageWithBasePath
                      src="assets/img/lifepoint-logo-dark.svg"
                      className="invoice-logo"
                      alt="NuncCare"
                    />
                    <ImageWithBasePath
                      src="assets/img/lifepoint-logo.svg"
                      className="invoice-logo-white"
                      alt="NuncCare"
                    />
                  </div>
                  <div className="text-end">
                    <span className={`badge ${getStatusBadge(record.status)} mb-1`}>
                      {getStatusLabel(record.status)}
                    </span>
                    <h6 className="mb-0">#{record.invoiceNumber}</h6>
                  </div>
                </div>
                <div className="row align-items-center gy-4">
                  <div className="col-lg-6">
                    <div>
                      <h6 className="mb-2 fs-16 fw-bold">Invoice From</h6>
                      <h6 className="fs-14 mb-2">{branch?.name || 'NuncCare'}</h6>
                      <p className="mb-1">
                        {branch?.address || '15 Hodges Mews, High Wycombe HP12 3JL'}
                        {branch?.city && branch?.state && <><br />{branch.city}, {branch.state}</>}
                      </p>
                      {branch?.phoneNumber && <p className="mb-0">Phone: {branch.phoneNumber}</p>}
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div>
                      <h6 className="mb-2 fs-16 fw-bold">Bill To</h6>
                      <h6 className="fs-14 mb-2">
                        {patient?.firstName} {patient?.lastName}
                      </h6>
                      <p className="mb-1">
                        {patient?.address || 'No address provided'}
                        {patient?.city && patient?.state && (
                          <>
                            <br />
                            {patient.city}, {patient.state}
                            {patient?.zipCode && ` ${patient.zipCode}`}
                          </>
                        )}
                        {patient?.country && <><br />{patient.country}</>}
                      </p>
                      <p className="mb-0">Phone: {patient?.phoneNumber}</p>
                      {patient?.email && <p className="mb-0">Email: {patient.email}</p>}
                    </div>
                  </div>
                </div>
              </div>
              <h6 className="mb-3">Items Details</h6>
              <div className="table-responsive table-nowrap mb-4">
                <table className="table border">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Item Details</th>
                      <th>Quantity</th>
                      <th>Rate</th>
                      <th>Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {record.items?.map((item, index) => (
                      <tr key={index}>
                        <td>{index + 1}</td>
                        <td>{item.description}</td>
                        <td>{item.quantity}</td>
                        <td>{formatCurrency(item.unitPrice)}</td>
                        <td>{formatCurrency(item.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="row align-items-center">
                <div className="col-xl-7">
                  <div className="mb-3">
                    <h6 className="mb-2">Terms and Conditions</h6>
                    <p className="mb-1">
                      1. Payment is due within 7 days from the date of this invoice.
                    </p>
                    <p className="mb-1">
                      2. All services are provided as per the agreed treatment plan.
                    </p>
                    <div className="bg-soft-info text-info rounded mt-3 p-3">
                      <p className="mb-0">
                        <span className="fw-semibold">Note:</span> Payment
                        for all accounts is due within 7 days from the date
                        of invoice receipt. Payments can be made via cash,
                        card, or bank transfer. For any billing inquiries,
                        please contact our billing department.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="col-xl-5">
                  <div className="mb-3">
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fs-14 mb-0 fw-semibold">Subtotal</h6>
                      <h6 className="fs-14 mb-0 fw-semibold">{formatCurrency(record.subtotal)}</h6>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fs-14 mb-0 fw-semibold">Tax</h6>
                      <h6 className="fs-14 mb-0 fw-semibold">{formatCurrency(record.tax)}</h6>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fs-14 mb-0 fw-semibold">Discount</h6>
                      <h6 className="fs-14 mb-0 fw-semibold">-{formatCurrency(record.discount)}</h6>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-3 pb-3 border-bottom border-dark">
                      <h6 className="fs-14 mb-0 fw-semibold">Total Amount</h6>
                      <h6 className="fs-14 mb-0 fw-semibold">{formatCurrency(record.totalAmount)}</h6>
                    </div>
                    <div className="d-flex align-items-center justify-content-between mb-3">
                      <h6 className="fs-14 mb-0 fw-semibold">Amount Paid</h6>
                      <h6 className="fs-14 mb-0 fw-semibold text-success">{formatCurrency(record.amountPaid)}</h6>
                    </div>
                    <div className="d-flex align-items-center justify-content-between">
                      <h5 className="mb-0">Balance Due</h5>
                      <h5 className="text-danger mb-0">{formatCurrency(record.balance)}</h5>
                    </div>
                  </div>
                </div>
              </div>
              {record.notes && (
                <div className="mb-3">
                  <h6 className="mb-2">Additional Notes</h6>
                  <p className="text-muted mb-0">{record.notes}</p>
                </div>
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
              Print Invoice
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

export default BillingViewModal;
