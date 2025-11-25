"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { all_routes } from "@/router/all_routes";
import { apiClient } from "@/lib/services/api-client";
import { Doctor } from "@/types/emr";

const DoctorDetailsComponent = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (doctorId) {
      fetchDoctor();
    } else {
      setLoading(false);
    }
  }, [doctorId]);

  const fetchDoctor = async () => {
    if (!doctorId) return;

    setLoading(true);
    try {
      const response = await apiClient.get<{ doctor: Doctor; upcomingAppointments: any[] }>(`/api/doctors/${doctorId}`, {
        showErrorToast: true,
      });
      setDoctor(response.doctor);
    } catch (error) {
      console.error("Failed to fetch doctor:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!doctorId) return;

    setDeleting(true);
    try {
      await apiClient.delete(`/api/doctors/${doctorId}`, {
        successMessage: "Doctor deactivated successfully",
      });
      router.push(all_routes.allDoctorsList);
    } catch (error) {
      console.error("Failed to delete doctor:", error);
      setDeleting(false);
      setShowDeleteModal(false);
    }
  };

  const isAdmin = session?.user?.role === "ADMIN";

  if (loading) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger">Doctor not found</div>
          <Link href={all_routes.allDoctorsList} className="btn btn-primary">
            Back to Doctors List
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Doctor Details</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Doctor Details</li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              <Link
                href={all_routes.allDoctorsList}
                className="fw-medium d-flex align-items-center"
              >
                <i className="ti ti-arrow-left me-1" />
                Back to Doctors
              </Link>
            </div>
          </div>

          <div className="row row-gap-4">
            <div className="col-xl-4">
              <div className="card shadow mb-0">
                <div className="card-body">
                  <div className="d-flex align-items-center pb-3 mb-3 border-bottom gap-3">
                    <Link href="#" className="avatar avatar-xxl">
                      <ImageWithBasePath
                        src={doctor.profile?.profileImage || "assets/img/doctors/doctor-01.jpg"}
                        alt="doctor"
                        className="rounded"
                      />
                    </Link>
                    <div>
                      <span className="badge badge-md badge-soft-primary">
                        #DR{doctor._id?.slice(-6).toUpperCase()}
                      </span>
                      <h5 className="mb-1 fw-semibold mt-2">
                        Dr. {doctor.firstName} {doctor.lastName}
                      </h5>
                      <p className="fs-13 mb-0">{doctor.profile?.specialization || "General Practitioner"}</p>
                    </div>
                  </div>
                  <h6 className="mb-3">Basic Information</h6>
                  {doctor.profile?.specialization && (
                    <p className="mb-3">
                      Specialist{" "}
                      <span className="float-end text-dark">
                        {doctor.profile.specialization}
                      </span>
                    </p>
                  )}
                  {doctor.createdAt && (
                    <p className="mb-3">
                      Member Since{" "}
                      <span className="float-end text-dark">
                        {new Date(doctor.createdAt).toLocaleDateString()}
                      </span>
                    </p>
                  )}
                  <p className="mb-3">
                    Phone Number{" "}
                    <span className="float-end text-dark">{doctor.phoneNumber}</span>
                  </p>
                  <p className="mb-3">
                    Email{" "}
                    <span className="float-end text-dark">{doctor.email}</span>
                  </p>
                  {doctor.profile?.licenseNumber && (
                    <p className="mb-3">
                      License Number{" "}
                      <span className="float-end text-dark">
                        {doctor.profile.licenseNumber}
                      </span>
                    </p>
                  )}
                  {doctor.profile?.department && (
                    <p className="mb-3">
                      Department{" "}
                      <span className="float-end text-dark">
                        {doctor.profile.department}
                      </span>
                    </p>
                  )}
                  <p className="mb-3">
                    Status{" "}
                    <span className={`float-end badge ${doctor.isActive ? 'badge-soft-success' : 'badge-soft-danger'}`}>
                      {doctor.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </p>

                  <div className="d-flex gap-2 mt-4 pt-3 border-top">
                    <Link
                      href={`${all_routes.editDoctors}?id=${doctor._id}`}
                      className="btn btn-primary flex-fill"
                    >
                      <i className="ti ti-edit me-1" />
                      Edit
                    </Link>
                    {isAdmin && (
                      <button
                        onClick={() => setShowDeleteModal(true)}
                        className="btn btn-danger flex-fill"
                      >
                        <i className="ti ti-trash me-1" />
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="col-xl-8">
              <div className="accordion accordion-bordered" id="BorderedaccordionExample">
                {doctor.profile?.bio && (
                  <div className="accordion-item bg-white mb-4">
                    <h2 className="accordion-header" id="about_view_header">
                      <button
                        className="accordion-button"
                        type="button"
                        data-bs-toggle="collapse"
                        data-bs-target="#about_view"
                        aria-expanded="true"
                        aria-controls="about_view"
                      >
                        About
                      </button>
                    </h2>
                    <div
                      id="about_view"
                      className="accordion-collapse collapse show"
                      aria-labelledby="about_view_header"
                      data-bs-parent="#BorderedaccordionExample"
                    >
                      <div className="accordion-body">
                        <p className="mb-0">{doctor.profile.bio}</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="accordion-item bg-white mb-4">
                  <h2 className="accordion-header" id="contact_info_header">
                    <button
                      className="accordion-button collapsed"
                      type="button"
                      data-bs-toggle="collapse"
                      data-bs-target="#contact_info"
                      aria-expanded="false"
                      aria-controls="contact_info"
                    >
                      Contact Information
                    </button>
                  </h2>
                  <div
                    id="contact_info"
                    className="accordion-collapse collapse"
                    aria-labelledby="contact_info_header"
                    data-bs-parent="#BorderedaccordionExample"
                  >
                    <div className="accordion-body">
                      <div className="row">
                        <div className="col-md-6">
                          <p className="mb-2"><strong>Email:</strong></p>
                          <p>{doctor.email}</p>
                        </div>
                        <div className="col-md-6">
                          <p className="mb-2"><strong>Phone:</strong></p>
                          <p>{doctor.phoneNumber}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>

      {showDeleteModal && (
        <div
          className="modal fade show d-block"
          style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
          tabIndex={-1}
        >
          <div className="modal-dialog modal-dialog-centered">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">Confirm Delete</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                />
              </div>
              <div className="modal-body">
                <p>Are you sure you want to deactivate this doctor? This action cannot be undone.</p>
              </div>
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn btn-danger"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Deleting...
                    </>
                  ) : (
                    "Delete"
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default DoctorDetailsComponent;
