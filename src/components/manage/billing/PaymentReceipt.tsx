"use client";
import React, { forwardRef } from 'react';

interface PaymentReceiptProps {
  payment: {
    paymentNumber: string;
    amount: number;
    paymentMethod: string;
    paymentReference?: string;
    paymentDate: Date | string;
    receivedBy?: {
      firstName: string;
      lastName: string;
    };
  };
  patient: {
    patientId: string;
    firstName: string;
    lastName: string;
  };
  visit: {
    visitNumber: string;
    visitDate: Date | string;
  };
  invoice: {
    invoiceNumber: string;
    items: Array<{
      description: string;
      quantity: number;
      unitPrice: number;
      total: number;
    }>;
    subtotal: number;
    tax: number;
    discount?: number;
    grandTotal: number;
    paidAmount: number;
    balance: number;
    insuranceClaim?: {
      provider: string;
      claimAmount: number;
      status: string;
    };
  };
}

const PaymentReceipt = forwardRef<HTMLDivElement, PaymentReceiptProps>(
  ({ payment, patient, visit, invoice }, ref) => {
    const formatCurrency = (amount: number) => {
      return `₦${amount.toLocaleString('en-NG', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    };

    const formatDate = (date: Date | string) => {
      return new Date(date).toLocaleDateString('en-NG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    };

    const formatTime = (date: Date | string) => {
      return new Date(date).toLocaleTimeString('en-NG', {
        hour: '2-digit',
        minute: '2-digit',
      });
    };

    const isPaidInFull = invoice.balance === 0;

    return (
      <div ref={ref} style={{ padding: '40px', backgroundColor: '#fff', maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ borderBottom: '3px solid #0d6efd', paddingBottom: '20px', marginBottom: '30px' }}>
          <div style={{ textAlign: 'center' }}>
            <h1 style={{ fontSize: '28px', color: '#0d6efd', marginBottom: '5px', fontWeight: 'bold' }}>
              Life Point Medical Centre
            </h1>
            <p style={{ fontSize: '14px', color: '#6c757d', margin: '0' }}>
              Professional Healthcare Services
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px', textAlign: 'center' }}>
          <h2 style={{ fontSize: '24px', color: '#198754', marginBottom: '10px', fontWeight: 'bold' }}>
            PAYMENT RECEIPT
          </h2>
          <p style={{ fontSize: '16px', color: '#495057', margin: '0' }}>
            Receipt No: <strong>{payment.paymentNumber}</strong>
          </p>
          <p style={{ fontSize: '14px', color: '#6c757d', margin: '5px 0 0 0' }}>
            {formatDate(payment.paymentDate)} at {formatTime(payment.paymentDate)}
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
          <div>
            <h3 style={{ fontSize: '16px', color: '#495057', marginBottom: '15px', borderBottom: '2px solid #dee2e6', paddingBottom: '8px' }}>
              Patient Information
            </h3>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong>Name:</strong> {patient.firstName} {patient.lastName}
            </p>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong>Patient ID:</strong> {patient.patientId}
            </p>
          </div>

          <div>
            <h3 style={{ fontSize: '16px', color: '#495057', marginBottom: '15px', borderBottom: '2px solid #dee2e6', paddingBottom: '8px' }}>
              Visit Information
            </h3>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong>Visit Number:</strong> {visit.visitNumber}
            </p>
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong>Visit Date:</strong> {formatDate(visit.visitDate)}
            </p>
          </div>
        </div>

        <div style={{ marginBottom: '30px' }}>
          <h3 style={{ fontSize: '16px', color: '#495057', marginBottom: '15px', borderBottom: '2px solid #dee2e6', paddingBottom: '8px' }}>
            Invoice Summary - {invoice.invoiceNumber}
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Description</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>Qty</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>Unit Price</th>
                <th style={{ padding: '12px', textAlign: 'right', borderBottom: '2px solid #dee2e6' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {invoice.items.map((item, index) => (
                <tr key={index}>
                  <td style={{ padding: '10px', borderBottom: '1px solid #dee2e6' }}>{item.description}</td>
                  <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>{item.quantity}</td>
                  <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>{formatCurrency(item.unitPrice)}</td>
                  <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>{formatCurrency(item.total)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                  <strong>Subtotal:</strong>
                </td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                  {formatCurrency(invoice.subtotal)}
                </td>
              </tr>
              <tr>
                <td colSpan={3} style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                  <strong>Tax (7.5%):</strong>
                </td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6' }}>
                  {formatCurrency(invoice.tax)}
                </td>
              </tr>
              {invoice.discount && invoice.discount > 0 && (
                <tr>
                  <td colSpan={3} style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6', color: '#dc3545' }}>
                    <strong>Discount:</strong>
                  </td>
                  <td style={{ padding: '10px', textAlign: 'right', borderBottom: '1px solid #dee2e6', color: '#dc3545' }}>
                    -{formatCurrency(invoice.discount)}
                  </td>
                </tr>
              )}
              <tr>
                <td colSpan={3} style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #495057', fontSize: '16px' }}>
                  <strong>Grand Total:</strong>
                </td>
                <td style={{ padding: '10px', textAlign: 'right', borderBottom: '2px solid #495057', fontSize: '16px' }}>
                  <strong>{formatCurrency(invoice.grandTotal)}</strong>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {invoice.insuranceClaim && (
          <div style={{ backgroundColor: '#e7f3ff', padding: '15px', borderRadius: '8px', marginBottom: '30px', border: '1px solid #0d6efd' }}>
            <h4 style={{ fontSize: '14px', color: '#0d6efd', marginBottom: '10px', fontWeight: 'bold' }}>
              Insurance Claim Information
            </h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px', fontSize: '13px' }}>
              <div>
                <strong>Provider:</strong> {invoice.insuranceClaim.provider}
              </div>
              <div>
                <strong>Claim Amount:</strong> {formatCurrency(invoice.insuranceClaim.claimAmount)}
              </div>
              <div>
                <strong>Status:</strong> <span style={{ color: '#ffc107' }}>{invoice.insuranceClaim.status}</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', marginBottom: '30px' }}>
          <h3 style={{ fontSize: '16px', color: '#495057', marginBottom: '15px', borderBottom: '2px solid #dee2e6', paddingBottom: '8px' }}>
            Payment Details
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
            <div style={{ fontSize: '14px' }}>
              <strong>Payment Amount:</strong>
              <div style={{ fontSize: '20px', color: '#198754', fontWeight: 'bold', marginTop: '5px' }}>
                {formatCurrency(payment.amount)}
              </div>
            </div>
            <div style={{ fontSize: '14px' }}>
              <strong>Payment Method:</strong>
              <div style={{ fontSize: '16px', marginTop: '5px' }}>
                {payment.paymentMethod}
              </div>
            </div>
          </div>
          {payment.paymentReference && (
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong>Reference Number:</strong> {payment.paymentReference}
            </p>
          )}
          {payment.receivedBy && (
            <p style={{ margin: '8px 0', fontSize: '14px' }}>
              <strong>Received By:</strong> {payment.receivedBy.firstName} {payment.receivedBy.lastName}
            </p>
          )}
        </div>

        <div style={{ backgroundColor: isPaidInFull ? '#d1e7dd' : '#fff3cd', padding: '20px', borderRadius: '8px', border: `2px solid ${isPaidInFull ? '#198754' : '#ffc107'}`, marginBottom: '30px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: '14px', margin: '0 0 5px 0', color: '#495057' }}>
                <strong>Total Paid:</strong>
              </p>
              <p style={{ fontSize: '20px', margin: '0', color: '#198754', fontWeight: 'bold' }}>
                {formatCurrency(invoice.paidAmount)}
              </p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <p style={{ fontSize: '14px', margin: '0 0 5px 0', color: '#495057' }}>
                <strong>Outstanding Balance:</strong>
              </p>
              <p style={{ fontSize: '20px', margin: '0', color: isPaidInFull ? '#198754' : '#dc3545', fontWeight: 'bold' }}>
                {formatCurrency(invoice.balance)}
              </p>
            </div>
          </div>
          <div style={{ marginTop: '15px', paddingTop: '15px', borderTop: '1px solid #dee2e6', textAlign: 'center' }}>
            <p style={{ fontSize: '16px', margin: '0', fontWeight: 'bold', color: isPaidInFull ? '#198754' : '#856404' }}>
              {isPaidInFull ? '✓ PAID IN FULL' : '⚠ OUTSTANDING BALANCE'}
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: '#f8f9fa', padding: '20px', borderRadius: '8px', textAlign: 'center' }}>
          <p style={{ fontSize: '16px', color: '#198754', fontWeight: 'bold', marginBottom: '10px' }}>
            Thank you for your payment!
          </p>
          <p style={{ fontSize: '13px', color: '#6c757d', margin: '5px 0' }}>
            This is an official receipt for your payment. Please keep this for your records.
          </p>
          <p style={{ fontSize: '12px', color: '#6c757d', margin: '5px 0', fontStyle: 'italic' }}>
            For any inquiries regarding this payment, please contact our billing department with your receipt number.
          </p>
        </div>

        <div style={{ marginTop: '40px', paddingTop: '20px', borderTop: '2px solid #dee2e6', textAlign: 'center' }}>
          <p style={{ fontSize: '12px', color: '#6c757d', margin: '5px 0' }}>
            Life Point Medical Centre
          </p>
          <p style={{ fontSize: '12px', color: '#6c757d', margin: '5px 0' }}>
            Professional Healthcare Services
          </p>
          <p style={{ fontSize: '12px', color: '#6c757d', margin: '5px 0' }}>
            Generated on {formatDate(new Date())} at {formatTime(new Date())}
          </p>
        </div>
      </div>
    );
  }
);

PaymentReceipt.displayName = 'PaymentReceipt';

export default PaymentReceipt;
