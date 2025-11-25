"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import dayjs, { Dayjs } from "dayjs";
import {
  City,
  Country,
  Department,
  Gender,
  Languages,
  Specialist,
  State,
} from "../../core/json/selectOption";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonSelect from "@/core/common-components/common-select/commonSelect";
import CommonDatePicker from "@/core/common-components/common-date-picker/commonDatePicker";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import BranchSelect from "@/core/common-components/common-select/BranchSelect";
import { apiClient } from "@/lib/services/api-client";

const AddDoctorsComponent = () => {
  const { data: session } = useSession();
  const router = useRouter();

  const [step, setStep] = useState<'basic' | 'extra'>('basic');
  const [activatedSteps, setActivatedSteps] = useState<{ basic: boolean; extra: boolean }>({ basic: false, extra: false });
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState<{
    firstName: string;
    lastName: string;
    email: string;
    password: string;
    confirmPassword: string;
    phoneNumber: string;
    specialization: string;
    licenseNumber: string;
    department: string;
    bio: string;
    profileImage: string;
    branchId: string;
    gender: string;
    dob: Dayjs | null;
    languages: string;
    fees: string;
    address: string;
    country: string;
    state: string;
    city: string;
    pinCode: string;
    displayName: string;
    userName: string;
  }>({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phoneNumber: "",
    specialization: "",
    licenseNumber: "",
    department: "",
    bio: "",
    profileImage: "",
    branchId: "",
    gender: "",
    dob: null,
    languages: "",
    fees: "",
    address: "",
    country: "",
    state: "",
    city: "",
    pinCode: "",
    displayName: "",
    userName: "",
  });

  const goToBasic = () => setStep('basic');
  
  const goToExtra = () => {
    if (validateBasicInfo()) {
      setActivatedSteps((prev) => ({ ...prev, basic: true }));
      setStep('extra');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleSelectChange = (name: string, value: any) => {
    if (name === 'dob') {
      setFormData({ ...formData, [name]: value });
    } else {
      setFormData({ ...formData, [name]: value?.value || value });
    }
    if (errors[name]) {
      setErrors({ ...errors, [name]: "" });
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrors({ ...errors, profileImage: "File size must be less than 5MB" });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setImagePreview(base64String);
        setFormData({ ...formData, profileImage: base64String });
        setErrors({ ...errors, profileImage: "" });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview("");
    setFormData({ ...formData, profileImage: "" });
  };

  const validateBasicInfo = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.firstName.trim()) newErrors.firstName = "First name is required";
    if (!formData.lastName.trim()) newErrors.lastName = "Last name is required";
    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Invalid email format";
    }
    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required";
    if (!formData.branchId) newErrors.branchId = "Branch is required";
    if (!formData.department) newErrors.department = "Department is required";
    if (!formData.specialization) newErrors.specialization = "Specialization is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateBasicInfo()) {
      setStep('basic');
      return;
    }

    setLoading(true);
    try {
      const branchId = formData.branchId || 
        (session?.user?.branch 
          ? (typeof session.user.branch === 'object' ? session.user.branch._id : session.user.branch)
          : null);

      if (!branchId) {
        throw new Error("Branch information not found");
      }

      const doctorData = {
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        phoneNumber: formData.phoneNumber,
        branchId: branchId,
        specialization: formData.specialization,
        licenseNumber: formData.licenseNumber,
        department: formData.department,
        bio: formData.bio,
        profileImage: formData.profileImage,
        ...(formData.dob && { dob: formData.dob.toISOString() }),
      };

      await apiClient.post("/api/doctors", doctorData, {
        successMessage: "Doctor added successfully",
      });

      router.push(all_routes.allDoctorsList);
    } catch (error) {
      console.error("Failed to add doctor:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.body.classList.remove('modal-open');
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach((el) => el.parentNode && el.parentNode.removeChild(el));
  }, []);

  const handleModalNavigation = () => {
    const modal = document.getElementById("success_modal");
    if (modal) {
      const bsModal = (window as any).bootstrap?.Modal?.getInstance(modal) || new (window as any).bootstrap.Modal(modal);
      bsModal.hide();
      
      const backdrop = document.querySelector('.modal-backdrop');
      if (backdrop) {
        backdrop.remove();
      }
      
      document.body.classList.remove('modal-open');
      document.body.style.overflow = '';
      document.body.style.paddingRight = '';
    }
  };

  useEffect(() => {
    if (session && session.user?.role !== 'ADMIN') {
      router.push(all_routes.doctors);
    }
  }, [session, router]);

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
            <p>Admin privileges are required to add doctors. Redirecting to doctors list...</p>
          </div>
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
              <h4 className="mb-1">Add Doctors</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Add Doctors</li>
                </ol>
              </div>
            </div>
            <div className="gap-2 d-flex align-items-center flex-wrap">
              <Link
                href={all_routes.doctors}
                className="fw-medium d-flex align-items-center"
              >
                <i className="ti ti-arrow-left me-1" />
                Back to Doctors
              </Link>
            </div>
          </div>

          <div className="row row-gap-3 vertical-tab">
            <div className="col-xl-3 col-lg-4">
              <div className="nav flex-column nav-pills" id="v-pills-tab">
                <button
                  className={`nav-link fw-medium d-flex align-items-center rounded${step === 'basic' ? ' active' : activatedSteps.basic ? ' activated' : ''}`}
                  id="v-pills-info-tab"
                  type="button"
                  onClick={goToBasic}
                >
                  <span />
                  <i className="ti ti-info-circle fs-16" />
                  Basic Information
                </button>
                <button
                  className={`nav-link fw-medium d-flex align-items-center rounded${step === 'extra' ? ' active' : activatedSteps.extra ? ' activated' : ''}`}
                  id="v-pills-vituals-tab"
                  type="button"
                  onClick={goToExtra}
                >
                  <span />
                  <i className="ti ti-vector-spline fs-16" />
                  Extra Information
                </button>
              </div>
            </div>

            <div className="col-xl-9 col-lg-8">
              <div className="patient-form-wizard flex-fill" id="v-pills-tabContent">
                <>
                  {step === 'basic' && (
                    <div className="form-wizard-content active" id="v-pills-info">
                      <form onSubmit={e => { e.preventDefault(); goToExtra(); }}>
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
                                  {errors.profileImage && (
                                    <span className="text-danger fs-13">{errors.profileImage}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="row">
                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label" htmlFor="doctor-id">ID</label>
                                  <input type="text" className="form-control" id="doctor-id" defaultValue="#DR0005" disabled />
                                </div>
                              </div>

                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">
                                    Branch<span className="text-danger ms-1">*</span>
                                  </label>
                                  <BranchSelect
                                    value={formData.branchId}
                                    onChange={(value) => handleSelectChange('branchId', value)}
                                    required
                                  />
                                  {errors.branchId && (
                                    <span className="text-danger fs-13">{errors.branchId}</span>
                                  )}
                                </div>
                              </div>

                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label" htmlFor="doctor-first-name">
                                    First Name<span className="text-danger ms-1">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    id="doctor-first-name"
                                    name="firstName"
                                    value={formData.firstName}
                                    onChange={handleInputChange}
                                  />
                                  {errors.firstName && (
                                    <span className="text-danger fs-13">{errors.firstName}</span>
                                  )}
                                </div>
                              </div>

                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label" htmlFor="doctor-last-name">
                                    Last Name<span className="text-danger ms-1">*</span>
                                  </label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    id="doctor-last-name"
                                    name="lastName"
                                    value={formData.lastName}
                                    onChange={handleInputChange}
                                  />
                                  {errors.lastName && (
                                    <span className="text-danger fs-13">{errors.lastName}</span>
                                  )}
                                </div>
                              </div>

                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">
                                    Department<span className="text-danger ms-1">*</span>
                                  </label>
                                  <CommonSelect
                                    options={Department}
                                    className="select"
                                    value={Department.find(opt => opt.value === formData.department)}
                                    onChange={(option: any) => handleSelectChange('department', option)}
                                  />
                                  {errors.department && (
                                    <span className="text-danger fs-13">{errors.department}</span>
                                  )}
                                </div>
                              </div>

                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">
                                    Specialist<span className="text-danger ms-1">*</span>
                                  </label>
                                  <CommonSelect
                                    options={Specialist}
                                    className="select"
                                    value={Specialist.find(opt => opt.value === formData.specialization)}
                                    onChange={(option: any) => handleSelectChange('specialization', option)}
                                  />
                                  {errors.specialization && (
                                    <span className="text-danger fs-13">{errors.specialization}</span>
                                  )}
                                </div>
                              </div>

                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Fees ($)</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    name="fees"
                                    value={formData.fees}
                                    onChange={handleInputChange}
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
                                  />
                                  {errors.phoneNumber && (
                                    <span className="text-danger fs-13">{errors.phoneNumber}</span>
                                  )}
                                </div>
                              </div>

                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">
                                    Email Address<span className="text-danger ms-1">*</span>
                                  </label>
                                  <input
                                    type="email"
                                    className="form-control"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                  />
                                  {errors.email && (
                                    <span className="text-danger fs-13">{errors.email}</span>
                                  )}
                                </div>
                              </div>

                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">DOB</label>
                                  <div className="w-auto input-group-flat">
                                    <CommonDatePicker
                                      placeholder="dd/mm/yyyy"
                                      value={formData.dob}
                                      onChange={(date: any) => handleSelectChange('dob', date)}
                                    />
                                  </div>
                                </div>
                              </div>

                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Gender</label>
                                  <CommonSelect
                                    options={Gender}
                                    className="select"
                                    value={Gender.find(opt => opt.value === formData.gender)}
                                    onChange={(option: any) => handleSelectChange('gender', option)}
                                  />
                                </div>
                              </div>

                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">License Number</label>
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
                                  <label className="form-label">Known Languages</label>
                                  <CommonSelect
                                    options={Languages}
                                    className="select"
                                    value={Languages.find(opt => opt.value === formData.languages)}
                                    onChange={(option: any) => handleSelectChange('languages', option)}
                                  />
                                </div>
                              </div>

                              <div className="col-xl-12 col-md-12">
                                <div className="mb-0">
                                  <label className="form-label">About</label>
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

                        <div className="card">
                          <div className="card-header">
                            <h5 className="mb-0">Address Information</h5>
                          </div>
                          <div className="card-body pb-1">
                            <div className="row">
                              <div className="col-xl-12 col-md-12">
                                <div className="mb-3">
                                  <label className="form-label">Address</label>
                                  <input
                                    className="form-control"
                                    name="address"
                                    type="text"
                                    value={formData.address}
                                    onChange={handleInputChange}
                                  />
                                </div>
                              </div>

                              <div className="col-xl-3 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Country</label>
                                  <CommonSelect
                                    options={Country}
                                    className="select"
                                    value={Country.find(opt => opt.value === formData.country)}
                                    onChange={(option: any) => handleSelectChange('country', option)}
                                  />
                                </div>
                              </div>

                              <div className="col-xl-3 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">State</label>
                                  <CommonSelect
                                    options={State}
                                    className="select"
                                    value={State.find(opt => opt.value === formData.state)}
                                    onChange={(option: any) => handleSelectChange('state', option)}
                                  />
                                </div>
                              </div>

                              <div className="col-xl-3 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">City</label>
                                  <CommonSelect
                                    options={City}
                                    className="select"
                                    value={City.find(opt => opt.value === formData.city)}
                                    onChange={(option: any) => handleSelectChange('city', option)}
                                  />
                                </div>
                              </div>

                              <div className="col-xl-3 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Pin Code</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    name="pinCode"
                                    value={formData.pinCode}
                                    onChange={handleInputChange}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="card">
                          <div className="card-header">
                            <h5 className="mb-0">Account Details</h5>
                          </div>
                          <div className="card-body pb-1">
                            <div className="row">
                              <div className="col-xl-3 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Display Name</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    name="displayName"
                                    value={formData.displayName}
                                    onChange={handleInputChange}
                                  />
                                </div>
                              </div>

                              <div className="col-xl-3 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">User Name</label>
                                  <input
                                    type="text"
                                    className="form-control"
                                    name="userName"
                                    value={formData.userName}
                                    onChange={handleInputChange}
                                  />
                                </div>
                              </div>

                              <div className="col-xl-3 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">
                                    Password<span className="text-danger ms-1">*</span>
                                  </label>
                                  <input
                                    type="password"
                                    className="form-control"
                                    name="password"
                                    value={formData.password}
                                    onChange={handleInputChange}
                                  />
                                  {errors.password && (
                                    <span className="text-danger fs-13">{errors.password}</span>
                                  )}
                                </div>
                              </div>

                              <div className="col-xl-3 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">
                                    Confirm Password<span className="text-danger ms-1">*</span>
                                  </label>
                                  <input
                                    type="password"
                                    className="form-control"
                                    name="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={handleInputChange}
                                  />
                                  {errors.confirmPassword && (
                                    <span className="text-danger fs-13">{errors.confirmPassword}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="d-flex justify-content-end flex-wrap align-items-center gap-2">
                          <Link href={all_routes.doctors} className="btn btn-white">
                            Cancel
                          </Link>
                          <button
                            type="submit"
                            className="btn btn-primary next-tab-btn"
                            id="save-basic-info"
                          >
                            Save &amp; Next
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  {step === 'extra' && (
                    <div className="form-wizard-content active" id="v-pills-vituals">
                      <form onSubmit={e => e.preventDefault()}>
                        <div className="card">
                          <div className="card-header">
                            <h5 className="mb-0">Educational Details</h5>
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Institute Name</label>
                                  <input type="text" className="form-control" defaultValue="" />
                                </div>
                              </div>
                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Qualification</label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Year</label>
                                  <div className="w-auto input-group-flat">
                                    <CommonDatePicker placeholder="dd/mm/yyyy" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Link href="#" className="text-primary d-linline-flex align-items-center gap-1 fw-medium">
                              <i className="ti ti-plus" /> Add More
                            </Link>
                          </div>
                        </div>

                        <div className="card">
                          <div className="card-header">
                            <h5 className="mb-0">Experience</h5>
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Hospital Name</label>
                                  <input type="text" className="form-control" defaultValue="" />
                                </div>
                              </div>
                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">No of Years</label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Year</label>
                                  <div className="w-auto input-group-flat">
                                    <CommonDatePicker placeholder="dd/mm/yyyy" />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <Link href="#" className="text-primary d-linline-flex align-items-center gap-1 fw-medium">
                              <i className="ti ti-plus" /> Add More
                            </Link>
                          </div>
                        </div>

                        <div className="card">
                          <div className="card-header">
                            <h5 className="mb-0">Social Media</h5>
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-xl-3 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Facebook</label>
                                  <input type="text" className="form-control" defaultValue="" />
                                </div>
                              </div>
                              <div className="col-xl-3 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Twitter</label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                              <div className="col-xl-3 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Linkedin</label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                              <div className="col-xl-3 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Instagram</label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="card">
                          <div className="card-header">
                            <h5 className="mb-0">Membership</h5>
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Title</label>
                                  <input type="text" className="form-control" defaultValue="" />
                                </div>
                              </div>
                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Year</label>
                                  <div className="w-auto input-group-flat">
                                    <CommonDatePicker placeholder="dd/mm/yyyy" />
                                  </div>
                                </div>
                              </div>
                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Description</label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                            </div>
                            <Link href="#" className="text-primary d-linline-flex align-items-center gap-1 fw-medium">
                              <i className="ti ti-plus" /> Add More
                            </Link>
                          </div>
                        </div>

                        <div className="card mb-0">
                          <div className="card-header">
                            <h5 className="mb-0">Awards</h5>
                          </div>
                          <div className="card-body">
                            <div className="row">
                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Title</label>
                                  <input type="text" className="form-control" defaultValue="" />
                                </div>
                              </div>
                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Year</label>
                                  <div className="w-auto input-group-flat">
                                    <CommonDatePicker placeholder="dd/mm/yyyy" />
                                  </div>
                                </div>
                              </div>
                              <div className="col-xl-4 col-md-6">
                                <div className="mb-3">
                                  <label className="form-label">Description</label>
                                  <input type="text" className="form-control" />
                                </div>
                              </div>
                            </div>
                            <Link href="#" className="text-primary d-linline-flex align-items-center gap-1 fw-medium">
                              <i className="ti ti-plus" /> Add More
                            </Link>
                          </div>
                        </div>

                        <div className="d-flex justify-content-end flex-wrap align-items-center gap-2 mt-3">
                          <button type="button" className="btn btn-white back-btn" onClick={goToBasic}>
                            Back
                          </button>
                          <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={loading}
                            className="btn btn-primary"
                          >
                            {loading ? 'Saving...' : 'Save & Confirm'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </>
              </div>
            </div>
          </div>
        </div>

        <CommonFooter />
      </div>

      <div className="modal fade" id="success_modal">
        <div className="modal-dialog modal-dialog-centered modal-sm">
          <div className="modal-content">
            <div className="modal-body text-center position-relative">
              <div className="mb-2 position-relative z-1">
                <span className="avatar avatar-md bg-success rounded-circle">
                  <i className="ti ti-calendar-check fs-24" />
                </span>
              </div>
              <h5 className="mb-1">Added Successfully</h5>
              <p className="mb-4">
                Doctor has been added to the Doctor List
              </p>
              <div className="d-flex justify-content-center gap-2">
                <Link
                  href={all_routes.doctors}
                  className="btn btn-outline-light position-relative z-1 w-100"
                  onClick={handleModalNavigation}
                >
                  Back To List
                </Link>
                <Link
                  href={all_routes.doctorDetails}
                  className="btn btn-primary position-relative z-1 w-100"
                  onClick={handleModalNavigation}
                >
                  View Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddDoctorsComponent;
