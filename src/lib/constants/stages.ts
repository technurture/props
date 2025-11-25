export const STAGE_WORKFLOW: Record<string, string> = {
  'front_desk': 'nurse',
  'nurse': 'doctor',
  'doctor': 'lab',
  'lab': 'pharmacy',
  'pharmacy': 'billing',
  'billing': 'returned_to_front_desk'
};

export const STAGE_LABELS: Record<string, string> = {
  'front_desk': 'Front Desk',
  'nurse': 'Nurse',
  'doctor': 'Doctor',
  'lab': 'Laboratory',
  'pharmacy': 'Pharmacy',
  'billing': 'Billing',
  'returned_to_front_desk': 'Complete Visit',
  'completed': 'Completed'
};

export const STAGE_BADGE_COLORS: Record<string, string> = {
  'front_desk': 'badge-soft-info',
  'nurse': 'badge-soft-primary',
  'doctor': 'badge-soft-primary',
  'lab': 'badge-soft-info',
  'pharmacy': 'badge-soft-info',
  'billing': 'badge-soft-warning',
  'returned_to_front_desk': 'badge-soft-success',
  'completed': 'badge-soft-success'
};

export const STAGE_PERMISSIONS: Record<string, string[]> = {
  'nurse': ['NURSE', 'ADMIN'],
  'doctor': ['DOCTOR', 'ADMIN'],
  'lab': ['LAB', 'ADMIN'],
  'pharmacy': ['PHARMACY', 'ADMIN'],
  'billing': ['BILLING', 'ADMIN']
};

export const ROLE_TO_STAGE: Record<string, string> = {
  'FRONT_DESK': 'front_desk',
  'NURSE': 'nurse',
  'DOCTOR': 'doctor',
  'LAB': 'lab',
  'PHARMACY': 'pharmacy',
  'BILLING': 'billing'
};

export const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  'front_desk': ['nurse', 'lab', 'pharmacy'],
  'nurse': ['doctor', 'lab', 'pharmacy', 'billing', 'returned_to_front_desk'],
  'doctor': ['nurse', 'lab', 'pharmacy', 'billing', 'returned_to_front_desk'],
  'lab': ['doctor', 'nurse', 'pharmacy', 'billing', 'returned_to_front_desk'],
  'pharmacy': ['doctor', 'nurse', 'lab', 'billing', 'returned_to_front_desk'],
  'billing': ['doctor', 'nurse', 'lab', 'pharmacy', 'returned_to_front_desk'],
  'returned_to_front_desk': ['doctor', 'nurse', 'lab', 'pharmacy', 'billing', 'completed']
};

export function getNextStage(currentStage: string): string | null {
  return STAGE_WORKFLOW[currentStage] || null;
}

export function getAllowedTransitions(currentStage: string): string[] {
  return ALLOWED_TRANSITIONS[currentStage] || [];
}

export function getStageLabel(stage: string): string {
  return STAGE_LABELS[stage] || stage;
}

export function getStageBadgeClass(stage: string): string {
  return STAGE_BADGE_COLORS[stage] || 'badge-soft-secondary';
}

export function canAccessStage(userRole: string, stage: string): boolean {
  const allowedRoles = STAGE_PERMISSIONS[stage];
  if (!allowedRoles) return userRole === 'ADMIN';
  return allowedRoles.includes(userRole);
}
