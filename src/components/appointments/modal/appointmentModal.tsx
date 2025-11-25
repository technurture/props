"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import dayjs, { Dayjs } from "dayjs";
import { Consultation, ModePayment, PatientType, SelectDepartment } from "../../../core/json/selectOption";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import { all_routes } from "@/router/all_routes";
import CommonSelect from "@/core/common-components/common-select/commonSelect";
import CommonTimePicker from "@/core/common-components/common-time-pickers/CommonTimePicker";
import CommonDatePicker from "@/core/common-components/common-date-picker/commonDatePicker";
import { apiClient } from "@/lib/services/api-client";
import { toast } from "react-toastify";

interface AppointmentModalProps {
  onSuccess: () => void;
  selectedAppointment?: any;
  editAppointmentId?: string | null;
}

interface PatientOption {
  value: string;
  label: string;
}

interface DoctorOption {
  value: string;
  label: string;
}

interface PatientsResponse {
  patients: Array<{
    _id: string;
    firstName: string;
    lastName: string;
    patientId: string;
  }>;
}

interface DoctorsResponse {
  doctors: Array<{
    _id: string;
    firstName: string;
    lastName: string;
  }>;
}

interface AppointmentResponse {
  appointment: {
    appointmentNumber: string;
    patientId: { _id: string } | string;
    doctorId: { _id: string } | string;
    type?: string;
    appointmentDate: string;
    appointmentTime: string;
    duration: number;
    reasonForVisit: string;
    notes?: string;
  };
}

