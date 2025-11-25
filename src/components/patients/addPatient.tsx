"use client";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  BloodGroup,
  City,
  Country,
  Department,
  Gender,
  HealthCondition,
  MartialStatus,
  PatientType,
  ReferredBy,
  State,
  Type,
} from "../../core/json/selectOption";
import { useState, useEffect } from "react";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonSelect from "@/core/common-components/common-select/commonSelect";
import CommonDatePicker from "@/core/common-components/common-date-picker/commonDatePicker";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import BranchSelect from "@/core/common-components/common-select/BranchSelect";
import NigerianLocationSelect from "@/core/common-components/common-select/NigerianLocationSelect";
import { apiClient } from "@/lib/services/api-client";
import dayjs, { Dayjs } from "dayjs";
import { PermissionGate } from "@/components/common/PermissionGate";
import { formatLocationName, getWardsForLGA } from "@/lib/utils/nigerian-locations";
import { toast } from "react-toastify";

interface Insurance {
  _id: string;
  name: string;
  isActive: boolean;
}

interface NextPatientIdResponse {
  nextPatientId: string;
}

interface CreatePatientResponse {
  success: boolean;
  patient: {
    _id: string;
    patientId: string;
    firstName: string;
    lastName: string;
  };
  message?: string;
}

const stepKeys = [
  "v-pills-info",
  "v-pills-vituals",
  "v-pills-medical-history",
  "v-pills-complaints",
];

const SubscriberRelationship = [
  { value: "Self", label: "Self" },
  { value: "Spouse", label: "Spouse" },
  { value: "Child", label: "Child" },
  { value: "Parent", label: "Parent" },
  { value: "Other", label: "Other" },
];

