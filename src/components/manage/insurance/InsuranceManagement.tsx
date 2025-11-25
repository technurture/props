"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Table, Button, Input, Select, Modal, Tag } from "antd";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  SafetyOutlined,
  FileTextOutlined,
  UploadOutlined
} from "@ant-design/icons";
import { UserRole } from "@/types/emr";
import { all_routes } from "@/router/all_routes";
import InsuranceModal from "./InsuranceModal";
import { apiClient } from "@/lib/services/api-client";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import BulkImportExport from "@/components/common/BulkImportExport";
import { insuranceSchema, ValidationError } from "@/lib/bulk-import/schemas";
import { BulkImportResponse, BulkExportRow } from "@/lib/bulk-import/types";
import { toast } from "react-toastify";

const { confirm } = Modal;
const { Option } = Select;

interface Insurance {
  _id: string;
  name: string;
  code: string;
  type: string;
  coveragePercentage: number;
  contactPerson?: string;
  contactPhone?: string;
  contactEmail?: string;
  isActive: boolean;
  createdBy?: {
    firstName: string;
    lastName: string;
  };
}

const InsuranceManagement = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedInsurance, setSelectedInsurance] = useState<Insurance | null>(null);
  const [showBulkImportExport, setShowBulkImportExport] = useState(false);

  useEffect(() => {
    if (!session) return;
    
    if (session.user.role !== UserRole.ADMIN) {
      router.push(all_routes.dashboard);
      return;
    }

    fetchInsurances();
  }, [session, router]);

  const fetchInsurances = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get("/api/insurance");
      setInsurances(response as Insurance[]);
    } catch (error) {
      console.error("Failed to fetch insurances:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedInsurance(null);
    setIsModalVisible(true);
  };

  const handleEdit = (insurance: Insurance) => {
    setSelectedInsurance(insurance);
    setIsModalVisible(true);
  };

  const handleDelete = (insurance: Insurance) => {
    confirm({
      title: 'Delete Insurance Provider',
      content: `Are you sure you want to delete "${insurance.name}"? This action will deactivate the insurance provider.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await apiClient.delete(`/api/insurance/${insurance._id}`, {
            successMessage: "Insurance provider deleted successfully"
          });
          fetchInsurances();
        } catch (error) {
          console.error("Failed to delete insurance:", error);
        }
      },
    });
  };

  const handleModalClose = (shouldRefresh?: boolean) => {
    setIsModalVisible(false);
    setSelectedInsurance(null);
    if (shouldRefresh) {
      fetchInsurances();
    }
  };

  const handleViewPatients = (insurance: Insurance) => {
    router.push(`${all_routes.insurancePatientData}?insurance=${insurance._id}`);
  };

  const handleBulkImport = async (data: any[]) => {
    try {
      const response = await apiClient.post<BulkImportResponse>('/api/insurance/bulk-import', { data }, {
        successMessage: 'Insurance providers imported successfully',
      });
      
      fetchInsurances();
      
      return {
        success: response?.success || 0,
        failed: response?.failed || 0,
        errors: response?.errors || [],
      };
    } catch (error: any) {
      toast.error(error.message || 'Failed to import insurance providers');
      throw error;
    }
  };

  const handleBulkExport = async (filters?: any): Promise<BulkExportRow[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive);
      
      const data = await apiClient.get<BulkExportRow[]>(
        `/api/insurance/bulk-export?${params.toString()}`,
        { showErrorToast: true }
      );
      
      return data ?? [];
    } catch (error: any) {
      toast.error(error.message || 'Failed to export insurance providers');
      throw error;
    }
  };

  const filteredInsurances = insurances.filter(insurance => {
    const matchesSearch = !searchText || 
      insurance.name.toLowerCase().includes(searchText.toLowerCase()) ||
      insurance.code.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesType = !typeFilter || insurance.type === typeFilter;
    
    return matchesSearch && matchesType;
  });

  const columns = [
    {
      title: "Provider Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Insurance) => (
        <div className="d-flex align-items-center">
          <SafetyOutlined className="me-2 text-primary" />
          <div>
            <div className="fw-medium">{text}</div>
            <div className="text-muted small">{record.code}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Type",
      dataIndex: "type",
      key: "type",
      render: (type: string) => (
        <Tag color="blue">{type}</Tag>
      ),
    },
    {
      title: "Coverage",
      dataIndex: "coveragePercentage",
      key: "coveragePercentage",
      render: (coverage: number) => (
        <span className="fw-medium">{coverage}%</span>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (record: Insurance) => (
        <div>
          {record.contactPerson && <div>{record.contactPerson}</div>}
          {record.contactPhone && <div className="text-muted small">{record.contactPhone}</div>}
          {record.contactEmail && <div className="text-muted small">{record.contactEmail}</div>}
          {!record.contactPerson && !record.contactPhone && !record.contactEmail && (
            <span className="text-muted">No contact info</span>
          )}
        </div>
      ),
    },
    {
      title: "Status",
      dataIndex: "isActive",
      key: "isActive",
      render: (isActive: boolean) => (
        <Tag color={isActive ? "success" : "error"}>
          {isActive ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Actions",
      key: "actions",
      render: (_: any, record: Insurance) => (
        <div className="d-flex gap-2">
          <Button
            type="link"
            icon={<FileTextOutlined />}
            onClick={() => handleViewPatients(record)}
          >
            View Patients
          </Button>
          <Button
            type="link"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            Edit
          </Button>
          <Button
            type="link"
            danger
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];

  if (session?.user.role !== UserRole.ADMIN) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger" role="alert">
            <i className="ti ti-alert-circle me-2"></i>
            You do not have permission to access Insurance Management.
          </div>
        </div>
        <CommonFooter />
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="d-flex align-items-center justify-content-between mb-4">
          <div>
            <h4 className="mb-1">Insurance Management</h4>
            <p className="text-muted mb-0">Manage insurance providers and plans</p>
          </div>
          <div className="d-flex gap-2">
            <Button
              icon={<UploadOutlined />}
              onClick={() => setShowBulkImportExport(true)}
            >
              Bulk Import/Export
            </Button>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleCreate}
            >
              Add Insurance Provider
            </Button>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="row mb-4">
              <div className="col-md-6">
                <Input
                  placeholder="Search by name or code..."
                  prefix={<SearchOutlined />}
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  allowClear
                />
              </div>
              <div className="col-md-3">
                <Select
                  placeholder="Filter by type"
                  style={{ width: '100%' }}
                  onChange={setTypeFilter}
                  allowClear
                >
                  <Option value="HMO">HMO</Option>
                  <Option value="PPO">PPO</Option>
                  <Option value="Government">Government</Option>
                  <Option value="Private">Private</Option>
                  <Option value="Corporate">Corporate</Option>
                  <Option value="Other">Other</Option>
                </Select>
              </div>
            </div>

            <Table
              columns={columns}
              dataSource={filteredInsurances}
              rowKey="_id"
              loading={loading}
              pagination={{
                total: filteredInsurances.length,
                pageSize: 10,
                showSizeChanger: true,
                showTotal: (total) => `Total ${total} insurance providers`,
              }}
            />
          </div>
        </div>

        <InsuranceModal
          visible={isModalVisible}
          insurance={selectedInsurance}
          onClose={handleModalClose}
        />

        <BulkImportExport
          schema={insuranceSchema}
          moduleName="Insurance"
          onImport={handleBulkImport}
          onExport={handleBulkExport}
          isOpen={showBulkImportExport}
          onClose={() => setShowBulkImportExport(false)}
        />
      </div>
      <CommonFooter />
    </div>
  );
};

export default InsuranceManagement;
