"use client";
import { all_routes } from "@/router/all_routes";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

const tabs = [
  { label: "Patient Profile", route: all_routes.patientDetails },
  { label: "Appointments", route: all_routes.patientDetailsAppointment },
  { label: "Vital Signs", route: all_routes.patientDetailsVitalSign },
  { label: "Visit History", route: all_routes.patientetailsVisitHistory },
  { label: "Lab Results", route: all_routes.patientetailsLabResults },
  { label: "Prescription", route: all_routes.patientdetailsPrescription },
  { label: "Medical History", route: all_routes.patientetailsMedicalHistory },
  { label: "Documents", route: all_routes.patientetailsDocuments },
];

const PatientDetailsHeader = () => {
  const location = usePathname();
  const searchParams = useSearchParams();
  const patientId = searchParams.get('id');
  
  return (
    <ul className="nav nav-tabs nav-solid-primary  border-bottom pb-4 mb-4 d-flex align-items-center gap-2">
      {tabs.map((tab) => (
        <li className="nav-item" key={tab.route}>
          <Link
            href={`${tab.route}${patientId ? `?id=${patientId}` : ''}`}
            className={`nav-link border rounded fw-semibold${location === tab.route ? " active" : ""}`}
          >
            {tab.label}
          </Link>
        </li>
      ))}
    </ul>
  );
};

export default PatientDetailsHeader; 