const AddPatientComponent = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [insuranceProviders, setInsuranceProviders] = useState<Array<{ value: string; label: string }>>([]);
  const [nextPatientId, setNextPatientId] = useState<string>('');
  const [loadingPatientId, setLoadingPatientId] = useState(false);

  const [formData, setFormData] = useState({
    firstName: "",
    middleName: "",
    lastName: "",
    bloodGroup: "",
    age: "",
    dateOfBirth: "",
    patientType: "",
    gender: "",
    companyName: "",
    maritalStatus: "",
    phoneNumber: "",
    emergencyNumber: "",
    guardianName: "",
    address: "",
    address2: "",
    country: "Nigeria",
    city: "",
    state: "",
    lga: "",
    ward: "",
    pincode: "",
    referredBy: "",
    referredOn: "",
    department: "",
    notes: "",
    allergies: [] as string[],
    chronicConditions: [] as string[],
    currentComplaints: "",
    branchId: "",
    insuranceId: "",
    policyNumber: "",
    groupNumber: "",
    subscriberName: "",
    subscriberRelationship: "",
    validFrom: "",
    validUntil: "",
  });

  const goToStep = (idx: number) => setCurrentStep(idx);
  const goNext = () =>
    setCurrentStep((prev) => Math.min(prev + 1, stepKeys.length - 1));
  const goBack = () => setCurrentStep((prev) => Math.max(prev - 1, 0));

  useEffect(() => {
    document.body.classList.remove('modal-open');
    const backdrops = document.querySelectorAll('.modal-backdrop');
    backdrops.forEach((el) => el.parentNode && el.parentNode.removeChild(el));
  }, []);

  useEffect(() => {
    if (!session) return;

    const fetchInsuranceProviders = async () => {
      try {
        const insurances = await apiClient.get("/api/insurance") as Insurance[];
        const activeInsurance = insurances.filter((ins) => ins.isActive);
        const insuranceOptions = activeInsurance.map((ins) => ({
          value: ins._id,
          label: ins.name,
        }));
        setInsuranceProviders(insuranceOptions);
      } catch (error) {
        console.error("Failed to fetch insurance providers:", error);
      }
    };

    fetchInsuranceProviders();
  }, [session]);

  useEffect(() => {
    const fetchNextPatientId = async () => {
      if (!formData.branchId) return;
      
      setLoadingPatientId(true);
      try {
        const response = await apiClient.get(`/api/patients/next-id?branchId=${formData.branchId}`) as NextPatientIdResponse;
        setNextPatientId(response.nextPatientId);
      } catch (error) {
        console.error("Failed to fetch next patient ID:", error);
        setNextPatientId('');
      } finally {
        setLoadingPatientId(false);
      }
    };

    fetchNextPatientId();
  }, [formData.branchId]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: { value: string; label: string } | string | null) => {
    setFormData({ ...formData, [name]: value && typeof value === 'object' ? value.value : value || '' });
  };

  const handleDateChange = (name: string, date: Dayjs | null) => {
    if (date) {
      setFormData({ ...formData, [name]: date.format('YYYY-MM-DD') });
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      if (formData.ward && formData.state && formData.lga) {
        const wardsForLGA = getWardsForLGA(formData.state, formData.lga);
        const wardExists = wardsForLGA.some(w => w.value === formData.ward);
        
        if (!wardExists) {
          alert("Selected ward does not belong to the chosen LGA. Please reselect the ward.");
          setLoading(false);
          return;
        }
      }

      const branchId = formData.branchId || 
        (session?.user?.branch 
          ? (typeof session.user.branch === 'object' ? session.user.branch._id : session.user.branch)
          : null);

      if (!branchId) {
        throw new Error("Branch information not found");
      }

      const patientData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        middleName: formData.middleName,
        dateOfBirth: formData.dateOfBirth || undefined,
        age: formData.age ? parseInt(formData.age) : undefined,
        gender: formData.gender,
        bloodGroup: formData.bloodGroup || undefined,
        maritalStatus: formData.maritalStatus,
        patientType: formData.patientType,
        companyName: formData.companyName,
        referredBy: formData.referredBy,
        referredOn: formData.referredOn,
        department: formData.department,
        phoneNumber: formData.phoneNumber,
        address: formData.address,
        address2: formData.address2,
        city: formatLocationName(formData.lga) || formatLocationName(formData.city),
        state: formData.state ? formatLocationName(formData.state) : undefined,
        lga: formData.lga ? formatLocationName(formData.lga) : undefined,
        ward: formData.ward ? formatLocationName(formData.ward) : undefined,
        country: formData.country || "Nigeria",
        zipCode: formData.pincode,
        emergencyContact: {
          name: formData.guardianName,
          relationship: "Guardian",
          phoneNumber: formData.emergencyNumber,
        },
        allergies: formData.allergies,
        chronicConditions: formData.chronicConditions,
        notes: formData.notes,
        chiefComplaint: formData.currentComplaints,
        branchId: branchId,
        insurance: formData.insuranceId ? {
          insuranceId: formData.insuranceId,
          policyNumber: formData.policyNumber,
          groupNumber: formData.groupNumber,
          subscriberName: formData.subscriberName || `${formData.firstName} ${formData.lastName}`,
          subscriberRelationship: formData.subscriberRelationship || 'Self',
          validFrom: formData.validFrom,
          validUntil: formData.validUntil
        } : undefined
      };

      const response = await apiClient.post("/api/patients", patientData) as CreatePatientResponse;
      const successMsg = `Patient added successfully! Patient ID: ${response.patient?.patientId || ''}`;
      toast.success(successMsg);

      router.push(all_routes.allPatientsList);
    } catch (error) {
      console.error("Failed to add patient:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PermissionGate required="patient:create" fallback={
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger" role="alert">
            <i className="ti ti-alert-circle me-2"></i>
            You do not have permission to create patients.
          </div>
        </div>
        <CommonFooter />
      </div>
    }>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Patients</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Add Patient</li>
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

          <div className="row vertical-tab">
            <div className="col-xl-3 col-lg-4">
              <div className="nav flex-column nav-pills vertical-tab mb-lg-0 mb-4" id="v-pills-tab">
                <button
                  className={`nav-link fw-medium d-flex align-items-center rounded${
                    currentStep === 0
                      ? " active"
                      : currentStep > 0
                      ? " activated"
                      : ""
                  }`}
                  id="v-pills-info-tab"
                  onClick={() => goToStep(0)}
                  type="button"
                >
                  <span />
                  <i className="ti ti-info-circle fs-16" />
                  Basic Information
                </button>
                <button
                  className={`nav-link fw-medium d-flex align-items-center rounded${
                    currentStep === 1
                      ? " active"
                      : currentStep > 1
                      ? " activated"
                      : ""
                  }`}
                  id="v-pills-medical-history-tab"
                  onClick={() => goToStep(1)}
                  type="button"
                >
                  <span />
                  <i className="ti ti-files fs-16" />
                  Medical History
                </button>
                <button
                  className={`nav-link fw-medium d-flex align-items-center rounded${
                    currentStep === 2
                      ? " active"
                      : currentStep > 2
                      ? " activated"
                      : ""
                  }`}
                  id="v-pills-complaints-tab"
                  onClick={() => goToStep(2)}
                  type="button"
                >
                  <span />
                  <i className="ti ti-vaccine fs-16" />
                  Complaints
                </button>
              </div>
            </div>
            <div className="col-xl-9 col-lg-8">
              <div
                className="patient-form-wizard flex-fill"
                id="v-pills-tabContent"
              >
                {/* Basic Information */}
                <div
                  className={`form-wizard-content${
                    currentStep === 0 ? " active" : " d-none"
                  }`}
                  id="v-pills-info"
                >
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Basic Information</h5>
                    </div>
                    <div className="card-body pb-1">
                      <div className="row">
                        <div className="col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Patient ID</label>
                            <input
                              type="text"
                              className="form-control"
                              value={loadingPatientId ? 'Loading...' : (nextPatientId || 'Select branch first')}
                              disabled
                            />
                          </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Branch<span className="text-danger ms-1">*</span>
                            </label>
                            <BranchSelect
                              value={formData.branchId}
                              onChange={(value) => setFormData({ ...formData, branchId: value })}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
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
                        <div className="col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Middle Name</label>
                            <input
                              type="text"
                              className="form-control"
                              name="middleName"
                              value={formData.middleName}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
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
                        <div className="col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Blood Group</label>
                            <CommonSelect
                              options={BloodGroup}
                              className="select"
                              onChange={(val: any) => handleSelectChange("bloodGroup", val)}
                            />
                          </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">DOB</label>
                            <CommonDatePicker
                              placeholder="dd/mm/yyyy"
                              onChange={(date) => handleDateChange("dateOfBirth", date)}
                            />
                          </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Gender<span className="text-danger ms-1">*</span>
                            </label>
                            <CommonSelect
                              options={Gender}
                              className="select"
                              onChange={(val: any) => handleSelectChange("gender", val)}
                            />
                          </div>
                        </div>
                        <div className="col-xl-3 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Marital Status</label>
                            <CommonSelect
                              options={MartialStatus}
                              className="select"
                              onChange={(val: any) => handleSelectChange("maritalStatus", val)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Contact Information</h5>
                    </div>
                    <div className="card-body pb-1">
                      <div className="row">
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Mobile Number<span className="text-danger ms-1">*</span>
                            </label>
                            <input
                              className="form-control"
                              name="phoneNumber"
                              type="tel"
                              value={formData.phoneNumber}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Emergency Number<span className="text-danger ms-1">*</span>
                            </label>
                            <input
                              className="form-control"
                              name="emergencyNumber"
                              type="text"
                              value={formData.emergencyNumber}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Guardian / Person Name<span className="text-danger ms-1">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="guardianName"
                              value={formData.guardianName}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Address<span className="text-danger ms-1">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="address"
                              value={formData.address}
                              onChange={handleInputChange}
                              required
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Address Line 2</label>
                            <input
                              type="text"
                              className="form-control"
                              name="address2"
                              value={formData.address2}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                        <div className="col-12">
                          <div className="mb-3">
                            <NigerianLocationSelect
                              stateValue={formData.state}
                              lgaValue={formData.lga}
                              wardValue={formData.ward}
                              onStateChange={(value) => setFormData(prev => ({ ...prev, state: value, lga: '', ward: '' }))}
                              onLGAChange={(value) => setFormData(prev => ({ ...prev, lga: value, ward: '' }))}
                              onWardChange={(value) => setFormData(prev => ({ ...prev, ward: value }))}
                              stateRequired={false}
                              showLabels={true}
                            />
                          </div>
                        </div>
                        <div className="col-xl-6 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">
                              Country<span className="text-danger ms-1">*</span>
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              name="country"
                              value={formData.country}
                              disabled
                            />
                          </div>
                        </div>
                        <div className="col-xl-6 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Pincode</label>
                            <input
                              type="text"
                              className="form-control"
                              name="pincode"
                              value={formData.pincode}
                              onChange={handleInputChange}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Insurance Information</h5>
                    </div>
                    <div className="card-body pb-1">
                      <div className="row">
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Insurance Provider</label>
                            <CommonSelect
                              options={insuranceProviders}
                              className="select"
                              onChange={(val: any) => handleSelectChange("insuranceId", val)}
                              placeholder="Select Insurance Provider"
                            />
                          </div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Policy/Insurance Number</label>
                            <input
                              type="text"
                              className="form-control"
                              name="policyNumber"
                              value={formData.policyNumber}
                              onChange={handleInputChange}
                              placeholder="Enter policy number"
                            />
                          </div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Group Number</label>
                            <input
                              type="text"
                              className="form-control"
                              name="groupNumber"
                              value={formData.groupNumber}
                              onChange={handleInputChange}
                              placeholder="Enter group number (optional)"
                            />
                          </div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Subscriber Name</label>
                            <input
                              type="text"
                              className="form-control"
                              name="subscriberName"
                              value={formData.subscriberName}
                              onChange={handleInputChange}
                              placeholder="Defaults to patient name"
                            />
                          </div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Subscriber Relationship</label>
                            <CommonSelect
                              options={SubscriberRelationship}
                              className="select"
                              onChange={(val: any) => handleSelectChange("subscriberRelationship", val)}
                              placeholder="Select relationship"
                            />
                          </div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Valid From</label>
                            <CommonDatePicker
                              placeholder="dd/mm/yyyy"
                              onChange={(date) => handleDateChange("validFrom", date)}
                            />
                          </div>
                        </div>
                        <div className="col-xl-4 col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Valid Until</label>
                            <CommonDatePicker
                              placeholder="dd/mm/yyyy"
                              onChange={(date) => handleDateChange("validUntil", date)}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-end flex-wrap align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={goNext}
                    >
                      Next: Medical History
                    </button>
                  </div>
                </div>

                {/* Medical History */}
                <div
                  className={`form-wizard-content${
                    currentStep === 1 ? " active" : " d-none"
                  }`}
                  id="v-pills-medical-history"
                >
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Medical History</h5>
                    </div>
                    <div className="card-body pb-1">
                      <div className="row">
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Allergies (comma separated)</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g., Penicillin, Peanuts"
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  allergies: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                                })
                              }
                            />
                          </div>
                        </div>
                        <div className="col-md-6">
                          <div className="mb-3">
                            <label className="form-label">Chronic Conditions (comma separated)</label>
                            <input
                              type="text"
                              className="form-control"
                              placeholder="e.g., Diabetes, Hypertension"
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  chronicConditions: e.target.value.split(',').map(s => s.trim()).filter(Boolean),
                                })
                              }
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between flex-wrap align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={goBack}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={goNext}
                    >
                      Next: Complaints
                    </button>
                  </div>
                </div>

                {/* Complaints */}
                <div
                  className={`form-wizard-content${
                    currentStep === 2 ? " active" : " d-none"
                  }`}
                  id="v-pills-complaints"
                >
                  <div className="card">
                    <div className="card-header">
                      <h5 className="mb-0">Current Complaints</h5>
                    </div>
                    <div className="card-body pb-1">
                      <div className="row">
                        <div className="col-md-12">
                          <div className="mb-3">
                            <label className="form-label">Complaints / Notes</label>
                            <textarea
                              rows={4}
                              className="form-control"
                              name="currentComplaints"
                              value={formData.currentComplaints}
                              onChange={handleInputChange}
                              placeholder="Enter current complaints or notes..."
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="d-flex justify-content-between flex-wrap align-items-center gap-2">
                    <button
                      type="button"
                      className="btn btn-secondary"
                      onClick={goBack}
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      className="btn btn-primary"
                      onClick={handleSubmit}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                          Saving...
                        </>
                      ) : (
                        'Save Patient'
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <CommonFooter />
      </div>
    </PermissionGate>
  );
};

export default AddPatientComponent;
