"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import BranchSelect from "@/core/common-components/common-select/BranchSelect";
import { apiClient } from "@/lib/services/api-client";
import { Doctor } from "@/types/emr";

const EditDoctorsComponent = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const doctorId = searchParams.get("id");

  const [currentStep, setCurrentStep] = useState<"basic" | "extra">("basic");
  const [activatedSteps, setActivatedSteps] = useState<{ basic: boolean; extra: boolean }>({ 
    basic: false, 
    extra: false 
  });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    specialization: "",
    licenseNumber: "",
    department: "",
    bio: "",
    branchId: "",
    profileImage: "",
  });

  useEffect(() => {
    if (doctorId) {
      fetchDoctorData();
    } else {
      setLoading(false);
    }

    document.body.classList.remove('modal-open');
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach((el) => el.parentNode && el.parentNode.removeChild(el));
  }, [doctorId]);

  const fetchDoctorData = async () => {
    if (!doctorId) return;
    
    setLoading(true);
    try {
      const response = await apiClient.get<{ doctor: Doctor; upcomingAppointments: any[] }>(`/api/doctors/${doctorId}`, {
        showErrorToast: true,
      });

      setDoctor(response.doctor);
      const branchId = typeof response.doctor.branchId === 'object' && response.doctor.branchId?._id 
        ? response.doctor.branchId._id 
        : (typeof response.doctor.branchId === 'string' ? response.doctor.branchId : "");
      
      const profileImage = response.doctor.profile?.profileImage || "";
      setImagePreview(profileImage);
      
      setFormData({
        firstName: response.doctor.firstName || "",
        lastName: response.doctor.lastName || "",
        email: response.doctor.email || "",
        phoneNumber: response.doctor.phoneNumber || "",
        specialization: response.doctor.profile?.specialization || "",
        licenseNumber: response.doctor.profile?.licenseNumber || "",
        department: response.doctor.profile?.department || "",
        bio: response.doctor.profile?.bio || "",
        branchId: branchId,
        profileImage: profileImage,
      });
    } catch (error) {
      console.error("Failed to fetch doctor:", error);
      router.push(all_routes.allDoctorsList);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleBranchChange = (branchId: string) => {
    setFormData({ ...formData, branchId });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert("File size must be less than 5MB");
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData({ ...formData, profileImage: base64String });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setFormData({ ...formData, profileImage: "" });
  };

  const handleNext = () => {
    setActivatedSteps((prev) => ({ ...prev, basic: true }));
    setCurrentStep("extra");
  };

  const handleBack = () => {
    setActivatedSteps((prev) => ({ ...prev, extra: true }));
    setCurrentStep("basic");
  };

  const handleSubmit = async () => {
    if (!doctorId) return;

    setSubmitting(true);
    try {
      await apiClient.put(`/api/doctors/${doctorId}`, formData, {
        successMessage: "Doctor updated successfully",
      });
      router.push(all_routes.allDoctorsList);
    } catch (error) {
      console.error("Failed to update doctor:", error);
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    if (session && session.user?.role !== 'ADMIN') {
      router.push(all_routes.doctors);
    }
  }, [session, router]);

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

  if (!session) {
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

  if (session.user?.role !== 'ADMIN') {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger">
            <h4>Access Denied</h4>
            <p>Admin privileges are required to edit doctors. Redirecting to doctors list...</p>
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
              <h4 className="mb-1">Edit Doctor</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Edit Doctor</li>
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

          <div className="row patient-add vertical-tab">
            <div className="col-xl-3 col-lg-4">
              <div className="nav flex-column nav-pills" id="v-pills-tab">
                <button
                  className={`nav-link fw-medium d-flex align-items-center rounded ${
                    currentStep === "basic" ? "active" : activatedSteps.basic ? "activated" : ""
                  }`}
                  id="v-pills-info-tab"
                  type="button"
                  onClick={() => setCurrentStep("basic")}
                >
                  <span />
                  <i className="ti ti-info-circle fs-16" />
                  Basic Information
                </button>
                <button
                  className={`nav-link fw-medium d-flex align-items-center rounded ${
                    currentStep === "extra" ? "active" : activatedSteps.extra ? "activated" : ""
                  }`}
                  id="v-pills-vituals-tab"
                  type="button"
                  onClick={() => setCurrentStep("extra")}
                >
                  <span />
                  <i className="ti ti-vector-spline fs-16" />
                  Extra Information
                </button>
              </div>
            </div>

            <div className="col-xl-9 col-lg-8">
              <div className="patient-form-wizard flex-fill" id="v-pills-tabContent">
                {currentStep === "basic" && (
                  <div className="form-wizard-content active" id="v-pills-info">
                    <form onSubmit={(e) => { e.preventDefault(); handleNext(); }}>
                      <div className="card">
                        <div className="card-header">
                          <h5 className="mb-0">Basic Information</h5>
                        </div>
                        <div className="card-body">
                          <div className="mb-3">
                            <label className="form-label">
                              Profile Image
                            </label>
                            <div className="d-flex align-items-center flex-wrap gap-3">
                              <div className="flex-shrink-0">
                                <div className="position-relative d-flex align-items-center border rounded">
                                  {imagePreview ? (
                                    <img
                                      src={imagePreview}
                                      className="avatar avatar-xxl"
                                      alt="doctor"
                                      style={{ objectFit: 'cover' }}
                                    />
                                  ) : (
                                    <ImageWithBasePath
                                      src="assets/img/doctors/doctor-01.jpg"
                                      className="avatar avatar-xxl"
                                      alt="doctor"
                                    />
                                  )}
                                </div>
                              </div>
                              <div className="d-inline-flex flex-column align-items-start">
                                <div className="d-inline-flex align-items-start gap-2">
                                  <div className="drag-upload-btn btn btn-dark position-relative mb-2">
                                    <i className="ti ti-arrows-exchange-2 me-1" />
                                    Change Image
                                    <input
                                      type="file"
                                      className="form-control image-sign"
                                      accept="image/jpeg,image/png,image/gif"
                                      onChange={handleFileChange}
                                    />
                                  </div>
                                  <div>
                                    <button
                                      type="button"
                                      onClick={handleRemoveImage}
                                      className="btn btn-danger d-flex align-items-center gap-1"
                                    >
                                      <i className="ti ti-trash" /> Remove
                                    </button>
                                  </div>
                                </div>
                                <span className="fs-13 text-body">
                                  Use JPEG, PNG, or GIF. Best size: 200x200 pixels. Keep it under 5MB
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="row">
                            <div className="col-xl-4 col-md-6">
                              <div className="mb-3">
                                <label className="form-label">ID</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  value={`#DR${doctor._id?.slice(-6).toUpperCase()}`}
                                  disabled
                                />
                              </div>
                            </div>
                            <div className="col-xl-4 col-md-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  First Name<span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="firstName"
                                  value={formData.firstName}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>
                            </div>
                            <div className="col-xl-4 col-md-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Last Name<span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="lastName"
                                  value={formData.lastName}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>
                            </div>
                            <div className="col-xl-4 col-md-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Email<span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="email"
                                  className="form-control"
                                  name="email"
                                  value={formData.email}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>
                            </div>
                            <div className="col-xl-4 col-md-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Phone Number<span className="text-danger ms-1">*</span>
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="phoneNumber"
                                  value={formData.phoneNumber}
                                  onChange={handleInputChange}
                                  required
                                />
                              </div>
                            </div>
                            <div className="col-xl-4 col-md-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Specialization
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="specialization"
                                  value={formData.specialization}
                                  onChange={handleInputChange}
                                />
                              </div>
                            </div>
                            <div className="col-xl-4 col-md-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  License Number
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="licenseNumber"
                                  value={formData.licenseNumber}
                                  onChange={handleInputChange}
                                />
                              </div>
                            </div>
                            <div className="col-xl-4 col-md-6">
                              <div className="mb-3">
                                <label className="form-label">Department</label>
                                <input
                                  type="text"
                                  className="form-control"
                                  name="department"
                                  value={formData.department}
                                  onChange={handleInputChange}
                                />
                              </div>
                            </div>
                            <div className="col-xl-4 col-md-6">
                              <div className="mb-3">
                                <label className="form-label">
                                  Branch<span className="text-danger ms-1">*</span>
                                </label>
                                <BranchSelect
                                  value={formData.branchId}
                                  onChange={handleBranchChange}
                                  required
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-end flex-wrap align-items-center gap-2">
                        <Link href={all_routes.allDoctorsList} className="btn btn-outline-light">
                          Cancel
                        </Link>
                        <button
                          type="submit"
                          className="btn btn-primary next-tab-btn"
                        >
                          Save &amp; Next
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {currentStep === "extra" && (
                  <div className="form-wizard-content active" id="v-pills-vituals">
                    <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
                      <div className="card">
                        <div className="card-header">
                          <h5 className="mb-0">Additional Information</h5>
                        </div>
                        <div className="card-body">
                          <div className="row">
                            <div className="col-xl-12 col-md-12">
                              <div className="mb-0">
                                <label className="form-label">Bio/About</label>
                                <textarea
                                  className="form-control"
                                  rows={4}
                                  name="bio"
                                  value={formData.bio}
                                  onChange={handleInputChange}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="d-flex justify-content-end flex-wrap align-items-center gap-2">
                        <button
                          type="button"
                          className="btn btn-outline-light"
                          onClick={handleBack}
                        >
                          Back
                        </button>
                        <button
                          type="submit"
                          className="btn btn-primary"
                          disabled={submitting}
                        >
                          {submitting ? (
                            <>
                              <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                              Updating...
                            </>
                          ) : (
                            "Update Doctor"
                          )}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>
    </>
  );
};

export default EditDoctorsComponent;
