"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PatientDetailsHeader from "./PatientDetailsHeader";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { prescriptionService } from "@/lib/services/prescriptionService";
import { toast } from "react-toastify";
import { format } from "date-fns";
import { IPrescription } from "@/models/Prescription";
import PrescriptionModal from "./modals/prescriptionModal";
import { usePermissions } from "@/hooks/usePermissions";

interface PopulatedPrescription extends Omit<IPrescription, 'doctor' | 'patient'> {
  doctor: {
    _id: string;
    firstName: string;
    lastName: string;
  };
  patient: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

const PatientDetailsPrescriptionComponent = () => {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { data: session } = useSession();
  const { can, userRole, userId } = usePermissions();

  const [prescriptions, setPrescriptions] = useState<PopulatedPrescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const limit = 10;

  const [showModal, setShowModal] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<PopulatedPrescription | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isViewing, setIsViewing] = useState(false);

  const fetchPrescriptions = async () => {
    if (!patientId) {
      toast.error("Patient ID not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await prescriptionService.getAll({
        patient: patientId,
        page: currentPage,
        limit: limit,
      });

      setPrescriptions(response.prescriptions as unknown as PopulatedPrescription[]);
      setTotalPages(response.pagination?.totalPages || 1);
      setTotalCount(response.pagination?.totalCount || 0);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch prescriptions";
      console.error("Error fetching prescriptions:", error);
      toast.error(errorMessage);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrescriptions();
  }, [patientId, currentPage, sortOrder]);

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "dd MMM yyyy");
    } catch {
      return "N/A";
    }
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case "dispensed":
        return "badge badge-soft-success";
      case "active":
        return "badge badge-soft-info";
      case "cancelled":
        return "badge badge-soft-danger";
      default:
        return "badge badge-soft-secondary";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "dispensed":
        return "Dispensed";
      case "active":
        return "Active";
      case "cancelled":
        return "Cancelled";
      default:
        return status;
    }
  };

  const getTotalQuantity = (medications: IPrescription['medications']) => {
    return medications.reduce((sum, med) => sum + (med.quantity || 0), 0);
  };

  const handleCreatePrescription = () => {
    setSelectedPrescription(null);
    setIsEditing(false);
    setIsViewing(false);
    setShowModal(true);
  };

  const handleViewPrescription = (prescription: PopulatedPrescription) => {
    setSelectedPrescription(prescription);
    setIsEditing(false);
    setIsViewing(true);
    setShowModal(true);
  };

  const handleEditPrescription = (prescription: PopulatedPrescription) => {
    setSelectedPrescription(prescription);
    setIsEditing(true);
    setIsViewing(false);
    setShowModal(true);
  };

  const handleDeletePrescription = async (prescription: PopulatedPrescription) => {
    if (!confirm(`Are you sure you want to delete prescription ${prescription.prescriptionNumber}?`)) {
      return;
    }

    try {
      await prescriptionService.delete(prescription._id?.toString() || "");
      toast.success("Prescription deleted successfully");
      fetchPrescriptions();
    } catch (error: any) {
      console.error("Error deleting prescription:", error);
      toast.error(error.message || "Failed to delete prescription");
    }
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedPrescription(null);
    setIsEditing(false);
    setIsViewing(false);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    const pages = [];
    const maxPagesToShow = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
    let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

    if (endPage - startPage + 1 < maxPagesToShow) {
      startPage = Math.max(1, endPage - maxPagesToShow + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      pages.push(
        <li key={i} className={`page-item ${i === currentPage ? "active" : ""}`}>
          <button
            className="page-link"
            onClick={() => setCurrentPage(i)}
            disabled={loading}
          >
            {i}
          </button>
        </li>
      );
    }

    return (
      <nav aria-label="Prescriptions pagination">
        <ul className="pagination justify-content-center mb-0">
          <li className={`page-item ${currentPage === 1 ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1 || loading}
              aria-label="Previous page"
            >
              <i className="ti ti-chevron-left" />
            </button>
          </li>
          {startPage > 1 && (
            <>
              <li className="page-item">
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(1)}
                  disabled={loading}
                >
                  1
                </button>
              </li>
              {startPage > 2 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
            </>
          )}
          {pages}
          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && (
                <li className="page-item disabled">
                  <span className="page-link">...</span>
                </li>
              )}
              <li className="page-item">
                <button
                  className="page-link"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={loading}
                >
                  {totalPages}
                </button>
              </li>
            </>
          )}
          <li className={`page-item ${currentPage === totalPages ? "disabled" : ""}`}>
            <button
              className="page-link"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages || loading}
              aria-label="Next page"
            >
              <i className="ti ti-chevron-right" />
            </button>
          </li>
        </ul>
      </nav>
    );
  };

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
                Total Prescriptions
                <span className="badge bg-danger ms-2">{totalCount}</span>
              </h5>
              <div className="d-flex align-items-center flex-wrap gap-2">
                <div className="dropdown">
                  <Link
                    href="#"
                    className="dropdown-toggle btn btn-md btn-outline-light d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                    aria-label="Patient actions menu"
                    aria-haspopup="true"
                    aria-expanded="false"
                  >
                    <i className="ti ti-sort-descending-2 me-1" />
                    <span className="me-1">Sort By : </span>{" "}
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
                {can('prescription:create') && (
                  <button
                    className="btn btn-md btn-primary d-inline-flex align-items-center"
                    onClick={handleCreatePrescription}
                  >
                    <i className="ti ti-plus me-1" />
                    Create Prescription
                  </button>
                )}
              </div>
            </div>

            <div className="card-body">
              {loading ? (
                <div className="text-center py-5">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                  <p className="mt-2 text-muted">Loading prescriptions...</p>
                </div>
              ) : prescriptions.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i
                      className="ti ti-clipboard-text"
                      style={{ fontSize: "48px", color: "#6c757d" }}
                    />
                  </div>
                  <h5 className="text-muted">No Prescriptions Found</h5>
                  <p className="text-muted mb-3">
                    No prescriptions have been created for this patient yet.
                  </p>
                  {can('prescription:create') && (
                    <button
                      className="btn btn-primary"
                      onClick={handleCreatePrescription}
                    >
                      <i className="ti ti-plus me-1" />
                      Create First Prescription
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive table-nowrap">
                  <table className="table mb-0 border">
                    <thead className="table-light">
                      <tr>
                        <th>Prescription #</th>
                        <th>Medications</th>
                        <th>Quantity</th>
                        <th>Date</th>
                        <th>Prescribed By</th>
                        <th>Diagnosis</th>
                        <th className="no-sort">Status</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {prescriptions.map((prescription) => (
                        <tr key={prescription._id?.toString()}>
                          <td>
                            <Link
                              href="#"
                              onClick={(e) => {
                                e.preventDefault();
                                toast.info("View prescription modal will be implemented soon");
                              }}
                            >
                              {prescription.prescriptionNumber}
                            </Link>
                          </td>
                          <td>
                            <div className="d-flex flex-column">
                              {prescription.medications.slice(0, 2).map((med, idx) => (
                                <span key={idx} className="text-truncate" style={{ maxWidth: "200px" }}>
                                  {med.name}
                                </span>
                              ))}
                              {prescription.medications.length > 2 && (
                                <span className="text-muted small">
                                  +{prescription.medications.length - 2} more
                                </span>
                              )}
                            </div>
                          </td>
                          <td>{getTotalQuantity(prescription.medications)}</td>
                          <td>{formatDate(prescription.createdAt)}</td>
                          <td>
                            <div className="d-flex align-items-center">
                              <Link
                                href={all_routes.doctorDetails}
                                className="avatar avatar-xs me-2"
                              >
                                <ImageWithBasePath
                                  src="assets/img/doctors/doctor-01.jpg"
                                  alt="doctor"
                                  className="rounded"
                                />
                              </Link>
                              <div>
                                <h6 className="fs-14 mb-0 fw-medium">
                                  <Link href={all_routes.doctorDetails}>
                                    {prescription.doctor 
                                      ? `Dr. ${prescription.doctor.firstName} ${prescription.doctor.lastName}`
                                      : "N/A"}
                                  </Link>
                                </h6>
                              </div>
                            </div>
                          </td>
                          <td>
                            <span className="text-truncate d-block" style={{ maxWidth: "200px" }}>
                              {prescription.diagnosis || "N/A"}
                            </span>
                          </td>
                          <td>
                            <span className={getStatusBadgeClass(prescription.status)}>
                              {getStatusLabel(prescription.status)}
                            </span>
                          </td>
                          <td>
                            <div className="d-flex align-items-center gap-2">
                              <button
                                className="btn btn-sm btn-icon btn-outline-primary"
                                onClick={() => handleViewPrescription(prescription)}
                                title="View Details"
                              >
                                <i className="ti ti-eye" />
                              </button>
                              {can('prescription:update') && (
                                userRole === 'DOCTOR' 
                                  ? prescription.doctor?._id === userId && (
                                      <button
                                        className="btn btn-sm btn-icon btn-outline-success"
                                        onClick={() => handleEditPrescription(prescription)}
                                        title="Edit Prescription"
                                      >
                                        <i className="ti ti-edit" />
                                      </button>
                                    )
                                  : (
                                      <button
                                        className="btn btn-sm btn-icon btn-outline-success"
                                        onClick={() => handleEditPrescription(prescription)}
                                        title="Edit Prescription"
                                      >
                                        <i className="ti ti-edit" />
                                      </button>
                                    )
                              )}
                              {can('prescription:delete') && (
                                userRole === 'DOCTOR'
                                  ? prescription.doctor?._id === userId && (
                                      <button
                                        className="btn btn-sm btn-icon btn-outline-danger"
                                        onClick={() => handleDeletePrescription(prescription)}
                                        title="Delete Prescription"
                                      >
                                        <i className="ti ti-trash" />
                                      </button>
                                    )
                                  : (
                                      <button
                                        className="btn btn-sm btn-icon btn-outline-danger"
                                        onClick={() => handleDeletePrescription(prescription)}
                                        title="Delete Prescription"
                                      >
                                        <i className="ti ti-trash" />
                                      </button>
                                    )
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && prescriptions.length > 0 && (
                <div className="mt-3">{renderPagination()}</div>
              )}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />
      
      {showModal && (
        <PrescriptionModal
          selectedPrescription={selectedPrescription}
          isEditing={isEditing}
          isViewing={isViewing}
          patientId={patientId}
          onPrescriptionCreated={fetchPrescriptions}
          onPrescriptionUpdated={fetchPrescriptions}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default PatientDetailsPrescriptionComponent;
