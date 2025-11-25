import { toast } from 'react-toastify';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
  details?: string[];
}

interface ApiClientOptions {
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  successMessage?: string;
}

class ApiClient {
  private async handleResponse<T>(response: Response): Promise<T> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');
    const data = isJson ? await response.json() : await response.text();

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || `Request failed with status ${response.status}`;
      const errorDetails = data?.details || [];
      
      throw {
        status: response.status,
        message: errorMessage,
        details: errorDetails,
        data
      };
    }

    return data;
  }

  async get<T>(url: string, options: ApiClientOptions = {}): Promise<T> {
    const { showErrorToast = true } = options;

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (showErrorToast) {
        toast.error(error.message || 'Failed to fetch data');
      }
      throw error;
    }
  }

  async post<T>(url: string, data: any, options: ApiClientOptions = {}): Promise<T> {
    const { 
      showSuccessToast = true, 
      showErrorToast = true,
      successMessage = 'Created successfully'
    } = options;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse<T>(response);
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (error: any) {
      if (showErrorToast) {
        const errorMsg = error.message || 'Failed to create';
        if (error.details && error.details.length > 0) {
          toast.error(`${errorMsg}: ${error.details.join(', ')}`);
        } else {
          toast.error(errorMsg);
        }
      }
      throw error;
    }
  }

  async put<T>(url: string, data: any, options: ApiClientOptions = {}): Promise<T> {
    const { 
      showSuccessToast = true, 
      showErrorToast = true,
      successMessage = 'Updated successfully'
    } = options;

    try {
      const response = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse<T>(response);
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (error: any) {
      if (showErrorToast) {
        const errorMsg = error.message || 'Failed to update';
        if (error.details && error.details.length > 0) {
          toast.error(`${errorMsg}: ${error.details.join(', ')}`);
        } else {
          toast.error(errorMsg);
        }
      }
      throw error;
    }
  }

  async patch<T>(url: string, data: any, options: ApiClientOptions = {}): Promise<T> {
    const { 
      showSuccessToast = true, 
      showErrorToast = true,
      successMessage = 'Updated successfully'
    } = options;

    try {
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(data),
      });

      const result = await this.handleResponse<T>(response);
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (error: any) {
      if (showErrorToast) {
        const errorMsg = error.message || 'Failed to update';
        if (error.details && error.details.length > 0) {
          toast.error(`${errorMsg}: ${error.details.join(', ')}`);
        } else {
          toast.error(errorMsg);
        }
      }
      throw error;
    }
  }

  async delete<T>(url: string, options: ApiClientOptions = {}): Promise<T> {
    const { 
      showSuccessToast = true, 
      showErrorToast = true,
      successMessage = 'Deleted successfully'
    } = options;

    try {
      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      const result = await this.handleResponse<T>(response);
      
      if (showSuccessToast) {
        toast.success(successMessage);
      }
      
      return result;
    } catch (error: any) {
      if (showErrorToast) {
        toast.error(error.message || 'Failed to delete');
      }
      throw error;
    }
  }
}

export const apiClient = new ApiClient();
