"use client";
import { useState, useEffect, Suspense, lazy } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-toastify";
import { format } from "date-fns";
import PatientDetailsHeader from "./PatientDetailsHeader";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { patientService } from "@/lib/services/patientService";
import { usePermissions } from "@/hooks/usePermissions";

const AdmissionModal = lazy(() => import("@/components/admissions/modal/admissionModal"));

const PatientDetailsCompoent = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const patientId = searchParams.get('id');
  const { can } = usePermissions();

  const [patient, setPatient] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdmissionModal, setShowAdmissionModal] = useState(false);

  useEffect(() => {
    if (!patientId) {
      toast.error('No patient ID provided');
      router.push(all_routes.patients);
      return;
    }

    fetchPatientData();
  }, [patientId]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      
      const [patientData, appointmentsData] = await Promise.all([
        patientService.getById(patientId!),
        fetch(`/api/appointments?patient=${patientId}&limit=2`).then(res => res.json())
      ]);

      setPatient(patientData.patient);
      setAppointments(appointmentsData.appointments || []);
    } catch (error: any) {
      toast.error(error.message || 'Failed to fetch patient data');
      console.error('Error fetching patient:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateAge = (dateOfBirth: Date) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'dd MMM yyyy');
    } catch {
      return 'N/A';
    }
  };

  const formatDateTime = (date: Date | string | undefined) => {
    if (!date) return 'N/A';
    try {
      return format(new Date(date), 'dd MMM yyyy, hh:mm a');
    } catch {
      return 'N/A';
    }
  };

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger">Patient not found</div>
        </div>
      </div>
    );
  }

  const getLastVisitDate = () => {
    if (patient.recentVisits && patient.recentVisits.length > 0) {
      return formatDateTime(patient.recentVisits[0].visitDate);
    }
    return 'No visits yet';
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'SCHEDULED':
        return 'badge-soft-purple';
      case 'CONFIRMED':
        return 'badge-soft-info';
      case 'COMPLETED':
        return 'badge-soft-success';
      case 'CANCELLED':
        return 'badge-soft-danger';
      default:
        return 'badge-soft-secondary';
    }
  };

  return (
    <>
    {/* ========================
              Start Page Content
          ========================= */}
    <div className="page-wrapper">
      {/* Start Content */}
      <div className="content">
        {/* Page Header */}
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
          <div className="d-flex gap-2 align-items-center">
            {can('admission:create') && (
              <button
                className="btn btn-primary"
                data-bs-toggle="modal"
                data-bs-target="#admission_modal"
                onClick={() => setShowAdmissionModal(true)}
              >
                <i className="ti ti-bed me-2" />
                Admit Patient
              </button>
            )}
            <Link href={all_routes.patients} className="fw-medium d-flex align-items-center">
              <i className="ti ti-arrow-left me-1" />
              Back to Patient
            </Link>
          </div>
        </div>
        {/* End Page Header */}
        {/* tabs start */}
        <PatientDetailsHeader />
        {/* tabs end */}
        {/* row start */}
        <div className="row">
          {/* col start */}
          <div className="col-xl-4">
            <div className="card mb-4 mb-xl-0">
              <div className="card-body">
                <div className="d-flex align-items-center pb-3 mb-3 border-bottom">
                  <Link
                    href="#"
                    className="avatar avatar-xxl me-3"
                  >
                    <ImageWithBasePath
                      src={patient.profileImage || "assets/img/profiles/avatar-03.jpg"}
                      alt="patient"
                      className="rounded"
                    />
                  </Link>
                  <div>
                    <span className="badge badge-soft-primary">#{patient.patientId}</span>
                    <h5 className="mb-1 mt-2">
                      <Link href="#">{patient.firstName} {patient.lastName}</Link>
                    </h5>
                    <p className="fs-13 mb-0">Last Visited: {getLastVisitDate()}</p>
                  </div>
                </div>
                <h6 className="mb-2">Basic Information</h6>
                <p className="mb-3">
                  Added On{" "}
                  <span className="float-end text-dark">{formatDate(patient.createdAt)}</span>
                </p>
                <p className="mb-3">
                  DOB <span className="float-end text-dark">{formatDate(patient.dateOfBirth)} ({calculateAge(patient.dateOfBirth)} years)</span>
                </p>
                <p className="mb-3">
                  Gender <span className="float-end text-dark">{patient.gender || 'N/A'}</span>
                </p>
                <p className="mb-3">
                  Marital Status{" "}
                  <span className="float-end text-dark">{patient.maritalStatus || 'N/A'}</span>
                </p>
                <p className="mb-3">
                  Blood Group <span className="float-end text-dark">{patient.bloodGroup || 'N/A'}</span>
                </p>
                <p className="mb-3">
                  Phone Number{" "}
                  <span className="float-end text-dark">{patient.phoneNumber}</span>
                </p>
                <p className="mb-3">
                  Email{" "}
                  <span className="float-end text-dark">
                    {patient.email || 'N/A'}
                  </span>
                </p>
                <p className="mb-3">
                  Referred By{" "}
                  <span className="float-end text-dark">
                    {patient.referredBy || 'N/A'}
                  </span>
                </p>
                <p className="mb-4">
                  Total No of Visits{" "}
                  <span className="float-end text-dark">{patient.recentVisits?.length || 0}</span>
                </p>
                <h6 className="mb-2 mt-3 mb-2 pt-3 border-top">
                  Address Information
                </h6>
                <p className="mb-0">
                  {patient.address}{patient.address2 ? `, ${patient.address2}` : ''}, {patient.city}, {patient.state} {patient.zipCode || ''}, {patient.country}
                </p>
              </div>
            </div>
          </div>
          {/* col end */}
          {/* col start */}
          <div className="col-xl-8">
            
            {/* card start */}
            <div className="card shadow flex-fill w-100">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h5 className="mb-0 d-inline-flex align-items-center">
                  Appointments
                </h5>
                <Link
                  href={`${all_routes.appointments}?patient=${patientId}`}
                  className="btn btn-sm btn-white flex-shrink-0"
                >
                  View All
                </Link>
              </div>
              <div className="card-body">
                {appointments.length > 0 ? (
                  <div className="row row-gap-3">
                    {appointments.map((appointment, index) => (
                      <div className="col-xl-6 d-flex" key={index}>
                        <div className="p-3 border rounded flex-fill">
                          <div className="d-flex align-items-center justify-content-between border-bottom mb-3 pb-3">
                            <span className={`badge ${getStatusBadgeClass(appointment.status)}`}>
                              {appointment.status}
                            </span>
                            {appointment.type === 'VIDEO' && (
                              <span className="btn btn-icon btn-secondary">
                                <i className="ti ti-video" />
                              </span>
                            )}
                            {appointment.type === 'IN_PERSON' && (
                              <span className="btn btn-icon btn-primary">
                                <i className="ti ti-user" />
                              </span>
                            )}
                          </div>
                          <div className="row row-gap-3">
                            <div className="col-sm-6">
                              <h6 className="fs-14 fw-semibold mb-1">Department</h6>
                              <p className="fs-13 mb-0">{appointment.department || 'N/A'}</p>
                            </div>
                            <div className="col-sm-6">
                              <h6 className="fs-14 fw-semibold mb-1">Doctor</h6>
                              <p className="fs-13 mb-0 text-truncate">
                                {appointment.doctorId?.name || 'N/A'}
                              </p>
                            </div>
                            <div className="col-sm-6">
                              <h6 className="fs-14 fw-semibold mb-1">
                                Date &amp; Time
                              </h6>
                              <p className="fs-13 mb-0">{formatDateTime(appointment.appointmentDate)}</p>
                            </div>
                            <div className="col-sm-6">
                              <h6 className="fs-14 fw-semibold mb-1">Booked On</h6>
                              <p className="fs-13 mb-0">{formatDate(appointment.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-3">No appointments found</p>
                )}
              </div>
            </div>
            {/* card end */}
            {/* card start */}
            <div className="card">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h5 className="mb-0 d-inline-flex align-items-center">
                  Vital Signs
                </h5>
                <Link
                  href={`${all_routes.patientDetailsVitalSign}?id=${patientId}`}
                  className="link-danger text-decoration-underline"
                >
                  View All
                </Link>
              </div>
              <div className="card-body pb-0">
                <div className="row">
                  <div className="col-sm-4">
                    <div className="d-flex align-items-center mb-3">
                      <span className="avatar rounded bg-light text-dark flex-shrink-0 me-2">
                        <i className="ti ti-droplet fs-16" />
                      </span>
                      <div>
                        <h6 className="fs-14 fw-semibold mb-1 text-truncate">
                          Blood Pressure
                        </h6>
                        <p className="mb-0 fs-13 d-inline-flex align-items-center text-truncate">
                          {patient.vitalSigns?.bloodPressure || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="d-flex align-items-center mb-3">
                      <span className="avatar rounded bg-light text-dark flex-shrink-0 me-2">
                        <i className="ti ti-heart-rate-monitor fs-16" />
                      </span>
                      <div>
                        <h6 className="fs-14 fw-semibold mb-1 text-truncate">
                          Heart Rate
                        </h6>
                        <p className="mb-0 fs-13 d-inline-flex align-items-center text-truncate">
                          {patient.vitalSigns?.heartRate || 'N/A'} Bpm
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="d-flex align-items-center mb-3">
                      <span className="avatar rounded bg-light text-dark flex-shrink-0 me-2">
                        <i className="ti ti-hexagons fs-16" />
                      </span>
                      <div>
                        <h6 className="fs-14 fw-semibold mb-1">SPO2</h6>
                        <p className="mb-0 fs-13 d-inline-flex align-items-center text-truncate">
                          {patient.vitalSigns?.spo2 || 'N/A'} %
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="d-flex align-items-center mb-3">
                      <span className="avatar rounded bg-light text-dark flex-shrink-0 me-2">
                        <i className="ti ti-temperature fs-16" />
                      </span>
                      <div>
                        <h6 className="fs-14 fw-semibold mb-1 text-truncate">
                          Temperature
                        </h6>
                        <p className="mb-0 fs-13 d-inline-flex align-items-center text-truncate">
                          {patient.vitalSigns?.temperature || 'N/A'} C
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="d-flex align-items-center mb-3">
                      <span className="avatar rounded bg-light text-dark flex-shrink-0 me-2">
                        <i className="ti ti-ease-in fs-16" />
                      </span>
                      <div>
                        <h6 className="fs-14 fw-semibold mb-1 text-truncate">
                          Respiratory Rate
                        </h6>
                        <p className="mb-0 fs-13 d-inline-flex align-items-center text-truncate">
                          {patient.vitalSigns?.respiratoryRate || 'N/A'} rpm
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <div className="d-flex align-items-center mb-3">
                      <span className="avatar rounded bg-light text-dark flex-shrink-0 me-2">
                        <i className="ti ti-circuit-switch-open fs-16" />
                      </span>
                      <div>
                        <h6 className="fs-14 fw-semibold mb-1 text-truncate">
                          Weight
                        </h6>
                        <p className="mb-0 fs-13 d-inline-flex align-items-center text-truncate">
                          {patient.vitalSigns?.weight || 'N/A'} kg
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* card end */}
            {/* card start */}
            <div className="card mb-0">
              <div className="card-header d-flex align-items-center justify-content-between flex-wrap gap-2">
                <h5 className="fw-bold mb-0 d-inline-flex align-items-center">
                  Visit History
                </h5>
                <Link
                  href={`${all_routes.visits}?patient=${patientId}`}
                  className="btn btn-sm btn-outline-light flex-shrink-0"
                >
                  View All
                </Link>
              </div>
              <div className="card-body pb-0">
                {patient.recentVisits && patient.recentVisits.length > 0 ? (
                  <div className="row row-gap-3">
                    {patient.recentVisits.slice(0, 2).map((visit: any, index: number) => (
                      <div className="col-xl-6" key={index}>
                        <div className="card">
                          <div className="card-body">
                            <div className="d-flex align-items-center mb-3">
                              <Link
                                href={all_routes.doctorDetails}
                                className="avatar flex-shrink-0"
                              >
                                <ImageWithBasePath
                                  src={visit.doctor?.profileImage || "assets/img/doctors/doctor-12.jpg"}
                                  className="rounded"
                                  alt="doctor"
                                />
                              </Link>
                              <div className="ms-2">
                                <div>
                                  <h6 className="fw-semibold fs-14 text-truncate mb-1">
                                    <Link href={all_routes.doctorDetails}>
                                      {visit.doctor?.name || 'N/A'}
                                    </Link>
                                  </h6>
                                  <p className="fs-13 mb-0">{visit.doctor?.specialization || 'N/A'}</p>
                                </div>
                              </div>
                            </div>
                            <div className="row mb-3 row-gap-2">
                              <div className="col-sm-6">
                                <h6 className="fw-semibold mb-1 fs-14">Visited On</h6>
                                <p className="fs-13 mb-0 text-truncate">
                                  {formatDateTime(visit.visitDate)}
                                </p>
                              </div>
                              <div className="col-sm-6">
                                <h6 className="fw-semibold mb-1 fs-14">Status</h6>
                                <p className="fs-13 mb-0">{visit.status || 'N/A'}</p>
                              </div>
                            </div>
                            <div className="p-3 bg-light rounded">
                              <h6 className="fw-semibold mb-1 fs-14">Notes</h6>
                              <p className="fs-13 mb-0 text-truncate line-clamb-2">
                                {visit.notes || visit.chiefComplaint || 'No notes available'}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted text-center py-3">No visit history found</p>
                )}
              </div>
            </div>
            {/* card end */}
          </div>
          {/* col end */}
        </div>
        {/* row end */}
      </div>
      {/* End Content */}
      {/* Start Footer */}
     <CommonFooter/>
      {/* End Footer */}
    </div>
    {/* ========================
              End Page Content
          ========================= */}
    
    {showAdmissionModal && (
      <Suspense fallback={<div>Loading...</div>}>
        <AdmissionModal
          onSuccess={() => {
            setShowAdmissionModal(false);
            fetchPatientData();
          }}
          preSelectedPatientId={patientId || undefined}
          editAdmissionId={null}
        />
      </Suspense>
    )}
  </>
  
  )
}

export default PatientDetailsCompoent
