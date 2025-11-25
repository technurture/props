"use client";
import React, { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { apiClient } from '@/lib/services/api-client';
import { UserRole } from '@/types/emr';

interface AssignedDoctorCellProps {
  visitId: string;
  assignedDoctor?: {
    _id: string;
    firstName: string;
    lastName: string;
    email?: string;
  } | null;
  onUpdate?: () => void;
}

interface Doctor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export default function AssignedDoctorCell({ visitId, assignedDoctor, onUpdate }: AssignedDoctorCellProps) {
  const { data: session } = useSession();
  const [isEditing, setIsEditing] = useState(false);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState(assignedDoctor?._id || '');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const userRole = session?.user?.role as UserRole;
  const canEdit = userRole === UserRole.FRONT_DESK || userRole === UserRole.ADMIN;

  useEffect(() => {
    if (isEditing && doctors.length === 0) {
      fetchDoctors();
    }
  }, [isEditing]);

  useEffect(() => {
    setSelectedDoctor(assignedDoctor?._id || '');
  }, [assignedDoctor]);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get<{ doctors: Doctor[] }>(
        '/api/doctors?limit=1000&clockedIn=true',
        { showErrorToast: true }
      );
      setDoctors(response.doctors || []);
    } catch (error) {
      console.error('Failed to fetch doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!selectedDoctor) return;

    setSaving(true);
    try {
      await apiClient.put(
        `/api/visits/${visitId}`,
        { assignedDoctor: selectedDoctor },
        { successMessage: 'Doctor assigned successfully' }
      );
      setIsEditing(false);
      if (onUpdate) {
        onUpdate();
      }
    } catch (error) {
      console.error('Failed to update assigned doctor:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedDoctor(assignedDoctor?._id || '');
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="d-flex align-items-center gap-2">
        <select
          className="form-select form-select-sm"
          value={selectedDoctor}
          onChange={(e) => setSelectedDoctor(e.target.value)}
          disabled={loading || saving}
          style={{ minWidth: '150px' }}
        >
          <option value="">Select Doctor</option>
          {doctors.map((doctor) => (
            <option key={doctor._id} value={doctor._id}>
              Dr. {doctor.firstName} {doctor.lastName}
            </option>
          ))}
        </select>
        <button
          className="btn btn-sm btn-success"
          onClick={handleSave}
          disabled={!selectedDoctor || saving}
        >
          {saving ? <i className="ti ti-loader fa-spin"></i> : <i className="ti ti-check"></i>}
        </button>
        <button
          className="btn btn-sm btn-outline-secondary"
          onClick={handleCancel}
          disabled={saving}
        >
          <i className="ti ti-x"></i>
        </button>
      </div>
    );
  }

  return (
    <div className="d-flex align-items-center gap-2">
      <span className="text-nowrap">
        {assignedDoctor 
          ? `Dr. ${assignedDoctor.firstName} ${assignedDoctor.lastName}`
          : <span className="text-muted">Not assigned</span>
        }
      </span>
      {canEdit && (
        <button
          className="btn btn-sm btn-link p-0 text-primary"
          onClick={() => setIsEditing(true)}
          title="Edit assigned doctor"
        >
          <i className="ti ti-edit"></i>
        </button>
      )}
    </div>
  );
}
