"use client";
import { useSession } from "next-auth/react";
import { UserRole } from "@/types/emr";
import DoctorDashboard from "./role-dashboards/DoctorDashboard";
import NurseDashboard from "./role-dashboards/NurseDashboard";
import LabDashboard from "./role-dashboards/LabDashboard";
import PharmacyDashboard from "./role-dashboards/PharmacyDashboard";
import BillingDashboard from "./role-dashboards/BillingDashboard";
import AccountingDashboard from "./role-dashboards/AccountingDashboard";
import FrontDeskDashboard from "./role-dashboards/FrontDeskDashboard";
import AdminDashboard from "./role-dashboards/AdminDashboard";

const RoleDashboardRouter = () => {
  const { data: session, status } = useSession();

  if (status === "loading") {
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

  if (!session?.user) {
    return null;
  }

  const userRole = session.user.role as UserRole;

  switch (userRole) {
    case UserRole.DOCTOR:
      return <DoctorDashboard />;
    
    case UserRole.NURSE:
      return <NurseDashboard />;
    
    case UserRole.LAB:
      return <LabDashboard />;
    
    case UserRole.PHARMACY:
      return <PharmacyDashboard />;
    
    case UserRole.BILLING:
      return <BillingDashboard />;
    
    case UserRole.ACCOUNTING:
      return <AccountingDashboard />;
    
    case UserRole.FRONT_DESK:
      return <FrontDeskDashboard />;
    
    case UserRole.ADMIN:
    default:
      return <AdminDashboard />;
  }
};

export default RoleDashboardRouter;
