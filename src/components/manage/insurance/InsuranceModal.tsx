"use client";
import { useState, useEffect } from "react";
import { Modal, Form, Input, Select, InputNumber, Row, Col } from "antd";
import { apiClient } from "@/lib/services/api-client";

const { Option } = Select;
const { TextArea } = Input;

interface Insurance {
  _id?: string;
  name: string;
  code: string;
  type: string;
  coveragePercentage: number;
  description?: string;
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  address?: string;
}

interface InsuranceModalProps {
  visible: boolean;
  insurance: Insurance | null;
  onClose: (shouldRefresh?: boolean) => void;
}

const InsuranceModal: React.FC<InsuranceModalProps> = ({ visible, insurance, onClose }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (visible && insurance) {
      form.setFieldsValue(insurance);
    } else if (visible) {
      form.resetFields();
    }
  }, [visible, insurance, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      const insuranceData = {
        ...values,
        code: values.code.toUpperCase(),
      };

      if (insurance?._id) {
        await apiClient.put(`/api/insurance/${insurance._id}`, insuranceData, {
          successMessage: "Insurance provider updated successfully"
        });
      } else {
        await apiClient.post("/api/insurance", insuranceData, {
          successMessage: "Insurance provider created successfully"
        });
      }

      form.resetFields();
      onClose(true);
    } catch (error) {
      console.error("Failed to save insurance:", error);
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
      title={insurance ? "Edit Insurance Provider" : "Add Insurance Provider"}
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      width={800}
      okText={insurance ? "Update" : "Create"}
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          coveragePercentage: 100,
          type: 'Private'
        }}
      >
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="name"
              label="Provider Name"
              rules={[{ required: true, message: "Please enter provider name" }]}
            >
              <Input placeholder="e.g., Blue Cross Blue Shield" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="code"
              label="Provider Code"
              rules={[
                { required: true, message: "Please enter provider code" },
                { pattern: /^[A-Z0-9]+$/, message: "Code must be uppercase letters and numbers only" }
              ]}
            >
              <Input placeholder="e.g., BCBS" style={{ textTransform: 'uppercase' }} />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="type"
              label="Insurance Type"
              rules={[{ required: true, message: "Please select insurance type" }]}
            >
              <Select placeholder="Select type">
                <Option value="HMO">HMO - Health Maintenance Organization</Option>
                <Option value="PPO">PPO - Preferred Provider Organization</Option>
                <Option value="Government">Government Insurance</Option>
                <Option value="Private">Private Insurance</Option>
                <Option value="Corporate">Corporate Insurance</Option>
                <Option value="Other">Other</Option>
              </Select>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="coveragePercentage"
              label="Coverage Percentage"
              rules={[{ required: true, message: "Please enter coverage percentage" }]}
            >
              <InputNumber
                min={0}
                max={100}
                formatter={value => `${value}%`}
                parser={value => Number(value!.replace('%', '')) as any}
                style={{ width: '100%' }}
              />
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="description"
          label="Description"
        >
          <TextArea rows={3} placeholder="Brief description of the insurance plan" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contactPerson"
              label="Contact Person"
            >
              <Input placeholder="Contact person name" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="contactPhone"
              label="Contact Phone"
            >
              <Input placeholder="Phone number" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="contactEmail"
              label="Contact Email"
              rules={[
                { type: 'email', message: 'Please enter a valid email' }
              ]}
            >
              <Input placeholder="email@example.com" />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="address"
              label="Address"
            >
              <Input placeholder="Provider address" />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
};

export default InsuranceModal;
