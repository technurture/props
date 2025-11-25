"use client";
import { useState, useEffect } from "react";
import { apiClient } from "@/lib/services/api-client";
import { Pharmacy, Branch } from "@/types/emr";

interface PharmacyModalProps {
  type: "add" | "edit" | "view" | "delete";
  product: Pharmacy | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface BranchesResponse {
  branches: Branch[];
}

const PharmacyModal = ({ type, product, onClose, onSuccess }: PharmacyModalProps) => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    productName: "",
    genericName: "",
    category: "",
    manufacturer: "",
    description: "",
    price: "",
    offerPrice: "",
    purchaseDate: "",
    expiryDate: "",
    stock: "",
    unit: "mg",
    minStockLevel: "10",
    batchNumber: "",
    branchId: "",
    isActive: true,
  });

  useEffect(() => {
    fetchBranches();
    if (product && (type === "edit" || type === "view")) {
      setFormData({
        productName: product.productName || "",
        genericName: product.genericName || "",
        category: product.category || "",
        manufacturer: product.manufacturer || "",
        description: product.description || "",
        price: product.price?.toString() || "",
        offerPrice: product.offerPrice?.toString() || "",
        purchaseDate: product.purchaseDate ? formatDateForInput(product.purchaseDate) : "",
        expiryDate: product.expiryDate ? formatDateForInput(product.expiryDate) : "",
        stock: product.stock?.toString() || "",
        unit: product.unit || "mg",
        minStockLevel: product.minStockLevel?.toString() || "10",
        batchNumber: product.batchNumber || "",
        branchId: typeof product.branchId === 'string' ? product.branchId : (product.branchId as Branch)?._id || "",
        isActive: product.isActive !== undefined ? product.isActive : true,
      });
    }
  }, [product, type]);

  const fetchBranches = async () => {
    try {
      const response = await apiClient.get<BranchesResponse>("/api/branches", {
        showErrorToast: false,
      });
      setBranches(response.branches || []);
    } catch (error) {
      console.error("Failed to fetch branches:", error);
    }
  };

  const formatDateForInput = (date: Date | string) => {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatDate = (date: Date | string | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: 'NGN',
    }).format(amount);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        productName: formData.productName,
        genericName: formData.genericName || undefined,
        category: formData.category || undefined,
        manufacturer: formData.manufacturer || undefined,
        description: formData.description || undefined,
        price: parseFloat(formData.price),
        offerPrice: formData.offerPrice ? parseFloat(formData.offerPrice) : undefined,
        purchaseDate: formData.purchaseDate,
        expiryDate: formData.expiryDate,
        stock: parseInt(formData.stock),
        unit: formData.unit,
        minStockLevel: parseInt(formData.minStockLevel),
        batchNumber: formData.batchNumber || undefined,
        branchId: formData.branchId,
        ...(type === "edit" && { isActive: formData.isActive }),
      };

      if (type === "add") {
        await apiClient.post("/api/pharmacy", submitData, {
          successMessage: "Product created successfully",
        });
      } else if (type === "edit" && product?._id) {
        await apiClient.put(`/api/pharmacy/${product._id}`, submitData, {
          successMessage: "Product updated successfully",
        });
      }

      onSuccess();
    } catch (error) {
      console.error("Failed to save product:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!product?._id) return;
    setLoading(true);

    try {
      await apiClient.delete(`/api/pharmacy/${product._id}`, {
        successMessage: "Product deleted successfully",
      });
      onSuccess();
    } catch (error) {
      console.error("Failed to delete product:", error);
    } finally {
      setLoading(false);
    }
  };

  const getBranchName = (branchId: string | Branch | undefined) => {
    if (!branchId) return "N/A";
    if (typeof branchId === 'object') return branchId.name || "N/A";
    const branch = branches.find(b => b._id === branchId);
    return branch?.name || "N/A";
  };

  const getCreatorName = () => {
    if (!product?.createdBy) return "N/A";
    if (typeof product.createdBy === 'object' && 'firstName' in product.createdBy) {
      return `${product.createdBy.firstName} ${product.createdBy.lastName}`;
    }
    return "N/A";
  };

  const getExpiryStatus = () => {
    if (!product?.expiryDate) return null;
    const expiry = new Date(product.expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilExpiry < 0) {
      return { text: "Expired", class: "bg-danger" };
    } else if (daysUntilExpiry <= 30) {
      return { text: "Expiring Soon", class: "bg-warning" };
    }
    return { text: "Valid", class: "bg-success" };
  };

  if (type === "view" && product) {
    const expiryStatus = getExpiryStatus();
    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content">
            <div className="modal-header justify-content-between">
              <h5 className="modal-title">Product Details</h5>
              <button
                type="button"
                className="btn-close btn-close-modal"
                onClick={onClose}
                aria-label="Close"
              >
                <i className="ti ti-circle-x-filled" />
              </button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Product ID</label>
                    <p className="fw-medium">{product.productId}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Status</label>
                    <div>
                      <span className={`badge ${product.isActive ? 'bg-success' : 'bg-secondary'}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Product Name</label>
                    <p className="fw-medium">{product.productName}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Generic Name</label>
                    <p className="fw-medium">{product.genericName || "N/A"}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Category</label>
                    <p className="fw-medium">{product.category || "N/A"}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Manufacturer</label>
                    <p className="fw-medium">{product.manufacturer || "N/A"}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Price</label>
                    <p className="fw-medium">{formatCurrency(product.price)}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Offer Price</label>
                    <p className="fw-medium text-success">
                      {product.offerPrice ? formatCurrency(product.offerPrice) : "N/A"}
                    </p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Purchase Date</label>
                    <p className="fw-medium">{formatDate(product.purchaseDate)}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Expiry Date</label>
                    <div className="d-flex align-items-center gap-2">
                      <p className="fw-medium mb-0">{formatDate(product.expiryDate)}</p>
                      {expiryStatus && (
                        <span className={`badge ${expiryStatus.class}`}>{expiryStatus.text}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label text-muted">Stock</label>
                    <p className="fw-medium">
                      {product.stock}
                      {product.stock <= (product.minStockLevel || 10) && (
                        <span className="badge bg-danger ms-2">Low Stock</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label text-muted">Unit</label>
                    <p className="fw-medium">{product.unit}</p>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label text-muted">Min Stock Level</label>
                    <p className="fw-medium">{product.minStockLevel || 10}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Batch Number</label>
                    <p className="fw-medium">{product.batchNumber || "N/A"}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Branch</label>
                    <p className="fw-medium">{getBranchName(product.branchId)}</p>
                  </div>
                </div>
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label text-muted">Description</label>
                    <p className="fw-medium">{product.description || "N/A"}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Created By</label>
                    <p className="fw-medium">{getCreatorName()}</p>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label text-muted">Created At</label>
                    <p className="fw-medium">{formatDate(product.createdAt)}</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (type === "delete" && product) {
    return (
      <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
        <div className="modal-dialog modal-dialog-centered">
          <div className="modal-content">
            <div className="modal-header justify-content-between">
              <h5 className="modal-title">Delete Product</h5>
              <button
                type="button"
                className="btn-close btn-close-modal"
                onClick={onClose}
                aria-label="Close"
              >
                <i className="ti ti-circle-x-filled" />
              </button>
            </div>
            <div className="modal-body">
              <div className="text-center mb-3">
                <i className="ti ti-trash text-danger" style={{ fontSize: '48px' }} />
              </div>
              <p className="text-center mb-0">
                Are you sure you want to delete <strong>{product.productName}</strong>?
              </p>
              <p className="text-center text-muted">
                This action cannot be undone.
              </p>
            </div>
            <div className="modal-footer d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={loading}
              >
                {loading ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const unitOptions = [
    { value: "mg", label: "mg" },
    { value: "ml", label: "ml" },
    { value: "g", label: "g" },
    { value: "tablets", label: "Tablets" },
    { value: "capsules", label: "Capsules" },
    { value: "units", label: "Units" },
  ];

  return (
    <div className="modal fade show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content">
          <div className="modal-header justify-content-between">
            <h5 className="modal-title">
              {type === "add" ? "Add New Product" : "Edit Product"}
            </h5>
            <button
              type="button"
              className="btn-close btn-close-modal"
              onClick={onClose}
              aria-label="Close"
            >
              <i className="ti ti-circle-x-filled" />
            </button>
          </div>
          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="productName">
                      Product Name <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="productName"
                      name="productName"
                      value={formData.productName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="genericName">
                      Generic Name
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="genericName"
                      name="genericName"
                      value={formData.genericName}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="category">
                      Category
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="manufacturer">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="manufacturer"
                      name="manufacturer"
                      value={formData.manufacturer}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="price">
                      Price <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      id="price"
                      name="price"
                      value={formData.price}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="offerPrice">
                      Offer Price
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      className="form-control"
                      id="offerPrice"
                      name="offerPrice"
                      value={formData.offerPrice}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Purchase Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      name="purchaseDate"
                      value={formData.purchaseDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label">
                      Expiry Date <span className="text-danger">*</span>
                    </label>
                    <input
                      type="date"
                      className="form-control"
                      name="expiryDate"
                      value={formData.expiryDate}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="stock">
                      Stock <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="stock"
                      name="stock"
                      value={formData.stock}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="unit">
                      Unit <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-control"
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      required
                    >
                      {unitOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-4">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="minStockLevel">
                      Min Stock Level
                    </label>
                    <input
                      type="number"
                      className="form-control"
                      id="minStockLevel"
                      name="minStockLevel"
                      value={formData.minStockLevel}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="batchNumber">
                      Batch Number
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      id="batchNumber"
                      name="batchNumber"
                      value={formData.batchNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="branchId">
                      Branch <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-control"
                      id="branchId"
                      name="branchId"
                      value={formData.branchId}
                      onChange={handleChange}
                      required
                    >
                      <option value="">Select Branch</option>
                      {branches.map((branch) => (
                        <option key={branch._id} value={branch._id}>
                          {branch.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {type === "edit" && (
                  <div className="col-md-12">
                    <div className="mb-3">
                      <div className="form-check form-switch">
                        <input
                          type="checkbox"
                          className="form-check-input"
                          id="isActive"
                          name="isActive"
                          checked={formData.isActive}
                          onChange={handleChange}
                        />
                        <label className="form-check-label" htmlFor="isActive">
                          Active
                        </label>
                      </div>
                    </div>
                  </div>
                )}
                <div className="col-md-12">
                  <div className="mb-3">
                    <label className="form-label" htmlFor="description">
                      Description
                    </label>
                    <textarea
                      className="form-control"
                      id="description"
                      name="description"
                      rows={4}
                      value={formData.description}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer d-flex align-items-center gap-1">
              <button
                type="button"
                className="btn btn-outline-light"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={loading}>
                {loading ? "Saving..." : type === "add" ? "Add Product" : "Update Product"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PharmacyModal;
