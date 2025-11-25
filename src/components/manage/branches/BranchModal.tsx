"use client";
import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, Switch, Row, Col, message } from "antd";
import { createBranch, updateBranch } from "@/lib/services/branches";
import { Branch } from "@/types/emr";
import NigerianLocationSelect from "@/core/common-components/common-select/NigerianLocationSelect";
import { formatLocationName, formatNameToSlug, validateLocation, getWardsForLGA } from "@/lib/utils/nigerian-locations";

const { Option } = Select;

interface BranchModalProps {
  visible: boolean;
  branch: Branch | null;
  onClose: (shouldRefresh?: boolean) => void;
}

const BranchModal: React.FC<BranchModalProps> = ({ visible, branch, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [managers, setManagers] = useState<any[]>([]);
  const [loadingManagers, setLoadingManagers] = useState(false);

  const [locationState, setLocationState] = useState({
    state: "",
    lga: "",
    ward: "",
  });

  const fetchManagers = async () => {
    setLoadingManagers(true);
    try {
      const response = await fetch('/api/staff?role=MANAGER&status=active');
      const data = await response.json();
      if (data.staff) {
        setManagers(data.staff);
      }
    } catch (error) {
      console.error('Failed to fetch managers:', error);
    } finally {
      setLoadingManagers(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchManagers();
    }
  }, [visible]);

  useEffect(() => {
    if (visible && branch) {
      form.setFieldsValue({
        name: branch.name,
        code: branch.code,
        address: branch.address,
        phone: branch.phone,
        email: branch.email,
        manager: branch.manager ? (typeof branch.manager === 'object' ? branch.manager._id : branch.manager) : undefined,
        isActive: branch.isActive,
      });
      
      const branchLga = (branch as any).lga || "";
      const branchWard = (branch as any).ward || "";
      const branchState = branch.state || "";
      
      const derivedLga = branchLga || (branch.city && !branchLga ? branch.city : "");
      
      const stateSlug = formatNameToSlug(branchState);
      const lgaSlug = formatNameToSlug(derivedLga);
      const wardSlug = formatNameToSlug(branchWard);
      
      let validState = "";
      let validLga = "";
      let validWard = "";
      let hasInvalidData = false;
      
      if (stateSlug && validateLocation(stateSlug)) {
        validState = stateSlug;
        
        if (lgaSlug && validateLocation(stateSlug, lgaSlug)) {
          validLga = lgaSlug;
          
          if (wardSlug && validateLocation(stateSlug, lgaSlug, wardSlug)) {
            validWard = wardSlug;
          } else if (wardSlug) {
            hasInvalidData = true;
          }
        } else if (lgaSlug) {
          hasInvalidData = true;
        }
      } else if (stateSlug) {
        hasInvalidData = true;
      }
      
      setLocationState({
        state: validState,
        lga: validLga,
        ward: validWard,
      });
      
      if (hasInvalidData) {
        message.warning("Some location data is outdated. Please reselect the location.");
      }
    } else if (visible) {
      form.resetFields();
      form.setFieldsValue({ isActive: true });
      setLocationState({ state: "", lga: "", ward: "" });
    }
  }, [visible, branch, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      
      if (!locationState.state) {
        message.error("Please select a state");
        return;
      }
      
      if (!locationState.lga) {
        message.error("Please select an LGA (Local Government Area)");
        return;
      }
      
      if (locationState.ward) {
        const wardsForLGA = getWardsForLGA(locationState.state, locationState.lga);
        const wardExists = wardsForLGA.some(w => w.value === locationState.ward);
        
        if (!wardExists) {
          message.error("Selected ward does not belong to the chosen LGA. Please reselect the ward.");
          return;
        }
      }
      
      setLoading(true);

      const branchData = {
        name: values.name,
        code: values.code.toUpperCase(),
        address: values.address,
        city: formatLocationName(locationState.lga),
        state: formatLocationName(locationState.state),
        lga: formatLocationName(locationState.lga),
        ward: formatLocationName(locationState.ward),
        country: 'Nigeria',
        phone: values.phone,
        email: values.email,
        manager: values.manager || undefined,
        isActive: values.isActive !== undefined ? values.isActive : true,
      };

      if (branch?._id) {
        await updateBranch(branch._id, branchData);
      } else {
        await createBranch(branchData);
      }

      form.resetFields();
      onClose(true);
    } catch (error) {
      console.error("Failed to save branch:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose(false);
  };

  return (
    <Modal
      title={branch ? "Edit Branch" : "Add New Branch"}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={800}
      okText={branch ? "Update" : "Create"}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{ isActive: true, country: 'Nigeria' }}
      >
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Branch Name"
              name="name"
              rules={[{ required: true, message: "Please enter branch name" }]}
            >
              <Input placeholder="e.g., Main Branch" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Branch Code"
              name="code"
              rules={[
                { required: true, message: "Please enter branch code" },
                { 
                  pattern: /^[A-Z0-9]+$/, 
                  message: "Code must be uppercase letters and numbers only" 
                }
              ]}
            >
              <Input 
                placeholder="e.g., MN001" 
                onChange={(e) => {
                  form.setFieldsValue({ code: e.target.value.toUpperCase() });
                }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Address"
          name="address"
          rules={[{ required: true, message: "Please enter address" }]}
        >
          <Input.TextArea rows={2} placeholder="Street address" />
        </Form.Item>

        <div className="mb-3">
          <label className="form-label d-block mb-2">
            Location<span className="text-danger">*</span>
          </label>
          <NigerianLocationSelect
            stateValue={locationState.state}
            lgaValue={locationState.lga}
            wardValue={locationState.ward}
            onStateChange={(value) => setLocationState(prev => ({ ...prev, state: value, lga: '', ward: '' }))}
            onLGAChange={(value) => setLocationState(prev => ({ ...prev, lga: value, ward: '' }))}
            onWardChange={(value) => setLocationState(prev => ({ ...prev, ward: value }))}
            stateRequired={true}
            showLabels={true}
          />
        </div>
        
        <Row gutter={16}>
          <Col xs={24}>
            <Form.Item label="Country">
              <Input value="Nigeria" disabled />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Form.Item
              label="Phone"
              name="phone"
              rules={[
                { required: true, message: "Please enter phone number" },
                { 
                  pattern: /^[0-9+\-\s()]+$/, 
                  message: "Please enter a valid phone number" 
                }
              ]}
            >
              <Input placeholder="e.g., +234 123 456 7890" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item
              label="Email"
              name="email"
              rules={[
                { required: true, message: "Please enter email" },
                { type: "email", message: "Please enter a valid email" }
              ]}
            >
              <Input placeholder="e.g., branch@hospital.com" />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          label="Manager"
          name="manager"
          extra="Optional: Assign a manager to this branch. Managers can only manage and monitor their assigned branch."
        >
          <Select 
            placeholder="Search and select branch manager (optional)" 
            allowClear
            showSearch
            loading={loadingManagers}
            filterOption={(input, option) =>
              (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
            }
            options={[
              ...managers.map(manager => ({
                value: manager._id,
                label: `${manager.firstName} ${manager.lastName} (${manager.email})`,
              }))
            ]}
          />
        </Form.Item>

        <Form.Item
          label="Active Status"
          name="isActive"
          valuePropName="checked"
        >
          <Switch 
            checkedChildren="Active" 
            unCheckedChildren="Inactive" 
          />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default BranchModal;
