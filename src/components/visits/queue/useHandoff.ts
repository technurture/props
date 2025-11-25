import { useState } from 'react';
import { apiClient } from '@/lib/services/api-client';
import { toast } from 'react-toastify';
import { emitHandoffEvent } from '@/lib/utils/queue-events';

interface HandoffOptions {
  visitId: string;
  currentStage?: string;
  targetStage?: string;
  notes?: string;
  nextAction?: string;
  onSuccess?: () => void;
  onError?: (error: any) => void;
}

export function useHandoff() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handoff = async (options: HandoffOptions) => {
    const { visitId, currentStage, targetStage, notes, nextAction, onSuccess, onError } = options;

    setLoading(true);
    setError(null);

    try {
      const getSuccessMessage = () => {
        if (targetStage === 'completed') {
          return '✓ Visit completed successfully';
        }
        const stageLabels: Record<string, string> = {
          'nurse': 'Nurse',
          'doctor': 'Doctor',
          'lab': 'Laboratory',
          'pharmacy': 'Pharmacy',
          'billing': 'Billing',
          'returned_to_front_desk': 'Front Desk'
        };
        const targetLabel = stageLabels[targetStage || ''] || targetStage;
        return `✓ Patient transferred to ${targetLabel} successfully`;
      };

      const response = await apiClient.post(
        '/api/clocking/handoff',
        {
          visitId,
          targetStage,
          notes,
          nextAction,
        },
        {
          successMessage: getSuccessMessage(),
          showErrorToast: true,
        }
      );

      if (currentStage && targetStage) {
        emitHandoffEvent(visitId, currentStage, targetStage);
      }

      if (onSuccess) {
        onSuccess();
      }

      return response;
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to transfer patient';
      setError(errorMessage);
      
      if (onError) {
        onError(err);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    handoff,
    loading,
    error,
  };
}
