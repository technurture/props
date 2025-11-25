"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/services/api-client";
import CommonSelect, { Option } from "@/core/common-components/common-select/commonSelect";

interface BillingItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: 'consultation' | 'procedure' | 'medication' | 'lab_test' | 'other';
}

interface BillingRecord {
  _id?: string;
  patient: any;
  branch: any;
  items: BillingItem[];
  subtotal: number;
  tax: number;
  discount: number;
  totalAmount: number;
  amountPaid: number;
  balance: number;
  insurance?: {
    provider: string;
    policyNumber: string;
    claimAmount: number;
    claimStatus: 'pending' | 'approved' | 'rejected';
    approvalNumber?: string;
  };
  notes?: string;
}

interface BillingModalProps {
  type: "add" | "edit";
  record: BillingRecord | null;
  onClose: () => void;
  onSuccess: () => void;
}

const BillingModal = ({ type, record, onClose, onSuccess }: BillingModalProps) => {
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<Option[]>([]);
  const [branches, setBranches] = useState<Option[]>([]);
  const [formData, setFormData] = useState<{
    patient: string;
    branch: string;
    items: BillingItem[];
    tax: number;
    discount: number;
    subtotal: number;
    totalAmount: number;
    amountPaid: number;
    balance: number;
    applyInsurance: boolean;
    insurance: {
      provider: string;
      policyNumber: string;
      claimAmount: number;
      approvalNumber: string;
    };
    notes: string;
  }>({
    patient: "",
    branch: "",
    items: [
      {
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
        category: "consultation",
      },
    ],
    tax: 0,
    discount: 0,
    subtotal: 0,
    totalAmount: 0,
    amountPaid: 0,
    balance: 0,
    applyInsurance: false,
    insurance: {
      provider: "",
      policyNumber: "",
      claimAmount: 0,
      approvalNumber: "",
    },
    notes: "",
  });

  useEffect(() => {
    fetchPatients();
    fetchBranches();

    if (record && type === "edit") {
      setFormData({
        patient: typeof record.patient === 'string' ? record.patient : record.patient?._id || "",
        branch: typeof record.branch === 'string' ? record.branch : record.branch?._id || "",
        items: record.items.length > 0 ? record.items : [{ description: "", quantity: 1, unitPrice: 0, total: 0, category: "consultation" }],
        tax: record.tax || 0,
        discount: record.discount || 0,
        subtotal: record.subtotal || 0,
        totalAmount: record.totalAmount || 0,
        amountPaid: record.amountPaid || 0,
        balance: record.balance || 0,
        applyInsurance: !!record.insurance,
        insurance: {
          provider: record.insurance?.provider || "",
          policyNumber: record.insurance?.policyNumber || "",
          claimAmount: record.insurance?.claimAmount || 0,
          approvalNumber: record.insurance?.approvalNumber || "",
        },
        notes: record.notes || "",
      });
    }
  }, [record, type]);

  useEffect(() => {
    if (type) {
      const timer = setTimeout(() => {
        const modalElement = document.getElementById(type === "add" ? "add_billing" : "edit_billing");
        if (modalElement) {
          const modal = new (window as any).bootstrap.Modal(modalElement);
          modal.show();

          const handleHidden = () => {
            onClose();
          };
          modalElement.addEventListener('hidden.bs.modal', handleHidden);

          const cleanup = () => {
            modalElement.removeEventListener('hidden.bs.modal', handleHidden);
            try {
              modal.dispose();
            } catch (e) {
              console.error('Error disposing modal:', e);
            }
          };

          return cleanup;
        }
      }, 50);

      return () => clearTimeout(timer);
    }
  }, [type, onClose]);

  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.tax, formData.discount, formData.amountPaid]);

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
    const totalAmount = subtotal + formData.tax - formData.discount;
    const balance = totalAmount - formData.amountPaid;

    setFormData(prev => ({
      ...prev,
      subtotal,
      totalAmount,
      balance: balance > 0 ? balance : 0,
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
        { description: "", quantity: 1, unitPrice: 0, total: 0, category: "consultation" as const },
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
        items: formData.items,
        subtotal: formData.subtotal,
        tax: formData.tax,
        discount: formData.discount,
        totalAmount: formData.totalAmount,
        amountPaid: formData.amountPaid,
        applyInsurance: formData.applyInsurance,
        insurance: formData.applyInsurance ? formData.insurance : undefined,
        notes: formData.notes,
      };

      if (type === "add") {
        await apiClient.post("/api/billing/records", payload, {
          successMessage: "Billing record created successfully",
        });
      } else if (type === "edit" && record?._id) {
        await apiClient.put(`/api/billing/records/${record._id}`, payload, {
          successMessage: "Billing record updated successfully",
        });
      }

      onSuccess();
      closeModal();
    } catch (error) {
      console.error("Failed to save billing record:", error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    const modalElement = document.getElementById(type === "add" ? "add_billing" : "edit_billing");
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
      id={type === "add" ? "add_billing" : "edit_billing"}
      tabIndex={-1}
      aria-labelledby={`${type}_billing_label`}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg modal-dialog-scrollable">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id={`${type}_billing_label`}>
              {type === "add" ? "Add New Billing Record" : "Edit Billing Record"}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            />
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body" style={{ maxHeight: '70vh', overflowY: 'auto' }}>
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
                <div className="d-flex justify-content-between align-items-center mb-2">
                  <label className="form-label mb-0">
                    Billing Items <span className="text-danger">*</span>
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
                        <th>Category</th>
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
                            <select
                              className="form-select form-select-sm"
                              value={item.category}
                              onChange={(e) => handleItemChange(index, 'category', e.target.value)}
                            >
                              <option value="consultation">Consultation</option>
                              <option value="procedure">Procedure</option>
                              <option value="medication">Medication</option>
                              <option value="lab_test">Lab Test</option>
                              <option value="other">Other</option>
                            </select>
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
                              value={`$${item.total.toFixed(2)}`}
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
                  <label className="form-label">Tax ($)</label>
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
                  <label className="form-label">Discount ($)</label>
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
                  <label className="form-label">Amount Paid ($)</label>
                  <input
                    type="number"
                    className="form-control"
                    name="amountPaid"
                    value={formData.amountPaid}
                    onChange={handleInputChange}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="row mb-3">
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body py-2">
                      <p className="mb-0 text-muted">Subtotal</p>
                      <h5 className="mb-0">${formData.subtotal.toFixed(2)}</h5>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body py-2">
                      <p className="mb-0 text-muted">Total Amount</p>
                      <h5 className="mb-0">${formData.totalAmount.toFixed(2)}</h5>
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="card bg-light">
                    <div className="card-body py-2">
                      <p className="mb-0 text-muted">Balance</p>
                      <h5 className="mb-0">${formData.balance.toFixed(2)}</h5>
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
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Insurance Provider</label>
                    <input
                      type="text"
                      className="form-control"
                      name="insurance.provider"
                      value={formData.insurance.provider}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Policy Number</label>
                    <input
                      type="text"
                      className="form-control"
                      name="insurance.policyNumber"
                      value={formData.insurance.policyNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Claim Amount ($)</label>
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
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Approval Number</label>
                    <input
                      type="text"
                      className="form-control"
                      name="insurance.approvalNumber"
                      value={formData.insurance.approvalNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              )}

              <div className="mb-3">
                <label className="form-label">Notes</label>
                <textarea
                  className="form-control"
                  name="notes"
                  value={formData.notes}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
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
                    {type === "add" ? "Create Record" : "Save Changes"}
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

export default BillingModal;
