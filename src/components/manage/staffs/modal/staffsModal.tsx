"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/services/api-client";
import { Staff, Branch, UserRole } from "@/types/emr";

interface StaffsModalProps {
  type: "add" | "edit" | "view" | "delete";
  staff: Staff | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface BranchesResponse {
  branches: Branch[];
}

const StaffsModal = ({ type, staff, onClose, onSuccess }: StaffsModalProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [emailError, setEmailError] = useState<string>("");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    phoneNumber: "",
    role: UserRole.FRONT_DESK,
    branchId: "",
    specialization: "",
    licenseNumber: "",
    department: "",
    bio: "",
    profileImage: "",
    isActive: true,
  });

  useEffect(() => {
    fetchBranches();
    setEmailError("");
    
    if (staff && (type === "edit" || type === "view")) {
      setFormData({
        firstName: staff.firstName || "",
        lastName: staff.lastName || "",
        email: staff.email || "",
        password: "",
        phoneNumber: staff.phoneNumber || "",
        role: staff.role || UserRole.FRONT_DESK,
        branchId: typeof staff.branchId === 'string' ? staff.branchId : (staff.branchId as Branch)?._id || "",
        specialization: staff.profile?.specialization || "",
        licenseNumber: staff.profile?.licenseNumber || "",
        department: staff.profile?.department || "",
        bio: staff.profile?.bio || "",
        profileImage: staff.profile?.profileImage || "",
        isActive: staff.isActive !== undefined ? staff.isActive : true,
      });
    } else if (type === "add") {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        phoneNumber: "",
        role: UserRole.FRONT_DESK,
        branchId: "",
        specialization: "",
        licenseNumber: "",
        department: "",
        bio: "",
        profileImage: "",
        isActive: true,
      });
    }
  }, [staff, type]);

  useEffect(() => {
    if (type) {
      // Use setTimeout to ensure DOM is fully rendered
      const timeoutId = setTimeout(() => {
        const modalElement = document.getElementById(getModalId());
        if (modalElement) {
          const modal = new (window as any).bootstrap.Modal(modalElement);
          modal.show();

          const handleHidden = () => {
            onClose();
          };
          modalElement.addEventListener('hidden.bs.modal', handleHidden);

          // Cleanup function will be called when component unmounts
          modalElement.dataset.cleanupAttached = 'true';
        }
      }, 100);

      return () => {
        clearTimeout(timeoutId);
        const modalElement = document.getElementById(getModalId());
        if (modalElement && modalElement.dataset.cleanupAttached) {
          const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
          if (modal) {
            modal.dispose();
          }
          delete modalElement.dataset.cleanupAttached;
        }
      };
    }
  }, [type, onClose]);

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get<BranchesResponse>("/api/branches", {
        showErrorToast: false,
      });
      setBranches(response.branches || []);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }
  };

  const getModalId = () => {
    switch (type) {
      case "add": return "add_staff";
      case "edit": return "edit_staff";
      case "view": return "view_staff";
      case "delete": return "delete_staff";
      default: return "add_staff";
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (name === "email" && emailError) {
      setEmailError("");
    }
    
    if (type === "checkbox") {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setEmailError("");

    try {
      if (type === "add") {
        await apiClient.post("/api/staff", formData, {
          successMessage: "Staff member created successfully",
        });
      } else if (type === "edit" && staff?._id) {
        const updateData = { ...formData };
        if (!updateData.password) {
          delete (updateData as any).password;
        }
        
        await apiClient.put(`/api/staff/${staff._id}`, updateData, {
          successMessage: "Staff member updated successfully",
        });
      }
      
      onSuccess();
      closeModal();
    } catch (error: any) {
      console.error("Failed to save staff:", error);
      
      if (error.status === 409 && error.message?.toLowerCase().includes("email")) {
        setEmailError(error.message || "This email is already registered in the system");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!staff?._id) return;
    
    setLoading(true);
    try {
      await apiClient.delete(`/api/staff/${staff._id}`, {
        successMessage: "Staff member deleted successfully",
      });
      onSuccess();
      closeModal();
    } catch (error) {
      console.error("Failed to delete staff:", error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    const modalElement = document.getElementById(getModalId());
    if (modalElement) {
      const modal = (window as any).bootstrap.Modal.getInstance(modalElement);
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

  const getBranchName = (branchId: string | Branch | undefined) => {
    if (!branchId) return "N/A";
    if (typeof branchId === 'string') {
      const branch = branches.find(b => b._id === branchId);
      return branch?.name || branchId;
    }
    return branchId.name || "N/A";
  };

  const getRoleDisplay = (role: UserRole) => {
    const roleMap: Record<UserRole, string> = {
      [UserRole.ADMIN]: "Admin",
      [UserRole.MANAGER]: "Manager",
      [UserRole.FRONT_DESK]: "Front Desk",
      [UserRole.NURSE]: "Nurse",
      [UserRole.DOCTOR]: "Doctor",
      [UserRole.LAB]: "Lab Technician",
      [UserRole.PHARMACY]: "Pharmacy",
      [UserRole.BILLING]: "Billing",
      [UserRole.ACCOUNTING]: "Accounting",
    };
    return roleMap[role] || role;
  };

  if (type === "view" && staff) {
    return (
      <div className="modal fade" id="view_staff">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="text-dark modal-title fw-bold">Staff Details</h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              />
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-12 text-center mb-3">
                  <img
                    src={staff.profile?.profileImage || "/assets/img/avatars/avatar-01.jpg"}
                    alt={`${staff.firstName} ${staff.lastName}`}
                    className="avatar avatar-xxl rounded-circle"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">First Name</label>
                  <p className="form-control-plaintext">{staff.firstName}</p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Last Name</label>
                  <p className="form-control-plaintext">{staff.lastName}</p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Email</label>
                  <p className="form-control-plaintext">{staff.email}</p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Phone Number</label>
                  <p className="form-control-plaintext">{staff.phoneNumber || "N/A"}</p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Role</label>
                  <p className="form-control-plaintext">
                    <span className="badge bg-info-transparent">
                      {getRoleDisplay(staff.role)}
                    </span>
                  </p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Branch</label>
                  <p className="form-control-plaintext">{getBranchName(staff.branchId)}</p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Status</label>
                  <p className="form-control-plaintext">
                    <span className={`badge ${staff.isActive ? 'bg-success' : 'bg-danger'}`}>
                      {staff.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>
                </div>

                {staff.profile?.specialization && (
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Specialization</label>
                    <p className="form-control-plaintext">{staff.profile.specialization}</p>
                  </div>
                )}

                {staff.profile?.licenseNumber && (
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">License Number</label>
                    <p className="form-control-plaintext">{staff.profile.licenseNumber}</p>
                  </div>
                )}

                {staff.profile?.department && (
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Department</label>
                    <p className="form-control-plaintext">{staff.profile.department}</p>
                  </div>
                )}

                {staff.profile?.bio && (
                  <div className="col-12">
                    <label className="form-label fw-semibold">Bio</label>
                    <p className="form-control-plaintext">{staff.profile.bio}</p>
                  </div>
                )}

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Created At</label>
                  <p className="form-control-plaintext">{formatDate(staff.createdAt)}</p>
                </div>

                <div className="col-md-6">
                  <label className="form-label fw-semibold">Last Updated</label>
                  <p className="form-control-plaintext">{formatDate(staff.updatedAt)}</p>
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

  if (type === "delete" && staff) {
    return (
      <div className="modal fade" id="delete_staff">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="text-dark modal-title fw-bold">Delete Staff Member</h5>
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
                Are you sure you want to delete <strong>{staff.firstName} {staff.lastName}</strong>?
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
                    <span className="spinner-border spinner-border-sm me-2" />
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
    <div className="modal fade" id={getModalId()}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="text-dark modal-title fw-bold">
              {type === "add" ? "Add New Staff" : "Edit Staff Member"}
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
                    First Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Last Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Email <span className="text-danger">*</span>
                  </label>
                  <input
                    type="email"
                    className={`form-control ${emailError ? 'is-invalid' : ''}`}
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                  {emailError && (
                    <div className="invalid-feedback d-block">
                      <i className="ti ti-alert-circle me-1"></i>
                      {emailError}
                    </div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Password {type === "add" && <span className="text-danger">*</span>}
                    {type === "edit" && <span className="text-muted">(leave blank to keep current)</span>}
                  </label>
                  <input
                    type="password"
                    className="form-control"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    required={type === "add"}
                    disabled={loading}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Phone Number <span className="text-danger">*</span>
                  </label>
                  <input
                    type="tel"
                    className="form-control"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Role <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value={UserRole.ADMIN}>Admin</option>
                    <option value={UserRole.MANAGER}>Manager</option>
                    <option value={UserRole.FRONT_DESK}>Front Desk</option>
                    <option value={UserRole.NURSE}>Nurse</option>
                    <option value={UserRole.DOCTOR}>Doctor</option>
                    <option value={UserRole.LAB}>Lab Technician</option>
                    <option value={UserRole.PHARMACY}>Pharmacy</option>
                    <option value={UserRole.BILLING}>Billing</option>
                    <option value={UserRole.ACCOUNTING}>Accounting</option>
                  </select>
                </div>

                <div className="col-md-6">
                  <label className="form-label">
                    Branch <span className="text-danger">*</span>
                  </label>
                  <select
                    className="form-select"
                    name="branchId"
                    value={formData.branchId}
                    onChange={handleInputChange}
                    required
                    disabled={loading}
                  >
                    <option value="">Select Branch</option>
                    {branches.map((branch) => (
                      <option key={branch._id} value={branch._id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>

                {type === "edit" && (
                  <div className="col-md-6">
                    <label className="form-label">Status</label>
                    <div className="form-check form-switch">
                      <input
                        className="form-check-input"
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        disabled={loading}
                      />
                      <label className="form-check-label">
                        {formData.isActive ? 'Active' : 'Inactive'}
                      </label>
                    </div>
                  </div>
                )}

                <div className="col-12">
                  <h6 className="mb-3 mt-2">Optional Profile Information</h6>
                </div>

                <div className="col-md-6">
                  <label className="form-label">Specialization</label>
                  <input
                    type="text"
                    className="form-control"
                    name="specialization"
                    value={formData.specialization}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="e.g., Cardiology, Pediatrics"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">License Number</label>
                  <input
                    type="text"
                    className="form-control"
                    name="licenseNumber"
                    value={formData.licenseNumber}
                    onChange={handleInputChange}
                    disabled={loading}
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Department</label>
                  <input
                    type="text"
                    className="form-control"
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="e.g., Emergency, ICU"
                  />
                </div>

                <div className="col-md-6">
                  <label className="form-label">Profile Image URL</label>
                  <input
                    type="text"
                    className="form-control"
                    name="profileImage"
                    value={formData.profileImage}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="https://..."
                  />
                </div>

                <div className="col-12">
                  <label className="form-label">Bio</label>
                  <textarea
                    className="form-control"
                    name="bio"
                    rows={3}
                    value={formData.bio}
                    onChange={handleInputChange}
                    disabled={loading}
                    placeholder="Brief description about the staff member..."
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
                    <span className="spinner-border spinner-border-sm me-2" />
                    {type === "add" ? "Creating..." : "Updating..."}
                  </>
                ) : (
                  type === "add" ? "Create Staff" : "Update Staff"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default StaffsModal;
