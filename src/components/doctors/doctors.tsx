"use client";

import { useState, useEffect } from "react";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import { all_routes } from "@/router/all_routes";
import { apiClient } from "@/lib/services/api-client";
import { Doctor } from "@/types/emr";
import Link from "next/link";
import { usePermissions } from "@/hooks/usePermissions";

const DoctorsComponent = () => {
  const { userRole } = usePermissions();
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  
  const isAdmin = userRole === 'ADMIN';

  useEffect(() => {
    fetchDoctors();
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined' && (window as any).bootstrap && doctors.length > 0) {
      const dropdownElementList = document.querySelectorAll('[data-bs-toggle="dropdown"]');
      dropdownElementList.forEach((dropdownToggleEl) => {
        if (!(window as any).bootstrap.Dropdown.getInstance(dropdownToggleEl)) {
          new (window as any).bootstrap.Dropdown(dropdownToggleEl);
        }
      });
    }
  }, [doctors]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ doctors: Doctor[]; pagination: any }>('/api/doctors', {
        showErrorToast: true,
      });
      setDoctors(response.doctors);
    } catch (error) {
      console.error("Failed to fetch doctors:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchDoctors();
  };

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Doctors</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Doctors</li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              <Link
                href={all_routes.doctors}
                className="btn btn-icon btn-white active"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Grid"
                data-bs-original-title="Grid View"
              >
                <i className="ti ti-layout-grid" />
              </Link>
              <Link
                href={all_routes.allDoctorsList}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="List"
                data-bs-original-title="List View"
              >
                <i className="ti ti-layout-list" />
              </Link>
              <button
                onClick={handleRefresh}
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Refresh"
                data-bs-original-title="Refresh"
                disabled={loading}
              >
                <i className="ti ti-refresh" />
              </button>
              <Link
                href="#"
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Print"
                data-bs-original-title="Print"
              >
                <i className="ti ti-printer" />
              </Link>
              <Link
                href="#"
                className="btn btn-icon btn-white"
                data-bs-toggle="tooltip"
                data-bs-placement="top"
                aria-label="Download"
                data-bs-original-title="Download"
              >
                <i className="ti ti-cloud-download" />
              </Link>
              {isAdmin && (
                <Link href={all_routes.addDoctors} className="btn btn-primary">
                  <i className="ti ti-square-rounded-plus me-1" />
                  New Doctor
                </Link>
              )}
            </div>
          </div>

          {loading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: "400px" }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : doctors.length === 0 ? (
            <div className="alert alert-info">
              <i className="ti ti-info-circle me-2" />
              No doctors found. Click "New Doctor" to add one.
            </div>
          ) : (
            <div className="row row-gap-4 justify-content-center">
              {doctors.map((doctor) => (
                <div key={doctor._id} className="col-xxl-3 col-xl-4 col-lg-6 d-flex">
                  <div className="card shadow flex-fill w-100 mb-0">
                    <div className="card-body">
                      <div className="d-flex align-items-center justify-content-between mb-3">
                        <span className="badge badge-soft-primary">
                          #DR{doctor._id?.slice(-6).toUpperCase()}
                        </span>
                        <div className="dropdown">
                          <button
                            type="button"
                            className="btn btn-icon btn-outline-light border-0"
                            data-bs-toggle="dropdown"
                            data-bs-auto-close="true"
                            aria-label="Doctor actions menu"
                            aria-haspopup="true"
                            aria-expanded="false"
                          >
                            <i className="ti ti-dots-vertical" aria-hidden="true" />
                          </button>
                          <ul className="dropdown-menu p-2">
                            <li>
                              <Link
                                href={`${all_routes.doctorDetails}?id=${doctor._id}`}
                                className="dropdown-item d-flex align-items-center"
                              >
                                <i className="ti ti-eye me-1" />
                                View Details
                              </Link>
                            </li>
                            {isAdmin && (
                              <>
                                <li>
                                  <Link
                                    href={`${all_routes.editDoctors}?id=${doctor._id}`}
                                    className="dropdown-item d-flex align-items-center"
                                  >
                                    <i className="ti ti-edit me-1" />
                                    Edit
                                  </Link>
                                </li>
                                <li>
                                  <Link
                                    href="#"
                                    className="dropdown-item d-flex align-items-center"
                                    data-bs-toggle="modal"
                                    data-bs-target="#delete_modal"
                                  >
                                    <i className="ti ti-trash me-1" />
                                    Delete
                                  </Link>
                                </li>
                              </>
                            )}
                          </ul>
                        </div>
                      </div>
                      <div className="text-center mb-3">
                        <span className={`avatar avatar-xl ${doctor.isActive ? 'online' : 'offline'} avatar-rounded`}>
                          <Link href={`${all_routes.doctorDetails}?id=${doctor._id}`}>
                            <ImageWithBasePath
                              src={doctor.profile?.profileImage || "assets/img/doctors/doctor-01.jpg"}
                              alt={`Dr. ${doctor.firstName} ${doctor.lastName}`}
                            />
                          </Link>
                        </span>
                        <h6 className="mt-2 mb-1">
                          <Link href={`${all_routes.doctorDetails}?id=${doctor._id}`}>
                            Dr. {doctor.firstName} {doctor.lastName}
                          </Link>
                        </h6>
                        <span className="fs-14">
                          {doctor.profile?.specialization || "General Practitioner"}
                        </span>
                      </div>
                      <div className="border p-1 px-2 rounded mb-3">
                        <div className="row">
                          <div className="col-6 text-center py-2 border-end px-1">
                            <h6 className="fw-semibold fs-14 text-truncate">
                              Department
                            </h6>
                            <p className="fs-13 mb-0 text-truncate">
                              {doctor.profile?.department || "N/A"}
                            </p>
                          </div>
                          <div className="col-6 text-center py-2 px-1">
                            <h6 className="fw-semibold fs-14 text-truncate">
                              Status
                            </h6>
                            <p className="fs-13 mb-0">
                              <span className={`badge ${doctor.isActive ? 'badge-soft-success' : 'badge-soft-danger'}`}>
                                {doctor.isActive ? 'Active' : 'Inactive'}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                      <p className="mb-2 text-dark d-flex align-items-center text-truncate">
                        <i className="ti ti-mail me-1 text-body" />
                        {doctor.email}
                      </p>
                      <p className="mb-0 text-dark d-flex align-items-center">
                        <i className="ti ti-phone me-1 text-body" />
                        {doctor.phoneNumber}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <CommonFooter />
      </div>

      <>
        <div className="modal fade" id="delete_modal">
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content">
              <div className="modal-body text-center">
                <div className="mb-2">
                  <span className="avatar avatar-md rounded-circle bg-danger">
                    <i className="ti ti-trash fs-24" />
                  </span>
                </div>
                <h6 className="fs-16 mb-1">Confirm Deletion</h6>
                <p className="mb-3">Are you sure you want to delete this?</p>
                <div className="d-flex justify-content-center gap-2">
                  <Link
                    href="#"
                    className="btn btn-outline-light w-100"
                    data-bs-dismiss="modal"
                  >
                    Cancel
                  </Link>
                  <Link
                    href={all_routes.doctors}
                    className="btn btn-danger w-100"
                    data-bs-dismiss="modal"
                  >
                    Yes, Delete
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </>
    </>
  );
};

export default DoctorsComponent;
