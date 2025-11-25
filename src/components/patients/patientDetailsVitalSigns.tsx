"use client";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PatientDetailsHeader from "./PatientDetailsHeader";
import { all_routes } from "@/router/all_routes";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { vitalSignService, VitalSignRecord } from "@/lib/services/vitalSignService";
import { toast } from "react-toastify";
import { format } from "date-fns";
import VitalSignsModal from "./modals/vitalSignsModal";
import { UserRole } from "@/types/emr";

const PatientDetailsVitalSignsComponent = () => {
  const searchParams = useSearchParams();
  const patientId = searchParams.get("id");
  const { data: session } = useSession();

  const [vitalSigns, setVitalSigns] = useState<VitalSignRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");

  const [showModal, setShowModal] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<any | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const userRole = session?.user?.role as UserRole;
  const canRecordVitals = userRole === UserRole.NURSE || userRole === UserRole.ADMIN;

  const fetchVitalSigns = async () => {
    if (!patientId) {
      toast.error("Patient ID not found");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await vitalSignService.getByPatient(patientId);
      
      let sortedSigns = [...response.vitalSigns];
      if (sortOrder === "newest") {
        sortedSigns.sort((a, b) => new Date(b.visitDate).getTime() - new Date(a.visitDate).getTime());
      } else {
        sortedSigns.sort((a, b) => new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime());
      }
      
      setVitalSigns(sortedSigns);
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : "Failed to fetch vital signs";
      console.error("Error fetching vital signs:", error);
      toast.error(errorMessage);
      setVitalSigns([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVitalSigns();
  }, [patientId, sortOrder]);

  const formatDate = (date: string | Date) => {
    try {
      return format(new Date(date), "dd MMM yyyy, hh:mm a");
    } catch {
      return "N/A";
    }
  };

  const calculateBMI = (weight?: number, height?: number) => {
    if (!weight || !height || height === 0) return "N/A";
    const heightInMeters = height / 100;
    const bmi = weight / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  };

  const handleRecordVitalSigns = () => {
    setSelectedVisit(null);
    setIsEditing(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedVisit(null);
    setIsEditing(false);
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
                Vital Signs
                <span className="badge bg-danger ms-2">{vitalSigns.length}</span>
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
                {canRecordVitals && (
                  <button
                    className="btn btn-md btn-primary d-inline-flex align-items-center"
                    onClick={handleRecordVitalSigns}
                  >
                    <i className="ti ti-plus me-1" />
                    Record Vital Signs
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
                  <p className="mt-2 text-muted">Loading vital signs...</p>
                </div>
              ) : vitalSigns.length === 0 ? (
                <div className="text-center py-5">
                  <div className="mb-3">
                    <i
                      className="ti ti-heart-rate-monitor"
                      style={{ fontSize: "48px", color: "#6c757d" }}
                    />
                  </div>
                  <h5 className="text-muted">No Vital Signs Found</h5>
                  <p className="text-muted mb-3">
                    No vital signs have been recorded for this patient yet.
                  </p>
                  {canRecordVitals && (
                    <button
                      className="btn btn-primary"
                      onClick={handleRecordVitalSigns}
                    >
                      <i className="ti ti-plus me-1" />
                      Record First Vital Signs
                    </button>
                  )}
                </div>
              ) : (
                <div className="table-responsive table-nowrap">
                  <table className="table mb-0 border">
                    <thead className="table-light">
                      <tr>
                        <th>Date</th>
                        <th>Visit #</th>
                        <th>Blood Pressure</th>
                        <th>Temperature (°C)</th>
                        <th>Pulse (bpm)</th>
                        <th>Weight (kg)</th>
                        <th>Height (cm)</th>
                        <th>BMI</th>
                        <th>Recorded By</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vitalSigns.map((record) => {
                        const vs = record.vitalSigns || {};
                        const bmi = record.vitalSigns?.bmi 
                          ? record.vitalSigns.bmi.toFixed(1)
                          : calculateBMI(vs.weight, vs.height);
                        
                        return (
                          <tr key={record.visitId}>
                            <td>{formatDate(record.visitDate)}</td>
                            <td>
                              <Link
                                href="#"
                                onClick={(e) => {
                                  e.preventDefault();
                                  toast.info("View visit details will be implemented soon");
                                }}
                              >
                                {record.visitNumber}
                              </Link>
                            </td>
                            <td>{vs.bloodPressure || "N/A"}</td>
                            <td>
                              {vs.temperature
                                ? `${vs.temperature}°C`
                                : "N/A"}
                            </td>
                            <td>{vs.pulse || "N/A"}</td>
                            <td>
                              {vs.weight ? `${vs.weight} kg` : "N/A"}
                            </td>
                            <td>
                              {vs.height ? `${vs.height} cm` : "N/A"}
                            </td>
                            <td>{bmi}</td>
                            <td>
                              {record.recordedBy?.name || "N/A"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <CommonFooter />
      
      {showModal && (
        <VitalSignsModal
          patientId={patientId}
          selectedVisit={selectedVisit}
          isEditing={isEditing}
          onVitalSignsCreated={fetchVitalSigns}
          onVitalSignsUpdated={fetchVitalSigns}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default PatientDetailsVitalSignsComponent;
