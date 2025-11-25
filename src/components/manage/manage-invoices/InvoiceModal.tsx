"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/services/api-client";
import CommonSelect, { Option } from "@/core/common-components/common-select/commonSelect";

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

interface Invoice {
  _id?: string;
  patient: any;
  branch: any;
  encounterId?: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  grandTotal: number;
  paidAmount: number;
  balance: number;
  paymentMethod?: string;
  insurance?: {
    provider: string;
    claimNumber: string;
    claimAmount: number;
  };
}

interface InvoiceModalProps {
  type: "add" | "edit";
  invoice: Invoice | null;
  onClose: () => void;
  onSuccess: () => void;
}

const InvoiceModal = ({ type, invoice, onClose, onSuccess }: InvoiceModalProps) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Option[]>([]);
  const [branches, setBranches] = useState<Option[]>([]);
  const [formData, setFormData] = useState<{
    patient: string;
    branch: string;
    encounterId: string;
    items: InvoiceItem[];
    tax: number;
    discount: number;
    subtotal: number;
    grandTotal: number;
    paymentMethod: string;
    applyInsurance: boolean;
    insurance: {
      provider: string;
      claimNumber: string;
      claimAmount: number;
    };
  }>({
    patient: "",
    branch: "",
    encounterId: "",
    items: [
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ],
    tax: 0,
    discount: 0,
    subtotal: 0,
    grandTotal: 0,
    paymentMethod: "",
    applyInsurance: false,
    insurance: {
      provider: "",
      claimNumber: "",
      claimAmount: 0,
    },
  });

  useEffect(() => {
    fetchPatients();
    fetchBranches();

    if (invoice && type === "edit") {
      setFormData({
        patient: typeof invoice.patient === 'string' ? invoice.patient : invoice.patient?._id || "",
        branch: typeof invoice.branch === 'string' ? invoice.branch : invoice.branch?._id || "",
        encounterId: invoice.encounterId || "",
        items: invoice.items.length > 0 ? invoice.items : [{ description: "", quantity: 1, unitPrice: 0, total: 0 }],
        tax: invoice.tax || 0,
        discount: invoice.discount || 0,
        subtotal: invoice.subtotal || 0,
        grandTotal: invoice.grandTotal || 0,
        paymentMethod: invoice.paymentMethod || "",
        applyInsurance: !!invoice.insurance,
        insurance: {
          provider: invoice.insurance?.provider || "",
          claimNumber: invoice.insurance?.claimNumber || "",
          claimAmount: invoice.insurance?.claimAmount || 0,
        },
      });
    }
  }, [invoice, type]);

  useEffect(() => {
    if (type) {
      const modalElement = document.getElementById(type === "add" ? "add_invoice" : "edit_invoice");
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
  }, [type, onClose]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax, formData.discount]);

  const fetchPatients = async () => {
    try {
      const response = await apiClient.get<{ patients: any[] }>("/api/patients?limit=1000", {
        showErrorToast: false,
      });
      const options = response.patients?.map((patient) => ({
        value: patient._id,
        label: `${patient.firstName} ${patient.lastName} (${patient.patientId})`,
      })) || [];
      setPatients(options);
    } catch (error) {
      console.error("Failed to fetch patients:", error);
    }
  };

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get<{ branches: any[] }>("/api/branches?limit=100", {
        showErrorToast: false,
      });
      const options = response.branches?.map((branch) => ({
        value: branch._id,
        label: branch.name,
      })) || [];
      setBranches(options);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }
  };

  const calculateTotals = () => {
    const subtotal = formData.items.reduce((sum, item) => sum + item.total, 0);
    const grandTotal = subtotal + formData.tax - formData.discount;

    setFormData(prev => ({
      ...prev,
      subtotal,
      grandTotal: grandTotal > 0 ? grandTotal : 0,
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;

    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: type === 'number' ? parseFloat(value) || 0 : value,
        },
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) || 0 : value,
      }));
    }
  };

  const handleItemChange = (index: number, field: string, value: any) => {
    const updatedItems = [...formData.items];
    (updatedItems[index] as any)[field] = value;

    if (field === 'quantity' || field === 'unitPrice') {
      updatedItems[index].total = updatedItems[index].quantity * updatedItems[index].unitPrice;
    }

    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [
        ...prev.items,
        { description: "", quantity: 1, unitPrice: 0, total: 0 },
      ],
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const payload = {
        patient: formData.patient,
        branch: formData.branch,
        encounterId: formData.encounterId || undefined,
        items: formData.items,
        subtotal: formData.subtotal,
        tax: formData.tax,
        discount: formData.discount,
        grandTotal: formData.grandTotal,
        paymentMethod: formData.paymentMethod || undefined,
        insurance: formData.applyInsurance ? formData.insurance : undefined,
      };

      if (type === "add") {
        await apiClient.post("/api/billing/invoices", payload, {
          successMessage: "Invoice created successfully",
        });
      } else if (type === "edit" && invoice?._id) {
        await apiClient.put(`/api/billing/invoices/${invoice._id}`, payload, {
          successMessage: "Invoice updated successfully",
        });
      }

      onSuccess();
      closeModal();
    } catch (error) {
      console.error("Failed to save invoice:", error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    const modalElement = document.getElementById(type === "add" ? "add_invoice" : "edit_invoice");
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
      if (modal) {
        modal.hide();
      }
    }
  };

  const getSelectedPatient = () => {
    return patients.find(p => p.value === formData.patient) || null;
  };

  const getSelectedBranch = () => {
    return branches.find(b => b.value === formData.branch) || null;
  };

  return (
    <div
      className="modal fade"
      id={type === "add" ? "add_invoice" : "edit_invoice"}
      tabIndex={-1}
      aria-labelledby={`${type}_invoice_label`}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg modal-dialog-centered modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id={`${type}_invoice_label`}>
              {type === "add" ? "Add New Invoice" : "Edit Invoice"}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Patient <span className="text-danger">*</span>
                  </label>
                  <CommonSelect
                    options={patients}
                    value={getSelectedPatient()}
                    onChange={(option) => setFormData(prev => ({ ...prev, patient: option?.value || "" }))}
                    placeholder="Select Patient"
                    ariaLabel="Select Patient"
                  />
                </div>
                <div className="col-md-6 mb-3">
                  <label className="form-label">
                    Branch <span className="text-danger">*</span>
                  </label>
                  <CommonSelect
                    options={branches}
                    value={getSelectedBranch()}
                    onChange={(option) => setFormData(prev => ({ ...prev, branch: option?.value || "" }))}
                    placeholder="Select Branch"
                    ariaLabel="Select Branch"
                  />
                </div>
              </div>

              <div className="mb-3">
                <label className="form-label">Encounter ID (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  name="encounterId"
                  value={formData.encounterId}
                  onChange={handleInputChange}
                  placeholder="Enter encounter ID"
                />
              </div>

              <div className="mb-3">
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">
                    Invoice Items <span className="text-danger">*</span>
                  </label>
                  <button
                    type="button"
                    className="btn btn-sm btn-primary"
                    onClick={addItem}
                  >
                    <i className="ti ti-plus me-1" />
                    Add Item
                  </button>
                </div>
                <div className="table-responsive">
                  <table className="table table-bordered">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Qty</th>
                        <th>Unit Price</th>
                        <th>Total</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {formData.items.map((item, index) => (
                        <tr key={index}>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={item.description}
                              onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.quantity}
                              onChange={(e) => handleItemChange(index, 'quantity', parseFloat(e.target.value) || 0)}
                              min="1"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control form-control-sm"
                              value={item.unitPrice}
                              onChange={(e) => handleItemChange(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                              min="0"
                              step="0.01"
                              required
                            />
                          </td>
                          <td>
                            <input
                              type="text"
                              className="form-control form-control-sm"
                              value={`₦${item.total.toFixed(2)}`}
                              readOnly
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="btn btn-sm btn-danger"
                              onClick={() => removeItem(index)}
                              disabled={formData.items.length === 1}
                            >
                              <i className="ti ti-trash" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="row">
                <div className="col-md-4 mb-3">
                  <label className="form-label">Tax (₦)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="tax"
                    value={formData.tax}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Discount (₦)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="discount"
                    value={formData.discount}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>
                <div className="col-md-4 mb-3">
                  <label className="form-label">Payment Method (Optional)</label>
                  <input
                    type="text"
                    className="form-control"
                    name="paymentMethod"
                    value={formData.paymentMethod}
                    onChange={handleInputChange}
                    placeholder="e.g., Cash, Card, Insurance"
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-6">
                  <div className="card bg-light">
                    <div className="card-body py-2">
                      <p className="mb-0 text-muted">Subtotal</p>
                      <h5 className="mb-0">₦{formData.subtotal.toFixed(2)}</h5>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="card bg-primary text-white">
                    <div className="card-body py-2">
                      <p className="mb-0">Grand Total</p>
                      <h5 className="mb-0">₦{formData.grandTotal.toFixed(2)}</h5>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <div className="form-check">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="applyInsurance"
                    name="applyInsurance"
                    checked={formData.applyInsurance}
                    onChange={handleInputChange}
                  />
                  <label className="form-check-label" htmlFor="applyInsurance">
                    Apply Insurance
                  </label>
                </div>
              </div>

              {formData.applyInsurance && (
                <div className="card bg-light mb-3">
                  <div className="card-body">
                    <h6 className="mb-3">Insurance Details</h6>
                    <div className="row">
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Provider</label>
                        <input
                          type="text"
                          className="form-control"
                          name="insurance.provider"
                          value={formData.insurance.provider}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Claim Number</label>
                        <input
                          type="text"
                          className="form-control"
                          name="insurance.claimNumber"
                          value={formData.insurance.claimNumber}
                          onChange={handleInputChange}
                        />
                      </div>
                      <div className="col-md-4 mb-3">
                        <label className="form-label">Claim Amount (₦)</label>
                        <input
                          type="number"
                          className="form-control"
                          name="insurance.claimAmount"
                          value={formData.insurance.claimAmount}
                          onChange={handleInputChange}
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
                type="submit"
                className="btn btn-primary"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="ti ti-device-floppy me-1" />
                    {type === "add" ? "Create Invoice" : "Save Changes"}
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InvoiceModal;
