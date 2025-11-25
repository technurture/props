"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Table, Button, Input, Select, Tag, DatePicker, Space, Spin } from "antd";
import { 
  SearchOutlined,
  DownloadOutlined,
  EyeOutlined,
  SafetyOutlined
} from "@ant-design/icons";
import { UserRole } from "@/types/emr";
import { all_routes } from "@/router/all_routes";
import { apiClient } from "@/lib/services/api-client";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import dayjs from "dayjs";

const { Option } = Select;
const { RangePicker } = DatePicker;

interface Insurance {
  _id: string;
  name: string;
  code: string;
  type: string;
  coveragePercentage: number;
}

interface PatientVisitData {
  _id: string;
  patient: {
    _id: string;
    patientId: string;
    firstName: string;
    lastName: string;
    phoneNumber: string;
  };
  visitNumber: string;
  visitDate: Date;
  visitType: string;
  currentStage: string;
  status: string;
  services: {
    consultations: any[];
    labTests: any[];
    prescriptions: any[];
    procedures: any[];
  };
  totalExpenses: number;
  insurance: {
    provider: string;
    policyNumber: string;
  };
}

const InsurancePatientData = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [insurances, setInsurances] = useState<Insurance[]>([]);
  const [selectedInsurance, setSelectedInsurance] = useState<string | undefined>(undefined);
  const [patientData, setPatientData] = useState<PatientVisitData[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs | null, dayjs.Dayjs | null] | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    if (!session) return;
    
    const allowedRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTING, UserRole.BILLING];
    if (!allowedRoles.includes(session.user.role as UserRole)) {
      router.push(all_routes.dashboard);
      return;
    }

    fetchInsurances();
  }, [session, router]);

  useEffect(() => {
    const insuranceParam = searchParams?.get('insurance');
    if (insuranceParam && insurances.length > 0) {
      setSelectedInsurance(insuranceParam);
      fetchPatientData(insuranceParam);
    }
  }, [searchParams, insurances]);

  const fetchInsurances = async () => {
    try {
      const response = await apiClient.get("/api/insurance");
      setInsurances((response as any) || []);
    } catch (error) {
      console.error("Failed to fetch insurances:", error);
    }
  };

  const fetchPatientData = async (insuranceId: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ insuranceId });
      
      if (searchText) {
        params.append('search', searchText);
      }
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      }

      const response = await apiClient.get<{ data: any[] }>(`/api/insurance/patient-data?${params.toString()}`);
      setPatientData(response.data || []);
    } catch (error) {
      console.error("Failed to fetch patient data:", error);
      setPatientData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInsuranceChange = (insuranceId: string) => {
    setSelectedInsurance(insuranceId);
    if (insuranceId) {
      fetchPatientData(insuranceId);
    } else {
      setPatientData([]);
    }
  };

  const handleSearch = () => {
    if (selectedInsurance) {
      fetchPatientData(selectedInsurance);
    }
  };

  const handleExport = async () => {
    if (!selectedInsurance) return;
    
    setExportLoading(true);
    try {
      const params = new URLSearchParams({ insuranceId: selectedInsurance });
      
      if (searchText) {
        params.append('search', searchText);
      }
      
      if (dateRange && dateRange[0] && dateRange[1]) {
        params.append('startDate', dateRange[0].format('YYYY-MM-DD'));
        params.append('endDate', dateRange[1].format('YYYY-MM-DD'));
      }

      const response = await fetch(`/api/insurance/patient-data/export?${params.toString()}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      const insurance = insurances.find(ins => ins._id === selectedInsurance);
      const fileName = `insurance_patient_data_${insurance?.code || 'unknown'}_${dayjs().format('YYYY-MM-DD')}.csv`;
      a.download = fileName;
      
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Failed to export data:", error);
    } finally {
      setExportLoading(false);
    }
  };

  const columns = [
    {
      title: "Patient ID",
      dataIndex: ["patient", "patientId"],
      key: "patientId",
      render: (text: string) => <span className="fw-medium">{text}</span>,
    },
    {
      title: "Patient Name",
      key: "patientName",
      render: (_: any, record: PatientVisitData) => (
        <div>
          <div className="fw-medium">{`${record.patient.firstName} ${record.patient.lastName}`}</div>
          <div className="text-muted small">{record.patient.phoneNumber}</div>
        </div>
      ),
    },
    {
      title: "Policy Number",
      dataIndex: ["insurance", "policyNumber"],
      key: "policyNumber",
    },
    {
      title: "Visit Number",
      dataIndex: "visitNumber",
      key: "visitNumber",
      render: (text: string) => <span className="badge bg-primary-transparent">{text}</span>,
    },
    {
      title: "Visit Date",
      dataIndex: "visitDate",
      key: "visitDate",
      render: (date: Date) => dayjs(date).format('MMM DD, YYYY'),
      sorter: (a: PatientVisitData, b: PatientVisitData) => 
        new Date(a.visitDate).getTime() - new Date(b.visitDate).getTime(),
    },
    {
      title: "Services",
      key: "services",
      render: (_: any, record: PatientVisitData) => {
        const services = record.services;
        const serviceCount = 
          (services.consultations?.length || 0) +
          (services.labTests?.length || 0) +
          (services.prescriptions?.length || 0) +
          (services.procedures?.length || 0);
        
        return (
          <div>
            {services.consultations && services.consultations.length > 0 && (
              <Tag color="blue">Consultations: {services.consultations.length}</Tag>
            )}
            {services.labTests && services.labTests.length > 0 && (
              <Tag color="green">Lab Tests: {services.labTests.length}</Tag>
            )}
            {services.prescriptions && services.prescriptions.length > 0 && (
              <Tag color="orange">Drugs: {services.prescriptions.length}</Tag>
            )}
            {serviceCount === 0 && <span className="text-muted">No services</span>}
          </div>
        );
      },
    },
    {
      title: "Total Expenses",
      dataIndex: "totalExpenses",
      key: "totalExpenses",
      render: (amount: number) => (
        <span className="fw-medium text-success">₦{amount?.toLocaleString() || '0.00'}</span>
      ),
      sorter: (a: PatientVisitData, b: PatientVisitData) => 
        (a.totalExpenses || 0) - (b.totalExpenses || 0),
    },
    {
      title: "Status",
      dataIndex: "status",
      key: "status",
      render: (status: string) => {
        const color = status === 'completed' ? 'success' : status === 'in_progress' ? 'warning' : 'default';
        return <Tag color={color}>{status?.replace('_', ' ').toUpperCase()}</Tag>;
      },
    },
  ];

  const allowedRoles = [UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTING, UserRole.BILLING];
  if (!session || !allowedRoles.includes(session.user.role as UserRole)) {
    return (
      <div className="page-wrapper">
        <div className="content">
          <div className="alert alert-danger" role="alert">
            <i className="ti ti-alert-circle me-2"></i>
            You do not have permission to access Insurance Patient Data.
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
            <h4 className="mb-1">Insurance Patient Data</h4>
            <p className="text-muted mb-0">View patient activities and expenses by insurance provider</p>
          </div>
          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={handleExport}
            disabled={!selectedInsurance || patientData.length === 0}
            loading={exportLoading}
          >
            Export to CSV
          </Button>
        </div>

        <div className="card">
          <div className="card-body">
            <div className="row mb-4 g-3">
              <div className="col-md-4">
                <label className="form-label fw-semibold mb-2">
                  <SafetyOutlined className="me-2" />
                  Select Insurance Provider
                </label>
                <Select
                  placeholder="Choose an insurance provider"
                  style={{ width: '100%' }}
                  onChange={handleInsuranceChange}
                  value={selectedInsurance}
                  size="large"
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                  }
                  options={insurances.map(insurance => ({
                    value: insurance._id,
                    label: `${insurance.name} (${insurance.code})`,
                  }))}
                />
              </div>
              
              {selectedInsurance && (
                <>
                  <div className="col-md-3">
                    <label className="form-label fw-semibold mb-2">Search Patient</label>
                    <Input
                      placeholder="Patient name, ID, or policy..."
                      prefix={<SearchOutlined />}
                      value={searchText}
                      onChange={(e) => setSearchText(e.target.value)}
                      onPressEnter={handleSearch}
                      size="large"
                      allowClear
                    />
                  </div>
                  
                  <div className="col-md-3">
                    <label className="form-label fw-semibold mb-2">Date Range</label>
                    <RangePicker
                      style={{ width: '100%' }}
                      value={dateRange}
                      onChange={(dates) => setDateRange(dates)}
                      size="large"
                    />
                  </div>
                  
                  <div className="col-md-2 d-flex align-items-end">
                    <Button
                      type="primary"
                      icon={<SearchOutlined />}
                      onClick={handleSearch}
                      size="large"
                      block
                    >
                      Search
                    </Button>
                  </div>
                </>
              )}
            </div>

            {loading ? (
              <div className="text-center py-5">
                <Spin size="large" />
                <p className="text-muted mt-3">Loading patient data...</p>
              </div>
            ) : selectedInsurance ? (
              <>
                <div className="mb-3">
                  <span className="text-muted">
                    Showing {patientData.length} visit(s)
                    {patientData.length > 0 && (
                      <span className="ms-2">
                        | Total Expenses: <strong className="text-success">
                          ₦{patientData.reduce((sum, item) => sum + (item.totalExpenses || 0), 0).toLocaleString()}
                        </strong>
                      </span>
                    )}
                  </span>
                </div>
                
                <Table
                  columns={columns}
                  dataSource={patientData}
                  rowKey="_id"
                  pagination={{
                    total: patientData.length,
                    pageSize: 20,
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} visits`,
                  }}
                  scroll={{ x: 1200 }}
                />
              </>
            ) : (
              <div className="text-center py-5">
                <SafetyOutlined style={{ fontSize: 64, color: '#ccc' }} />
                <p className="text-muted mt-3">Select an insurance provider to view patient data</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <CommonFooter />
    </div>
  );
};

export default InsurancePatientData;
