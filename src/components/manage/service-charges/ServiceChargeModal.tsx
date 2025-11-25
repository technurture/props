"use client";
import { useState, useEffect, useRef } from "react";
import { apiClient } from "@/lib/services/api-client";
import { ServiceCharge } from "@/types/emr";

interface ServiceChargeModalProps {
  type: "add" | "edit" | "view" | "delete";
  serviceCharge: ServiceCharge | null;
  onClose: () => void;
  onSuccess: () => void;
}

const ServiceChargeModal = ({ type, serviceCharge, onClose, onSuccess }: ServiceChargeModalProps) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    serviceName: "",
    category: "consultation" as ServiceCharge['category'],
    price: 0,
    billingType: "flat_rate" as ServiceCharge['billingType'],
    description: "",
    isActive: true,
  });

  useEffect(() => {
    if (serviceCharge && (type === "edit" || type === "view")) {
      setFormData({
        serviceName: serviceCharge.serviceName || "",
        category: serviceCharge.category || "consultation",
        price: serviceCharge.price || 0,
        billingType: serviceCharge.billingType || "flat_rate",
        description: serviceCharge.description || "",
        isActive: serviceCharge.isActive !== undefined ? serviceCharge.isActive : true,
      });
    }
  }, [serviceCharge, type]);

  useEffect(() => {
    if (!type) return;

    let modalInstance: any = null;
    let timeoutId: NodeJS.Timeout;

    const initModal = () => {
      if (!modalRef.current) return;

      if (typeof window === 'undefined' || !(window as any).bootstrap) {
        return;
      }

      try {
        modalInstance = new (window as any).bootstrap.Modal(modalRef.current);
        modalInstance.show();

        const handleHidden = () => {
          onClose();
        };
        
        modalRef.current.addEventListener('hidden.bs.modal', handleHidden);

        return () => {
          if (modalRef.current) {
            modalRef.current.removeEventListener('hidden.bs.modal', handleHidden);
          }
          if (modalInstance) {
            try {
              modalInstance.dispose();
            } catch (e) {
              console.warn('Error disposing modal:', e);
            }
          }
        };
      } catch (error) {
        console.error('Error initializing modal:', error);
      }
    };

    // Add a small delay to ensure DOM is fully rendered
    timeoutId = setTimeout(() => {
      const cleanup = initModal();
      if (cleanup) {
        // Store cleanup for later use
        return cleanup;
      }
    }, 50);

    return () => {
      clearTimeout(timeoutId);
      if (modalRef.current) {
        const modal = (window as any).bootstrap?.Modal?.getInstance(modalRef.current);
        if (modal) {
          try {
            modal.dispose();
          } catch (e) {
            console.warn('Error disposing modal on cleanup:', e);
          }
        }
      }
    };
  }, [type, onClose]);

  const getModalId = () => {
    switch (type) {
      case "add": return "add_service_charge";
      case "edit": return "edit_service_charge";
      case "view": return "view_service_charge";
      case "delete": return "delete_service_charge";
      default: return "add_service_charge";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === "price") {
      setFormData(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (!formData.serviceName.trim()) {
        throw new Error("Service name is required");
      }

      if (formData.price <= 0) {
        throw new Error("Price must be greater than 0");
      }

      if (type === "add") {
        await apiClient.post("/api/service-charges", formData, {
          successMessage: "Service charge created successfully",
        });
      } else if (type === "edit" && serviceCharge?._id) {
        await apiClient.put(`/api/service-charges/${serviceCharge._id}`, formData, {
          successMessage: "Service charge updated successfully",
        });
      }
      
      onSuccess();
      closeModal();
    } catch (error) {
      console.error("Failed to save service charge:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!serviceCharge?._id) return;
    
    setLoading(true);
    try {
      await apiClient.delete(`/api/service-charges/${serviceCharge._id}`, {
        successMessage: "Service charge deleted successfully",
      });
      onSuccess();
      closeModal();
    } catch (error) {
      console.error("Failed to delete service charge:", error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    if (modalRef.current) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalRef.current);
      if (modal) {
        modal.hide();
      }
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const getCategoryDisplay = (category: string) => {
    const categoryMap: Record<string, string> = {
      consultation: "Consultation",
      laboratory: "Laboratory",
      pharmacy: "Pharmacy",
      procedure: "Procedure",
      imaging: "Imaging",
      emergency: "Emergency",
      admission: "Admission",
      other: "Other",
    };
    return categoryMap[category] || category;
  };

  if (type === "view" && serviceCharge) {
    return (
      <div className="modal fade" id="view_service_charge" ref={modalRef}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="text-dark modal-title fw-bold">Service Charge Details</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Service Name</label>
                  <p className="form-control-plaintext">{serviceCharge.serviceName}</p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Category</label>
                  <p className="form-control-plaintext">
                    <span className="badge bg-info-transparent">
                      {getCategoryDisplay(serviceCharge.category)}
                    </span>
                  </p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Price</label>
                  <p className="form-control-plaintext fw-bold text-dark">
                    {formatCurrency(serviceCharge.price)}
                  </p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Billing Type</label>
                  <p className="form-control-plaintext">
                    <span className="badge bg-secondary-transparent">
                      {serviceCharge.billingType === 'per_hour' ? 'Per Hour' : 
                       serviceCharge.billingType === 'per_day' ? 'Per Day' : 'Flat Rate'}
                    </span>
                  </p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Status</label>
                  <p className="form-control-plaintext">
                    <span className={`badge ${serviceCharge.isActive ? 'bg-success' : 'bg-danger'}`}>
                      {serviceCharge.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>

                {serviceCharge.description && (
                  <div className="col-12">
                    <label className="form-label fw-semibold">Description</label>
                    <p className="form-control-plaintext">{serviceCharge.description}</p>
                  </div>
                )}

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Created At</label>
                  <p className="form-control-plaintext">{formatDate(serviceCharge.createdAt)}</p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Last Updated</label>
                  <p className="form-control-plaintext">{formatDate(serviceCharge.updatedAt)}</p>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "delete" && serviceCharge) {
    return (
      <div className="modal fade" id="delete_service_charge" ref={modalRef}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="text-dark modal-title fw-bold">Delete Service Charge</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <div className="text-center mb-3">
                <i className="ti ti-alert-circle text-danger" style={{ fontSize: '4rem' }} />
              </div>
              <p className="text-center mb-0">
                Are you sure you want to delete <strong>{serviceCharge.serviceName}</strong>?
                <br />
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    Deleting...
                  </>
                ) : (
                  'Delete'
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="modal fade" id={getModalId()} ref={modalRef}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="text-dark modal-title fw-bold">
              {type === "add" ? "Add New Service Charge" : "Edit Service Charge"}
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
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">
                    Service Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="serviceName"
                    value={formData.serviceName}
                    onChange={handleInputChange}
                    placeholder="Enter service name"
                    required
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Category <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="consultation">Consultation</option>
                    <option value="laboratory">Laboratory</option>
                    <option value="pharmacy">Pharmacy</option>
                    <option value="procedure">Procedure</option>
                    <option value="imaging">Imaging</option>
                    <option value="emergency">Emergency</option>
                    <option value="admission">Admission</option>
                    <option value="other">Other</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Billing Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="billingType"
                    value={formData.billingType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="flat_rate">Flat Rate</option>
                    <option value="per_day">Per Day (for admitted patients)</option>
                    <option value="per_hour">Per Hour (for admitted patients)</option>
                  </select>
                  <small className="text-muted">
                    Select billing type. Per day/hour applies to admission charges.
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Price (₦) <span className="text-danger">*</span>
                  </label>
                  <input
                    type="number"
                    className="form-control"
                    name="price"
                    value={formData.price}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    min="0"
                    step="0.01"
                    required
                  />
                  <small className="text-muted">
                    {formData.billingType === 'per_hour' ? 'Price per hour' : 
                     formData.billingType === 'per_day' ? 'Price per day' : 'One-time price'}
                  </small>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Status</label>
                  <div className="form-check form-switch mt-2">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      name="isActive"
                      id="isActive"
                      checked={formData.isActive}
                      onChange={handleInputChange}
                    />
                    <label className="form-check-label" htmlFor="isActive">
                      {formData.isActive ? 'Active' : 'Inactive'}
                    </label>
                  </div>
                </div>

                <div className="col-12">
                  <label className="form-label">Description</label>
                  <textarea
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="Enter service description (optional)"
                    rows={4}
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-secondary"
                data-bs-dismiss="modal"
                disabled={loading}
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
                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                    {type === "add" ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  type === "add" ? "Create Service Charge" : "Update Service Charge"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ServiceChargeModal;
