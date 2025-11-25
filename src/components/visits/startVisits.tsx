"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { apiClient } from "@/lib/services/api-client";
import { PatientVisit } from "@/types/emr";
import HandoffButton from "./handoff/HandoffButton";
import VisitTimeline from "./VisitTimeline";
import AssignedDoctorCell from "./AssignedDoctorCell";
import { usePageGuard } from "@/hooks/usePageGuard";
import { MissingResource } from "@/components/common/MissingResource";
import { AccessDenied } from "@/components/common/AccessDenied";

interface VisitDetailsResponse {
  visit: PatientVisit;
  labTests?: any[];
  prescriptions?: any[];
}

const StartVisitsComponent = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const visitId = searchParams.get('id');
  const isEditMode = searchParams.get('edit') === 'true';

  const { isReady, error } = usePageGuard({
    requiredParams: ['id'],
    permission: 'appointment:update',
    redirectTo: all_routes.visits
  });

  const [visit, setVisit] = useState<PatientVisit | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    visitDate: '',
    currentStage: '',
    status: '',
  });

  useEffect(() => {
    if (visitId) {
      fetchVisitDetails();
    } else {
      setLoading(false);
    }
  }, [visitId]);

  useEffect(() => {
    if (visit) {
      setFormData({
        visitDate: visit.visitDate ? new Date(visit.visitDate).toISOString().split('T')[0] : '',
        currentStage: visit.currentStage || '',
        status: visit.status || '',
      });
    }
  }, [visit]);

  const fetchVisitDetails = async () => {
    if (!visitId) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get<VisitDetailsResponse>(
        `/api/visits/${visitId}`,
        { showErrorToast: true }
      );
      setVisit(response.visit);
    } catch (error) {
      console.error("Failed to fetch visit details:", error);
      router.push(all_routes.visits);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitId) return;

    setSaving(true);
    try {
      await apiClient.put(
        `/api/visits/${visitId}`,
        formData,
        { successMessage: "Visit updated successfully" }
      );
      await fetchVisitDetails();
      router.push(`${all_routes.startVisits}?id=${visitId}`);
    } catch (error) {
      console.error("Failed to update visit:", error);
    } finally {
      setSaving(false);
    }
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'badge-soft-success';
      case 'in_progress':
        return 'badge-soft-info';
      case 'cancelled':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-warning';
    }
  };

  const getStageBadgeClass = (stage: string) => {
    switch (stage) {
      case 'completed':
        return 'badge-soft-success';
      case 'doctor':
        return 'badge-soft-primary';
      case 'nurse':
        return 'badge-soft-info';
      case 'lab':
        return 'badge-soft-warning';
      case 'pharmacy':
        return 'badge-soft-purple';
      case 'billing':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  const renderStageInfo = (stageName: string, stageData: any) => {
    if (!stageData || !stageData.clockedInAt) return null;

    const clockedInBy = typeof stageData.clockedInBy === 'object' 
      ? `${stageData.clockedInBy?.firstName} ${stageData.clockedInBy?.lastName}` 
      : 'N/A';
    const clockedOutBy = typeof stageData.clockedOutBy === 'object'
      ? `${stageData.clockedOutBy?.firstName} ${stageData.clockedOutBy?.lastName}`
      : null;

    return (
      <div className="card mb-3">
        <div className="card-body">
          <h6 className="card-title text-capitalize mb-3">
            <i className="ti ti-circle-check me-2"></i>
            {stageName.replace(/([A-Z])/g, ' $1').trim()}
          </h6>
          <div className="row g-3">
            <div className="col-md-6">
              <p className="mb-1 text-muted">Clocked In By:</p>
              <p className="mb-0 fw-medium">{clockedInBy}</p>
              <p className="mb-0 small text-muted">{formatDate(stageData.clockedInAt)}</p>
            </div>
            {stageData.clockedOutAt && (
              <div className="col-md-6">
                <p className="mb-1 text-muted">Clocked Out By:</p>
                <p className="mb-0 fw-medium">{clockedOutBy || 'N/A'}</p>
                <p className="mb-0 small text-muted">{formatDate(stageData.clockedOutAt)}</p>
              </div>
            )}
            {stageData.vitalSigns && (
              <div className="col-12">
                <h6 className="mt-2 mb-2">Vital Signs:</h6>
                <div className="row g-2">
                  {stageData.vitalSigns.bloodPressure && (
                    <div className="col-md-4">
                      <div className="border p-2 rounded">
                        <small className="text-muted">Blood Pressure</small>
                        <p className="mb-0 fw-medium">{stageData.vitalSigns.bloodPressure}</p>
                      </div>
                    </div>
                  )}
                  {stageData.vitalSigns.temperature && (
                    <div className="col-md-4">
                      <div className="border p-2 rounded">
                        <small className="text-muted">Temperature</small>
                        <p className="mb-0 fw-medium">{stageData.vitalSigns.temperature}°F</p>
                      </div>
                    </div>
                  )}
                  {stageData.vitalSigns.pulse && (
                    <div className="col-md-4">
                      <div className="border p-2 rounded">
                        <small className="text-muted">Pulse</small>
                        <p className="mb-0 fw-medium">{stageData.vitalSigns.pulse} bpm</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
            {stageData.diagnosis && (
              <div className="col-12">
                <p className="mb-1 text-muted">Diagnosis:</p>
                <p className="mb-0">{stageData.diagnosis}</p>
              </div>
            )}
            {stageData.notes && (
              <div className="col-12">
                <p className="mb-1 text-muted">Notes:</p>
                <p className="mb-0">{stageData.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  if (error === 'missing_param') {
    return <MissingResource resourceName="Visit" backLink={all_routes.visits} />;
  }

  if (error === 'unauthorized') {
    return <AccessDenied backLink={all_routes.dashboard} />;
  }

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!visit && visitId) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="text-center py-5">
            <p className="text-muted">Visit not found</p>
            <Link href={all_routes.visits} className="btn btn-primary">
              Back to Visits
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const patient = typeof visit?.patient === 'object' ? visit.patient : null;
  const branch = typeof visit?.branchId === 'object' ? visit.branchId : null;

  return (
    <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">{isEditMode ? 'Edit Visit' : 'Visit Details'}</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item">
                    <Link href={all_routes.visits}>Visits</Link>
                  </li>
                  <li className="breadcrumb-item active">
                    {isEditMode ? 'Edit' : 'Details'}
                  </li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              {!isEditMode && visit && visit._id && visit.status === 'in_progress' && visit.currentStage !== 'completed' && (
                <HandoffButton
                  visitId={visit._id}
                  currentStage={visit.currentStage}
                  patientName={patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}
                  onSuccess={fetchVisitDetails}
                  variant="success"
                />
              )}
              {!isEditMode && visit?.status !== 'completed' && visit?.status !== 'cancelled' && (
                <Link
                  href={`${all_routes.startVisits}?id=${visitId}&edit=true`}
                  className="btn btn-primary"
                >
                  <i className="ti ti-edit me-1" />
                  Edit Visit
                </Link>
              )}
              <Link
                href={all_routes.visits}
                className="btn btn-outline-primary"
              >
                <i className="ti ti-arrow-left me-1" />
                Back to Visits
              </Link>
            </div>
          </div>

          {isEditMode ? (
            <div className="card">
              <div className="card-body">
                <form onSubmit={handleSubmit}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <label className="form-label">Visit Date</label>
                      <input
                        type="date"
                        className="form-control"
                        value={formData.visitDate}
                        onChange={(e) => setFormData({ ...formData, visitDate: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Current Stage</label>
                      <select
                        className="form-select"
                        value={formData.currentStage}
                        onChange={(e) => setFormData({ ...formData, currentStage: e.target.value })}
                        required
                      >
                        <option value="">Select Stage</option>
                        <option value="front_desk">Front Desk</option>
                        <option value="nurse">Nurse</option>
                        <option value="doctor">Doctor</option>
                        <option value="lab">Lab</option>
                        <option value="pharmacy">Pharmacy</option>
                        <option value="billing">Billing</option>
                        <option value="completed">Completed</option>
                      </select>
                    </div>
                    <div className="col-md-6">
                      <label className="form-label">Status</label>
                      <select
                        className="form-select"
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                        required
                      >
                        <option value="">Select Status</option>
                        <option value="in_progress">In Progress</option>
                        <option value="completed">Completed</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-4">
                    <button
                      type="submit"
                      className="btn btn-primary me-2"
                      disabled={saving}
                    >
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                    <Link
                      href={`${all_routes.startVisits}?id=${visitId}`}
                      className="btn btn-outline-secondary"
                    >
                      Cancel
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          ) : (
            <>
              <div className="card mb-4">
                <div className="card-body">
                  <div className="row g-3">
                    <div className="col-md-8">
                      <div className="d-flex align-items-center mb-3">
                        <span className="avatar avatar-xl me-3">
                          <ImageWithBasePath
                            src={patient?.profileImage || "assets/img/users/user-01.jpg"}
                            alt="patient"
                            className="rounded"
                          />
                        </span>
                        <div>
                          <h5 className="mb-1">
                            {patient ? `${patient.firstName} ${patient.lastName}` : 'N/A'}
                          </h5>
                          <p className="text-muted mb-0">{patient?.patientId || 'N/A'}</p>
                        </div>
                      </div>
                      <div className="row g-3">
                        <div className="col-md-6">
                          <p className="mb-1 text-muted">Visit Number:</p>
                          <p className="mb-0 fw-medium">{visit?.visitNumber}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-1 text-muted">Assigned Doctor:</p>
                          <AssignedDoctorCell
                            visitId={visit?._id!}
                            assignedDoctor={visit?.assignedDoctor as any}
                            onUpdate={fetchVisitDetails}
                          />
                        </div>
                        <div className="col-md-6">
                          <p className="mb-1 text-muted">Visit Date:</p>
                          <p className="mb-0 fw-medium">{formatDate(visit?.visitDate)}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-1 text-muted">Branch:</p>
                          <p className="mb-0 fw-medium">{branch?.name || 'N/A'}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-1 text-muted">Contact:</p>
                          <p className="mb-0 fw-medium">{patient?.phoneNumber || 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    <div className="col-md-4">
                      <div className="border rounded p-3 h-100">
                        <h6 className="mb-3">Visit Status</h6>
                        <div className="mb-3">
                          <p className="mb-1 text-muted">Current Stage:</p>
                          <span className={`badge ${getStageBadgeClass(visit?.currentStage || '')}`}>
                            {visit?.currentStage?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                        <div>
                          <p className="mb-1 text-muted">Status:</p>
                          <span className={`badge ${getStatusBadgeClass(visit?.status || '')}`}>
                            {visit?.status?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="d-flex align-items-center justify-content-between mb-3">
                <h5 className="mb-0">Visit Timeline</h5>
                {visit && visit._id && visit.status === 'in_progress' && visit.currentStage !== 'completed' && (
                  <HandoffButton
                    visitId={visit._id}
                    currentStage={visit.currentStage}
                    patientName={patient ? `${patient.firstName} ${patient.lastName}` : 'Patient'}
                    onSuccess={fetchVisitDetails}
                    variant="primary"
                    size="sm"
                  />
                )}
              </div>
              {visit && <VisitTimeline visit={visit} />}
            </>
          )}
        </div>
        <CommonFooter />
      </div>
  );
};

export default StartVisitsComponent;
