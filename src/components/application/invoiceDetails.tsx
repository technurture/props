"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import { all_routes } from "@/router/all_routes";
import Link from "next/link";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Patient {
  patientId: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
}

interface Branch {
  name: string;
  address: string;
  city: string;
  state: string;
  phoneNumber?: string;
  email?: string;
}

interface InvoiceData {
  _id: string;
  invoiceNumber: string;
  patientId: Patient;
  branchId: Branch;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  balance: number;
  status: string;
  createdAt: string;
}

const InvoiceDetailsComponent = () => {
  const searchParams = useSearchParams();
  const invoiceId = searchParams.get('id');
  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoiceId) {
      fetchInvoiceData(invoiceId);
    } else {
      setLoading(false);
      setError('No invoice ID provided');
    }
  }, [invoiceId]);

  const fetchInvoiceData = async (id: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/billing/invoices/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch invoice');
      }
      
      const data = await response.json();
      setInvoice(data.invoice);
    } catch (err) {
      console.error('Error fetching invoice:', err);
      setError('Failed to load invoice data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN'
    }).format(amount);
  };

  const getStatusBadge = (status: string) => {
    const statusLower = status.toLowerCase();
    if (statusLower === 'paid') return 'bg-success';
    if (statusLower === 'pending') return 'bg-warning';
    if (statusLower === 'partially_paid') return 'bg-info';
    return 'bg-secondary';
  };

  const getStatusLabel = (status: string) => {
    return status.replace('_', ' ').toUpperCase();
  };

  const handlePrint = () => {
    window.print();
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="row justify-content-center">
            <div className="col-lg-10 text-center">
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3">Loading invoice...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              <div className="alert alert-danger" role="alert">
                {error || 'Invoice not found'}
              </div>
              <Link href={all_routes.invoice} className="btn btn-primary">
                <i className="ti ti-arrow-left me-2" />
                Back to Invoices
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const patient = invoice.patientId;
  const branch = invoice.branchId;

  return (
    <>
      {/* ========================
              Start Page Content
          ========================= */}
      <div className="page-wrapper">
        {/* Start Content */}
        <div className="content">
          <div className="row justify-content-center">
            <div className="col-lg-10">
              {/* Page Header */}
              <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
                <h6 className="mb-0">
                  <Link href={all_routes.invoice}>
                    <i className="ti ti-arrow-left me-2" />
                    Invoice
                  </Link>
                </h6>
                <div className="d-flex align-items-center ">
                  <button className="btn btn-white me-2" type="button" onClick={handlePrint}>
                    <i className="ti ti-file-download me-1" />
                    Download PDF
                  </button>
                  <button className="btn btn-white" type="button" onClick={handlePrint}>
                    <i className="ti ti-printer me-1" />
                    Print
                  </button>
                </div>
              </div>
              {/* End Page Header */}
              <div className="card mb-0">
                <div className="card-body">
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
                        <span className={`badge ${getStatusBadge(invoice.status)} mb-1`}>
                          {getStatusLabel(invoice.status)}
                        </span>
                        <h6 className="mb-0">#{invoice.invoiceNumber}</h6>
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
                        {invoice.items?.map((item, index) => (
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
                          1. Goods once sold cannot be taken back or exchanged.
                        </p>
                        <p className="mb-1">
                          2. We are not the manufacturers the company provides warranty
                        </p>
                        <div className="bg-soft-info text-info rounded mt-3 p-3">
                          <p className="mb-0">
                            <span className="fw-semibold">Note:</span> Payment
                            for all accounts is due within 7 days from the date
                            of invoice receipt. Payments can be made via cheque,
                            credit card, or direct online payment. Failure to
                            settle the account within 7 days will result in the
                            agreed quoted fee.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="col-xl-5">
                      <div className="mb-3">
                        <div className="d-flex align-items-center justify-content-between mb-3">
                          <h6 className="fs-14 mb-0 fw-semibold">Subtotal</h6>
                          <h6 className="fs-14 mb-0 fw-semibold">{formatCurrency(invoice.subtotal)}</h6>
                        </div>
                        {invoice.tax > 0 && (
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="fs-14 mb-0 fw-semibold">Tax</h6>
                            <h6 className="fs-14 mb-0 fw-semibold">{formatCurrency(invoice.tax)}</h6>
                          </div>
                        )}
                        {invoice.discount > 0 && (
                          <div className="d-flex align-items-center justify-content-between mb-3">
                            <h6 className="fs-14 mb-0 fw-semibold">Discount</h6>
                            <h6 className="fs-14 mb-0 fw-semibold text-danger">
                              - {formatCurrency(invoice.discount)}
                            </h6>
                          </div>
                        )}
                        <div className="d-flex align-items-center justify-content-between border-top pt-3 mb-3">
                          <h6 className="mb-0">Total (NGN)</h6>
                          <h6 className="mb-0">{formatCurrency(invoice.grandTotal)}</h6>
                        </div>
                        {invoice.paidAmount > 0 && (
                          <>
                            <div className="d-flex align-items-center justify-content-between mb-3">
                              <h6 className="fs-14 mb-0 fw-semibold text-success">Paid Amount</h6>
                              <h6 className="fs-14 mb-0 fw-semibold text-success">
                                {formatCurrency(invoice.paidAmount)}
                              </h6>
                            </div>
                            <div className="d-flex align-items-center justify-content-between">
                              <h6 className="fs-14 mb-0 fw-semibold text-danger">Balance Due</h6>
                              <h6 className="fs-14 mb-0 fw-semibold text-danger">
                                {formatCurrency(invoice.balance)}
                              </h6>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-end border-top pt-3">
                    <div className="mb-1 signature">
                      <ImageWithBasePath
                        src="assets/img/icons/signature.svg"
                        alt="sign"
                      />
                    </div>
                    <p className="mb-0 fw-semibold">Authorized Signature</p>
                    <p className="mb-0 text-muted fs-13">{branch?.name || 'NuncCare'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>
    </>
  );
};

export default InvoiceDetailsComponent;
