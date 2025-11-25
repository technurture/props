"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import PatientDetailsHeader from "./PatientDetailsHeader";
import { all_routes } from "@/router/all_routes";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import DocumentModal from "./modals/documentModal";
import { documentService, PatientDocumentPopulated } from "@/lib/services/documentService";
import { toast } from "react-toastify";

const PatientDetailsDocumentsComponent = () => {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");

  const [documents, setDocuments] = useState<PatientDocumentPopulated[]>([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [deleteModalData, setDeleteModalData] = useState<{
    show: boolean;
    document: PatientDocumentPopulated | null;
  }>({ show: false, document: null });
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  useEffect(() => {
    if (patientId) {
      fetchDocuments();
    }
  }, [patientId]);

  const fetchDocuments = async () => {
    if (!patientId) return;

    try {
      setLoading(true);
      const response = await documentService.getByPatient(patientId);
      setDocuments(response.documents || []);
    } catch (error: any) {
      console.error("Error fetching documents:", error);
      toast.error("Failed to load documents");
      setDocuments([]);
    } finally {
      setLoading(false);
    }
  };

  const handleView = async (document: PatientDocumentPopulated) => {
    try {
      const blob = await documentService.download(document._id);
      const url = window.URL.createObjectURL(blob);
      
      const isPDF = document.mimeType?.includes('pdf') || document.fileName.toLowerCase().endsWith('.pdf');
      const isImage = document.mimeType?.includes('image') || /\.(jpg|jpeg|png|gif|bmp|webp)$/i.test(document.fileName);
      
      if (isPDF || isImage) {
        window.open(url, '_blank');
      } else {
        const link = window.document.createElement("a");
        link.href = url;
        link.download = document.fileName;
        window.document.body.appendChild(link);
        link.click();
        window.document.body.removeChild(link);
      }
      
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error: any) {
      console.error("Error viewing document:", error);
      toast.error("Failed to view document");
    }
  };

  const handleDownload = async (document: PatientDocumentPopulated) => {
    try {
      const blob = await documentService.download(document._id);
      const url = window.URL.createObjectURL(blob);
      const link = window.document.createElement("a");
      link.href = url;
      link.download = document.fileName;
      window.document.body.appendChild(link);
      link.click();
      window.document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Document downloaded successfully");
    } catch (error: any) {
      console.error("Error downloading document:", error);
      toast.error("Failed to download document");
    }
  };

  const handleDeleteClick = (document: PatientDocumentPopulated) => {
    setDeleteModalData({ show: true, document });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteModalData.document) return;

    try {
      await documentService.delete(deleteModalData.document._id);
      toast.success("Document deleted successfully");
      setDeleteModalData({ show: false, document: null });
      fetchDocuments();
    } catch (error: any) {
      console.error("Error deleting document:", error);
      toast.error("Failed to delete document");
    }
  };

  const handleDocumentUploaded = () => {
    fetchDocuments();
  };

  const getDocumentTypeLabel = (type: string) => {
    const typeMap: Record<string, string> = {
      medical_record: "Medical Report",
      lab_report: "Lab Result",
      prescription: "Prescription",
      imaging: "Imaging",
      insurance: "Insurance",
      consent_form: "Consent Form",
      other: "Other",
    };
    return typeMap[type] || type;
  };

  const sortedDocuments = [...documents].sort((a, b) => {
    const dateA = new Date(a.uploadedAt).getTime();
    const dateB = new Date(b.uploadedAt).getTime();
    return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
  });

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Patient Details</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Patient Details</li>
                </ol>
              </div>
            </div>
            <Link
              href={all_routes.patients}
              className="fw-medium d-flex align-items-center"
            >
              <i className="ti ti-arrow-left me-1" />
              Back to Patient
            </Link>
          </div>

          <PatientDetailsHeader />

          <div className="card mb-0">
            <div className="card-header d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h5 className="d-inline-flex align-items-center mb-0">
                Documents
                <span className="badge bg-danger ms-2">{documents.length}</span>
              </h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="dropdown">
                  <Link
                    href="#"
                    className="dropdown-toggle btn btn-md btn-outline-light d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                    aria-label="Sort documents"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="ti ti-sort-descending-2 me-1" />
                    <span className="me-1">Sort By : </span>
                    {sortOrder === "newest" ? "Newest" : "Oldest"}
                  </Link>
                  <ul className="dropdown-menu dropdown-menu-end p-2">
                    <li>
                      <Link
                        href="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setSortOrder("newest");
                        }}
                      >
                        Newest
                      </Link>
                    </li>
                    <li>
                      <Link
                        href="#"
                        className="dropdown-item rounded-1"
                        onClick={(e) => {
                          e.preventDefault();
                          setSortOrder("oldest");
                        }}
                      >
                        Oldest
                      </Link>
                    </li>
                  </ul>
                </div>
                <button
                  className="btn btn-primary d-inline-flex align-items-center"
                  onClick={() => setShowUploadModal(true)}
                >
                  <i className="ti ti-upload me-1" />
                  Upload Document
                </button>
              </div>
            </div>
            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading documents...</p>
                </div>
              ) : documents.length === 0 ? (
                <div className="text-center py-5">
                  <i className="ti ti-file-off fs-1 text-muted mb-3 d-block" />
                  <h5 className="text-muted">No documents found</h5>
                  <p className="text-muted">
                    Upload documents to keep track of patient records
                  </p>
                  <button
                    className="btn btn-primary mt-3"
                    onClick={() => setShowUploadModal(true)}
                  >
                    <i className="ti ti-upload me-1" />
                    Upload First Document
                  </button>
                </div>
              ) : (
                <div className="table-responsive table-nowrap">
                  <table className="table mb-0 border">
                    <thead className="table-light">
                      <tr>
                        <th>Document Name</th>
                        <th>Type</th>
                        <th>Uploaded By</th>
                        <th>Date</th>
                        <th>Notes</th>
                        <th className="text-end">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {sortedDocuments.map((document) => (
                        <tr key={document._id}>
                          <td>
                            <div className="d-flex align-items-center">
                              <i className="ti ti-file-text me-2 text-primary" />
                              <div>
                                <h6 className="mb-0">{document.documentName}</h6>
                                {document.fileName && (
                                  <small className="text-muted">
                                    {document.fileName}
                                  </small>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="badge bg-light text-dark">
                              {getDocumentTypeLabel(document.documentType)}
                            </span>
                          </td>
                          <td>
                            {document.uploadedBy.firstName}{" "}
                            {document.uploadedBy.lastName}
                          </td>
                          <td>
                            {new Date(document.uploadedAt).toLocaleDateString(
                              "en-US",
                              {
                                year: "numeric",
                                month: "short",
                                day: "numeric",
                              }
                            )}
                          </td>
                          <td>
                            {document.notes ? (
                              <span
                                className="text-truncate d-inline-block"
                                style={{ maxWidth: "200px" }}
                                title={document.notes}
                              >
                                {document.notes}
                              </span>
                            ) : (
                              <span className="text-muted">-</span>
                            )}
                          </td>
                          <td className="text-end">
                            <div className="d-flex gap-1 justify-content-end">
                              <button
                                className="btn btn-icon btn-sm btn-outline-primary"
                                onClick={() => handleView(document)}
                                title="View Document"
                              >
                                <i className="ti ti-eye" />
                              </button>
                              <button
                                className="btn btn-icon btn-sm btn-outline-success"
                                onClick={() => handleDownload(document)}
                                title="Download"
                              >
                                <i className="ti ti-download" />
                              </button>
                              <button
                                className="btn btn-icon btn-sm btn-outline-danger"
                                onClick={() => handleDeleteClick(document)}
                                title="Delete"
                              >
                                <i className="ti ti-trash" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>

        <CommonFooter />
      </div>

      {showUploadModal && (
        <>
          <div className="modal-backdrop fade show" />
          <DocumentModal
            patientId={patientId}
            onDocumentUploaded={handleDocumentUploaded}
            onClose={() => setShowUploadModal(false)}
          />
        </>
      )}

      {deleteModalData.show && (
        <>
          <div className="modal-backdrop fade show" />
          <div className="modal fade show" style={{ display: "block" }}>
            <div className="modal-dialog modal-dialog-centered modal-sm">
              <div className="modal-content">
                <div className="modal-body text-center position-relative">
                  <div className="mb-2 position-relative z-1">
                    <span className="avatar avatar-md bg-danger rounded-circle">
                      <i className="ti ti-trash fs-24" />
                    </span>
                  </div>
                  <h5 className="mb-1">Delete Document</h5>
                  <p className="mb-3">
                    Are you sure you want to delete &quot;
                    {deleteModalData.document?.documentName}&quot;?
                  </p>
                  <div className="d-flex justify-content-center gap-2">
                    <button
                      className="btn btn-white position-relative z-1 w-100"
                      onClick={() =>
                        setDeleteModalData({ show: false, document: null })
                      }
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-danger position-relative z-1 w-100"
                      onClick={handleDeleteConfirm}
                    >
                      Yes, Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default PatientDetailsDocumentsComponent;
