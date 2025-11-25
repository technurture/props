"use client";

import { useState, useEffect } from "react";
import { documentService, CreateDocumentData } from "@/lib/services/documentService";
import { toast } from "react-toastify";
import { useSession } from "next-auth/react";

interface DocumentModalProps {
  patientId: string | null;
  onDocumentUploaded: () => void;
  onClose: () => void;
}

const DocumentModal = ({
  patientId,
  onDocumentUploaded,
  onClose,
}: DocumentModalProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [visits, setVisits] = useState<any[]>([]);
  const [loadingVisits, setLoadingVisits] = useState(false);

  const [formData, setFormData] = useState({
    documentName: "",
    documentType: "" as CreateDocumentData["documentType"] | "",
    file: null as File | null,
    visit: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState<any>({});

  const documentTypes = [
    { value: "medical_record", label: "Medical Report" },
    { value: "lab_report", label: "Lab Result" },
    { value: "prescription", label: "Prescription" },
    { value: "imaging", label: "Imaging" },
    { value: "insurance", label: "Insurance" },
    { value: "other", label: "Other" },
  ];

  useEffect(() => {
    if (patientId) {
      fetchVisits();
    }
  }, [patientId]);

  const fetchVisits = async () => {
    if (!patientId) return;

    try {
      setLoadingVisits(true);
      const response = await fetch(
        `/api/visits?patient=${patientId}&status=in_progress,completed&limit=50`
      );
      const data = await response.json();
      setVisits(data.visits || []);
    } catch (error) {
      console.error("Error fetching visits:", error);
      toast.error("Failed to load visits");
      setVisits([]);
    } finally {
      setLoadingVisits(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 10 * 1024 * 1024;
      if (file.size > maxSize) {
        setFormErrors({ ...formErrors, file: "File size must be less than 10MB" });
        e.target.value = "";
        return;
      }
      setFormData({ ...formData, file });
      setFormErrors({ ...formErrors, file: null });
    }
  };

  const validateForm = () => {
    const errors: any = {};

    if (!formData.documentName.trim()) {
      errors.documentName = "Document name is required";
    }

    if (!formData.documentType) {
      errors.documentType = "Document type is required";
    }

    if (!formData.file) {
      errors.file = "Please select a file to upload";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!patientId) {
      toast.error("Patient ID is required");
      return;
    }

    const branchId = session?.user?.branch
      ? typeof session.user.branch === "object"
        ? session.user.branch._id
        : session.user.branch
      : null;

    if (!branchId) {
      toast.error("Branch information is missing");
      return;
    }

    try {
      setLoading(true);

      const uploadData: CreateDocumentData = {
        patient: patientId,
        documentName: formData.documentName,
        documentType: formData.documentType as CreateDocumentData["documentType"],
        file: formData.file!,
        branchId: branchId,
        notes: formData.notes || undefined,
        visit: formData.visit || undefined,
      };

      await documentService.upload(uploadData);

      toast.success("Document uploaded successfully");
      onDocumentUploaded();
      handleClose();
    } catch (error: any) {
      console.error("Error uploading document:", error);
      toast.error(error.message || "Failed to upload document");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      documentName: "",
      documentType: "",
      file: null,
      visit: "",
      notes: "",
    });
    setFormErrors({});
    onClose();
  };

  return (
    <div className="modal fade show" id="upload_document_modal" style={{ display: "block" }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header">
            <h4 className="modal-title">Upload Document</h4>
            <button
              type="button"
              className="btn-close btn-close-modal"
              onClick={handleClose}
              aria-label="Close"
            >
              <i className="ti ti-circle-x-filled" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-12 mb-3">
                  <label className="form-label">
                    Document Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${formErrors.documentName ? "is-invalid" : ""}`}
                    value={formData.documentName}
                    onChange={(e) =>
                      setFormData({ ...formData, documentName: e.target.value })
                    }
                    placeholder="Enter document name"
                  />
                  {formErrors.documentName && (
                    <div className="invalid-feedback">{formErrors.documentName}</div>
                  )}
                </div>

                <div className="col-md-12 mb-3">
                  <label className="form-label">
                    Document Type <span className="text-danger">*</span>
                  </label>
                  <select
                    className={`form-select ${formErrors.documentType ? "is-invalid" : ""}`}
                    value={formData.documentType}
                    onChange={(e) =>
                      setFormData({ ...formData, documentType: e.target.value as any })
                    }
                  >
                    <option value="">Select document type</option>
                    {documentTypes.map((type) => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                  {formErrors.documentType && (
                    <div className="invalid-feedback">{formErrors.documentType}</div>
                  )}
                </div>

                <div className="col-md-12 mb-3">
                  <label className="form-label">
                    File <span className="text-danger">*</span>
                  </label>
                  <input
                    type="file"
                    className={`form-control ${formErrors.file ? "is-invalid" : ""}`}
                    onChange={handleFileChange}
                    accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif"
                  />
                  <div className="form-text">
                    Accepted formats: PDF, DOC, DOCX, JPG, PNG, GIF. Max size: 10MB
                  </div>
                  {formErrors.file && (
                    <div className="invalid-feedback">{formErrors.file}</div>
                  )}
                  {formData.file && (
                    <div className="mt-2 text-success">
                      <i className="ti ti-file me-1" />
                      {formData.file.name} ({(formData.file.size / 1024).toFixed(2)} KB)
                    </div>
                  )}
                </div>

                <div className="col-md-12 mb-3">
                  <label className="form-label">Visit (Optional)</label>
                  <select
                    className="form-select"
                    value={formData.visit}
                    onChange={(e) => setFormData({ ...formData, visit: e.target.value })}
                    disabled={loadingVisits}
                  >
                    <option value="">Select a visit</option>
                    {visits.map((visit) => (
                      <option key={visit._id} value={visit._id}>
                        {new Date(visit.visitDate).toLocaleDateString()} -{" "}
                        {visit.visitType || "General"} (
                        {visit.status === "in_progress" ? "In Progress" : visit.status})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="col-md-12 mb-3">
                  <label className="form-label">Notes (Optional)</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any additional notes about this document"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={handleClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2" />
                    Uploading...
                  </>
                ) : (
                  "Upload Document"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DocumentModal;
