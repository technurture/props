"use client";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Table, Button, Input, Select, Modal, Tag } from "antd";
import { 
  PlusOutlined, 
  EditOutlined, 
  DeleteOutlined, 
  SearchOutlined,
  BuildOutlined,
  UploadOutlined
} from "@ant-design/icons";
import { getBranches, deleteBranch } from "@/lib/services/branches";
import { Branch } from "@/types/emr";
import { UserRole } from "@/types/emr";
import { all_routes } from "@/router/all_routes";
import BranchModal from "./BranchModal";
import { usePermissions } from "@/hooks/usePermissions";
import BulkImportExport from "@/components/common/BulkImportExport";
import { branchSchema, ValidationError } from "@/lib/bulk-import/schemas";
import { BulkImportResponse, BulkExportRow } from "@/lib/bulk-import/types";
import { toast } from "react-toastify";
import { apiClient } from "@/lib/services/api-client";

const { confirm } = Modal;
const { Option } = Select;

const BranchManagement = () => {
  const { data: session } = useSession();
  const router = useRouter();
  const { can } = usePermissions();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<boolean | undefined>(undefined);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
  const [showBulkImportExport, setShowBulkImportExport] = useState(false);

  useEffect(() => {
    if (!session) return;
    
    if (session.user.role !== UserRole.ADMIN) {
      router.push(all_routes.dashboard);
      return;
    }

    fetchBranches();
  }, [session, currentPage, pageSize, searchText, statusFilter, router]);

  const fetchBranches = async () => {
    setLoading(true);
    try {
      const response = await getBranches({
        search: searchText || undefined,
        isActive: statusFilter,
        page: currentPage,
        limit: pageSize,
      });
      setBranches(response.branches);
      setTotalCount(response.pagination.totalCount);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = () => {
    setSelectedBranch(null);
    setIsModalVisible(true);
  };

  const handleEdit = (branch: Branch) => {
    setSelectedBranch(branch);
    setIsModalVisible(true);
  };

  const handleDelete = (branch: Branch) => {
    confirm({
      title: 'Delete Branch',
      content: `Are you sure you want to delete "${branch.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          await deleteBranch(branch._id!);
          fetchBranches();
        } catch (error) {
          console.error("Failed to delete branch:", error);
        }
      },
    });
  };

  const handleModalClose = (shouldRefresh?: boolean) => {
    setIsModalVisible(false);
    setSelectedBranch(null);
    if (shouldRefresh) {
      fetchBranches();
    }
  };

  const handleSearch = (value: string) => {
    setSearchText(value);
    setCurrentPage(1);
  };

  const handleStatusChange = (value: string) => {
    setStatusFilter(value === "all" ? undefined : value === "active");
    setCurrentPage(1);
  };

  const handleBulkImport = async (data: any[]) => {
    try {
      const response = await apiClient.post<BulkImportResponse>('/api/branches/bulk-import', { data }, {
        successMessage: 'Branches imported successfully',
      });
      
      fetchBranches();
      
      return {
        success: response?.success || 0,
        failed: response?.failed || 0,
        errors: response?.errors || [],
      };
    } catch (error: any) {
      toast.error(error.message || 'Failed to import branches');
      throw error;
    }
  };

  const handleBulkExport = async (filters?: any): Promise<BulkExportRow[]> => {
    try {
      const params = new URLSearchParams();
      if (filters?.isActive !== undefined) params.append('isActive', filters.isActive);
      
      const data = await apiClient.get<BulkExportRow[]>(
        `/api/branches/bulk-export?${params.toString()}`,
        { showErrorToast: true }
      );
      
      return data ?? [];
    } catch (error: any) {
      toast.error(error.message || 'Failed to export branches');
      throw error;
    }
  };

  const columns = [
    {
      title: "Branch Name",
      dataIndex: "name",
      key: "name",
      render: (text: string, record: Branch) => (
        <div className="d-flex align-items-center">
          <BuildOutlined className="me-2 text-primary" />
          <div>
            <div className="fw-medium">{text}</div>
            <div className="text-muted small">{record.code}</div>
          </div>
        </div>
      ),
    },
    {
      title: "Location",
      key: "location",
      render: (record: Branch) => (
        <div>
          <div>{record.city}</div>
          <div className="text-muted small">{record.state}</div>
        </div>
      ),
    },
    {
      title: "Contact",
      key: "contact",
      render: (record: Branch) => (
        <div>
          <div>{record.phone}</div>
          <div className="text-muted small">{record.email}</div>
        </div>
      ),
    },
    {
      title: "Manager",
      dataIndex: "manager",
      key: "manager",
      render: (manager: any) => {
        if (!manager) return <span className="text-muted">Not Assigned</span>;
        return (
          <div>
            <div>{`${manager.firstName} ${manager.lastName}`}</div>
            <div className="text-muted small">{manager.email}</div>
          </div>
        );
      },
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
      render: (_: any, record: Branch) => (
        <div className="d-flex gap-2">
          {can('branch:update') && (
            <Button
              type="link"
              icon={<EditOutlined />}
              onClick={() => handleEdit(record)}
              className="p-0"
            >
              Edit
            </Button>
          )}
          {can('branch:delete') && (
            <Button
              type="link"
              danger
              icon={<DeleteOutlined />}
              onClick={() => handleDelete(record)}
              className="p-0"
            >
              Delete
            </Button>
          )}
        </div>
      ),
    },
  ];

  if (!session || session.user.role !== UserRole.ADMIN) {
    return null;
  }

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Branch Management</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Branch Management</li>
                </ol>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <div className="row align-items-center">
                <div className="col-lg-6 col-md-12 mb-3 mb-lg-0">
                  <Input
                    placeholder="Search by name, code, or city..."
                    prefix={<SearchOutlined />}
                    value={searchText}
                    onChange={(e) => handleSearch(e.target.value)}
                    allowClear
                    className="w-100"
                  />
                </div>
                <div className="col-lg-3 col-md-6 mb-3 mb-lg-0">
                  <Select
                    value={statusFilter === undefined ? "all" : statusFilter ? "active" : "inactive"}
                    onChange={handleStatusChange}
                    className="w-100"
                  >
                    <Option value="all">All Status</Option>
                    <Option value="active">Active</Option>
                    <Option value="inactive">Inactive</Option>
                  </Select>
                </div>
                <div className="col-lg-3 col-md-6 text-lg-end">
                  <div className="d-flex gap-2">
                    {can('branch:create') && (
                      <Button
                        icon={<UploadOutlined />}
                        onClick={() => setShowBulkImportExport(true)}
                      >
                        Bulk Import/Export
                      </Button>
                    )}
                    {can('branch:create') && (
                      <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={handleCreate}
                      >
                        Add Branch
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="card-body">
              <div className="d-none d-md-block">
                <Table
                  columns={columns}
                  dataSource={branches}
                  loading={loading}
                  rowKey="_id"
                  pagination={{
                    current: currentPage,
                    pageSize: pageSize,
                    total: totalCount,
                    onChange: (page, size) => {
                      setCurrentPage(page);
                      setPageSize(size || 10);
                    },
                    showSizeChanger: true,
                    showTotal: (total) => `Total ${total} branches`,
                  }}
                />
              </div>

              <div className="d-md-none">
                {loading ? (
                  <div className="text-center py-5">
                    <div className="spinner-border text-primary" role="status">
                      <span className="visually-hidden">Loading...</span>
                    </div>
                  </div>
                ) : branches.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    No branches found
                  </div>
                ) : (
                  <>
                    {branches.map((branch) => (
                      <div key={branch._id} className="card mb-3">
                        <div className="card-body">
                          <div className="d-flex justify-content-between align-items-start mb-3">
                            <div>
                              <h6 className="mb-1">{branch.name}</h6>
                              <small className="text-muted">{branch.code}</small>
                            </div>
                            <Tag color={branch.isActive ? "success" : "error"}>
                              {branch.isActive ? "Active" : "Inactive"}
                            </Tag>
                          </div>
                          <div className="mb-2">
                            <small className="text-muted d-block">Location:</small>
                            <span>{branch.city}, {branch.state}</span>
                          </div>
                          <div className="mb-2">
                            <small className="text-muted d-block">Contact:</small>
                            <span>{branch.phone}</span>
                          </div>
                          {branch.manager && (
                            <div className="mb-3">
                              <small className="text-muted d-block">Manager:</small>
                              <span>{`${(branch.manager as any).firstName} ${(branch.manager as any).lastName}`}</span>
                            </div>
                          )}
                          <div className="d-flex gap-2">
                            {can('branch:update') && (
                              <Button
                                type="primary"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={() => handleEdit(branch)}
                                block
                              >
                                Edit
                              </Button>
                            )}
                            {can('branch:delete') && (
                              <Button
                                danger
                                size="small"
                                icon={<DeleteOutlined />}
                                onClick={() => handleDelete(branch)}
                                block
                              >
                                Delete
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="d-flex justify-content-center mt-3">
                      <Button
                        onClick={() => setCurrentPage(currentPage - 1)}
                        disabled={currentPage === 1}
                        className="me-2"
                      >
                        Previous
                      </Button>
                      <span className="align-self-center mx-2">
                        Page {currentPage} of {Math.ceil(totalCount / pageSize)}
                      </span>
                      <Button
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={currentPage >= Math.ceil(totalCount / pageSize)}
                        className="ms-2"
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <BranchModal
        visible={isModalVisible}
        branch={selectedBranch}
        onClose={handleModalClose}
      />

      <BulkImportExport
        schema={branchSchema}
        moduleName="Branch"
        onImport={handleBulkImport}
        onExport={handleBulkExport}
        isOpen={showBulkImportExport}
        onClose={() => setShowBulkImportExport(false)}
      />
    </>
  );
};

export default BranchManagement;