const AppointmentModal = ({ onSuccess, selectedAppointment, editAppointmentId }: AppointmentModalProps) => {
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [patients, setPatients] = useState<PatientOption[]>([]);
  const [doctors, setDoctors] = useState<DoctorOption[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  const [formData, setFormData] = useState({
    appointmentNumber: `APT${Date.now().toString().slice(-6)}`,
    patientId: "",
    patientType: "",
    department: "",
    doctorId: "",
    consultationType: "CONSULTATION",
    appointmentDate: "",
    startTime: "",
    endTime: "",
    reasonForVisit: "",
    notes: "",
    modeOfPayment: "",
  });

  const [editData, setEditData] = useState<any>(null);

  useEffect(() => {
    fetchPatientsAndDoctors();
  }, []);

  useEffect(() => {
    if (editAppointmentId) {
      fetchAppointmentDetails(editAppointmentId);
    } else {
      resetForm();
    }
  }, [editAppointmentId]);

  const fetchPatientsAndDoctors = async () => {
    try {
      const [patientsRes, doctorsRes] = await Promise.all([
        apiClient.get<PatientsResponse>('/api/patients?limit=1000'),
        apiClient.get<DoctorsResponse>('/api/doctors?limit=1000')
      ]);

      const patientOptions = patientsRes.patients?.map((patient) => ({
        value: patient._id,
        label: `${patient.firstName} ${patient.lastName} (${patient.patientId})`
      })) || [];

      const doctorOptions = doctorsRes.doctors?.map((doctor) => ({
        value: doctor._id,
        label: `Dr. ${doctor.firstName} ${doctor.lastName}`
      })) || [];

      setPatients(patientOptions);
      setDoctors(doctorOptions);
    } catch (error) {
      console.error("Failed to fetch patients/doctors:", error);
    }
  };

  const fetchAppointmentDetails = async (id: string) => {
    setLoadingData(true);
    try {
      const response = await apiClient.get<AppointmentResponse>(`/api/appointments/${id}`);
      const appointment = response.appointment;
      
      setEditData(appointment);
      
      const appointmentDate = new Date(appointment.appointmentDate);
      const endTime = calculateEndTime(appointment.appointmentTime, appointment.duration);

      setFormData({
        appointmentNumber: appointment.appointmentNumber,
        patientId: typeof appointment.patientId === 'string' ? appointment.patientId : appointment.patientId._id,
        patientType: "",
        department: "",
        doctorId: typeof appointment.doctorId === 'string' ? appointment.doctorId : appointment.doctorId._id,
        consultationType: appointment.type || "CONSULTATION",
        appointmentDate: appointmentDate.toISOString().split('T')[0],
        startTime: appointment.appointmentTime,
        endTime: endTime,
        reasonForVisit: appointment.reasonForVisit,
        notes: appointment.notes || "",
        modeOfPayment: "",
      });
    } catch (error) {
      console.error("Failed to fetch appointment details:", error);
      toast.error("Failed to load appointment details");
    } finally {
      setLoadingData(false);
    }
  };

  const calculateEndTime = (startTime: string, durationMinutes: number): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const totalMinutes = hours * 60 + minutes + durationMinutes;
    const endHours = Math.floor(totalMinutes / 60) % 24;
    const endMinutes = totalMinutes % 60;
    return `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  };

  const calculateDuration = (startTime: string, endTime: string): number => {
    if (!startTime || !endTime) return 30;
    
    const [startHours, startMinutes] = startTime.split(':').map(Number);
    const [endHours, endMinutes] = endTime.split(':').map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    let duration = endTotalMinutes - startTotalMinutes;
    if (duration < 0) duration += 24 * 60;
    
    return duration || 30;
  };

  const resetForm = () => {
    setFormData({
      appointmentNumber: `APT${Date.now().toString().slice(-6)}`,
      patientId: "",
      patientType: "",
      department: "",
      doctorId: "",
      consultationType: "CONSULTATION",
      appointmentDate: "",
      startTime: "",
      endTime: "",
      reasonForVisit: "",
      notes: "",
      modeOfPayment: "",
    });
    setEditData(null);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: any) => {
    setFormData({ ...formData, [name]: value?.value || value });
  };

  const handleDateChange = (date: Dayjs | null) => {
    if (date) {
      setFormData({ ...formData, appointmentDate: date.format('YYYY-MM-DD') });
    }
  };

  const handleTimeChange = (name: string) => (time: Dayjs | null) => {
    if (time) {
      setFormData({ ...formData, [name]: time.format('HH:mm') });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!session?.user?.branch) {
      toast.error("Branch information not found");
      return;
    }

    if (!formData.patientId || !formData.doctorId || !formData.appointmentDate || 
        !formData.startTime || !formData.reasonForVisit) {
      toast.error("Please fill in all required fields");
      return;
    }

    setLoading(true);

    try {
      const branchId = typeof session.user.branch === 'object' ? session.user.branch._id : session.user.branch;
      const duration = calculateDuration(formData.startTime, formData.endTime);

      const appointmentData = {
        appointmentNumber: formData.appointmentNumber,
        patientId: formData.patientId,
        doctorId: formData.doctorId,
        branchId: branchId,
        appointmentDate: formData.appointmentDate,
        appointmentTime: formData.startTime,
        duration: duration,
        type: formData.consultationType,
        reasonForVisit: formData.reasonForVisit,
        notes: formData.notes,
      };

      if (editAppointmentId) {
        await apiClient.put(`/api/appointments/${editAppointmentId}`, appointmentData, {
          successMessage: "Appointment updated successfully"
        });
      } else {
        await apiClient.post('/api/appointments', appointmentData, {
          successMessage: "Appointment created successfully"
        });
      }

      resetForm();
      onSuccess();
      
      const modalElement = document.getElementById(editAppointmentId ? 'edit_modal' : 'add_modal');
      if (modalElement) {
        const bootstrap = (window as any).bootstrap;
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();
      }
    } catch (error: any) {
      console.error("Failed to save appointment:", error);
      toast.error(error.message || "Failed to save appointment");
    } finally {
      setLoading(false);
    }
  };

  const getSelectedPatientOption = () => {
    return patients.find(p => p.value === formData.patientId) || null;
  };

  const getSelectedDoctorOption = () => {
    return doctors.find(d => d.value === formData.doctorId) || null;
  };

  const getSelectedConsultationType = () => {
    return Consultation.find(c => c.value === formData.consultationType) || Consultation[0];
  };

  return (
    <>
      {/* View Modal */}
      <div id="view_modal" className="modal fade">
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header justify-content-between">
              <h5 className="modal-title text-truncate">Appointment Details</h5>
              <button
                type="button"
                className="btn-close btn-close-modal"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-circle-x-filled" />
              </button>
            </div>
            <div className="modal-body">
              {selectedAppointment && (
                <>
                  <div className="d-flex align-items-center justify-content-between mb-4">
                    <div className="d-flex align-items-center">
                      <Link href="#" className="avatar flex-shrink-0">
                        <ImageWithBasePath
                          src="assets/img/avatars/avatar-31.jpg"
                          className="rounded"
                          alt="patient"
                        />
                      </Link>
                      <div className="ms-2">
                        <div>
                          <h6 className="fw-semibold fs-14 text-truncate mb-1">
                            <Link href={`${all_routes.patientDetails}?id=${selectedAppointment.patientId._id}`}>
                              {selectedAppointment.patientId.firstName} {selectedAppointment.patientId.lastName}
                            </Link>
                          </h6>
                          <p className="fs-13 mb-0">{selectedAppointment.patientId.patientId}</p>
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className={`badge ${
                        selectedAppointment.status === 'SCHEDULED' ? 'badge-soft-purple' :
                        selectedAppointment.status === 'CONFIRMED' ? 'badge-soft-info' :
                        selectedAppointment.status === 'IN_PROGRESS' ? 'badge-soft-warning' :
                        selectedAppointment.status === 'COMPLETED' ? 'badge-soft-success' :
                        'badge-soft-danger'
                      }`}>
                        {selectedAppointment.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="row mb-3 row-gap-3">
                    <div className="col-sm-12">
                      <h6 className="mb-1">Date &amp; Time</h6>
                      <p className="text-dark mb-1">{selectedAppointment.duration} Minutes</p>
                      <p className="fs-13 mb-0">
                        {new Date(selectedAppointment.appointmentDate).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        })}, {selectedAppointment.appointmentTime}
                      </p>
                    </div>
                    <div className="col-sm-12">
                      <h6 className="mb-1">Consultation With</h6>
                      <p className="text-dark mb-1">
                        Dr. {selectedAppointment.doctorId.firstName} {selectedAppointment.doctorId.lastName}
                      </p>
                      <p className="fs-13 mb-0">{selectedAppointment.type}</p>
                    </div>
                  </div>
                  <h6 className="mb-1">Reason</h6>
                  <p className="mb-3">{selectedAppointment.reasonForVisit}</p>
                  {selectedAppointment.notes && (
                    <>
                      <h6 className="mb-1">Notes</h6>
                      <p className="mb-0">{selectedAppointment.notes}</p>
                    </>
                  )}
                </>
              )}
            </div>
            <div className="modal-footer d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-white"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Modal */}
      <div id="add_modal" className="modal fade">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header justify-content-between">
              <h5 className="modal-title text-truncate">New Appointment</h5>
              <button
                type="button"
                className="btn-close btn-close-modal"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={resetForm}
              >
                <i className="ti ti-circle-x-filled" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                <div className="row">
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Select Patient<span className="text-danger ms-1">*</span></label>
                      <CommonSelect
                        options={patients}
                        className="select"
                        value={getSelectedPatientOption()}
                        onChange={(option: any) => handleSelectChange('patientId', option)}
                        placeholder="Select patient..."
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Patient Type</label>
                      <CommonSelect
                        options={PatientType}
                        className="select"
                        defaultValue={PatientType[0]}
                        onChange={(option: any) => handleSelectChange('patientType', option)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Select Department</label>
                      <CommonSelect
                        options={SelectDepartment}
                        className="select"
                        defaultValue={SelectDepartment[0]}
                        onChange={(option: any) => handleSelectChange('department', option)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-6">
                    <div className="mb-3">
                      <label className="form-label">Select Doctor<span className="text-danger ms-1">*</span></label>
                      <CommonSelect
                        options={doctors}
                        className="select"
                        value={getSelectedDoctorOption()}
                        onChange={(option: any) => handleSelectChange('doctorId', option)}
                        placeholder="Select doctor..."
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Preferred Mode of Consultation<span className="text-danger ms-1">*</span></label>
                      <CommonSelect
                        options={Consultation}
                        className="select"
                        value={getSelectedConsultationType()}
                        onChange={(option: any) => handleSelectChange('consultationType', option)}
                      />
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-3">
                      <label className="form-label">Date<span className="text-danger ms-1">*</span></label>
                      <div className="w-auto input-group-flat">
                        <CommonDatePicker 
                          placeholder="dd/mm/yyyy"
                          onChange={handleDateChange}
                          value={formData.appointmentDate ? dayjs(formData.appointmentDate) : null}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-3">
                      <label className="form-label">Start Time<span className="text-danger ms-1">*</span></label>
                      <div className="position-relative">
                        <CommonTimePicker 
                          onChange={handleTimeChange('startTime')}
                          value={formData.startTime ? dayjs(formData.startTime, 'HH:mm') : null}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-4">
                    <div className="mb-3">
                      <label className="form-label">End Time</label>
                      <div className="position-relative">
                        <CommonTimePicker 
                          onChange={handleTimeChange('endTime')}
                          value={formData.endTime ? dayjs(formData.endTime, 'HH:mm') : null}
                        />
                      </div>
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Reason<span className="text-danger ms-1">*</span></label>
                      <input 
                        type="text" 
                        className="form-control"
                        name="reasonForVisit"
                        value={formData.reasonForVisit}
                        onChange={handleInputChange}
                        placeholder="Reason for visit"
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-3">
                      <label className="form-label">Quick Notes</label>
                      <textarea
                        className="form-control"
                        placeholder="Additional Information"
                        rows={4}
                        name="notes"
                        value={formData.notes}
                        onChange={handleInputChange}
                      />
                    </div>
                  </div>
                  <div className="col-lg-12">
                    <div className="mb-0">
                      <label className="form-label">Mode of Payment</label>
                      <CommonSelect
                        options={ModePayment}
                        className="select"
                        defaultValue={ModePayment[0]}
                        onChange={(option: any) => handleSelectChange('modeOfPayment', option)}
                      />
                    </div>
                  </div>
                </div>
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn btn-white"
                  data-bs-dismiss="modal"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Adding..." : "Add Appointment"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <div id="edit_modal" className="modal fade">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header justify-content-between">
              <h5 className="modal-title text-truncate">Edit Appointment</h5>
              <button
                type="button"
                className="btn-close btn-close-modal"
                data-bs-dismiss="modal"
                aria-label="Close"
                onClick={resetForm}
              >
                <i className="ti ti-circle-x-filled" />
              </button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="modal-body">
                {loadingData ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : (
                  <div className="row">
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">Select Patient<span className="text-danger ms-1">*</span></label>
                        <CommonSelect
                          options={patients}
                          className="select"
                          value={getSelectedPatientOption()}
                          onChange={(option: any) => handleSelectChange('patientId', option)}
                          placeholder="Select patient..."
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">Patient Type</label>
                        <CommonSelect
                          options={PatientType}
                          className="select"
                          defaultValue={PatientType[0]}
                          onChange={(option: any) => handleSelectChange('patientType', option)}
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">Select Department</label>
                        <CommonSelect
                          options={SelectDepartment}
                          className="select"
                          defaultValue={SelectDepartment[0]}
                          onChange={(option: any) => handleSelectChange('department', option)}
                        />
                      </div>
                    </div>
                    <div className="col-lg-6">
                      <div className="mb-3">
                        <label className="form-label">Select Doctor<span className="text-danger ms-1">*</span></label>
                        <CommonSelect
                          options={doctors}
                          className="select"
                          value={getSelectedDoctorOption()}
                          onChange={(option: any) => handleSelectChange('doctorId', option)}
                          placeholder="Select doctor..."
                        />
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="mb-3">
                        <label className="form-label">Preferred Mode of Consultation<span className="text-danger ms-1">*</span></label>
                        <CommonSelect
                          options={Consultation}
                          className="select"
                          value={getSelectedConsultationType()}
                          onChange={(option: any) => handleSelectChange('consultationType', option)}
                        />
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="mb-3">
                        <label className="form-label">Date<span className="text-danger ms-1">*</span></label>
                        <div className="w-auto input-group-flat">
                          <CommonDatePicker 
                            placeholder="dd/mm/yyyy"
                            onChange={handleDateChange}
                            value={formData.appointmentDate ? dayjs(formData.appointmentDate) : null}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="mb-3">
                        <label className="form-label">Start Time<span className="text-danger ms-1">*</span></label>
                        <div className="input-icon-end position-relative">
                          <CommonTimePicker 
                            onChange={handleTimeChange('startTime')}
                            value={formData.startTime ? dayjs(formData.startTime, 'HH:mm') : null}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-4">
                      <div className="mb-3">
                        <label className="form-label">End Time</label>
                        <div className="input-icon-end position-relative">
                          <CommonTimePicker 
                            onChange={handleTimeChange('endTime')}
                            value={formData.endTime ? dayjs(formData.endTime, 'HH:mm') : null}
                          />
                        </div>
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="mb-3">
                        <label className="form-label">Reason<span className="text-danger ms-1">*</span></label>
                        <input 
                          type="text" 
                          className="form-control"
                          name="reasonForVisit"
                          value={formData.reasonForVisit}
                          onChange={handleInputChange}
                          placeholder="Reason for visit"
                        />
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="mb-3">
                        <label className="form-label">Quick Notes</label>
                        <textarea
                          className="form-control"
                          rows={4}
                          name="notes"
                          value={formData.notes}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-lg-12">
                      <div className="mb-0">
                        <label className="form-label">Mode of Payment</label>
                        <CommonSelect
                          options={ModePayment}
                          className="select"
                          defaultValue={ModePayment[0]}
                          onChange={(option: any) => handleSelectChange('modeOfPayment', option)}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
              <div className="modal-footer d-flex align-items-center gap-1">
                <button
                  type="button"
                  className="btn btn-white"
                  data-bs-dismiss="modal"
                  onClick={resetForm}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading || loadingData}>
                  {loading ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default AppointmentModal;
