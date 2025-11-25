"use client";
import { useState, useEffect, ChangeEvent, FormEvent } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";
import SettingsTabs from "./SettingsTabs";
import { City, Country, State } from "../../../core/json/selectOption";
import Link from "next/link";
import { all_routes } from "@/router/all_routes";
import ImageWithBasePath from "@/core/common-components/image-with-base-path";
import CommonSelect from "@/core/common-components/common-select/commonSelect";
import CommonFooter from "@/core/common-components/common-footer/commonFooter";
import { apiClient } from "@/lib/services/api-client";

interface ProfileData {
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber: string;
  hospitalName: string;
  addressLine1: string;
  addressLine2: string;
  pincode: string;
  country: string;
  state: string;
  city: string;
  profileImage?: string;
}

const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ALLOWED_FILE_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

const GeneralSettingsComponent = () => {
  const { data: session, update: updateSession } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const [formData, setFormData] = useState<ProfileData>({
    firstName: "",
    lastName: "",
    email: "",
    phoneNumber: "",
    hospitalName: "",
    addressLine1: "",
    addressLine2: "",
    pincode: "",
    country: "",
    state: "",
    city: "",
    profileImage: "",
  });

  useEffect(() => {
    if (session?.user) {
      fetchUserProfile();
    }
  }, [session]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<{ user: any }>("/api/users/profile", {
        showErrorToast: false,
      });

      const userData = response.user;
      setFormData({
        firstName: userData.firstName || "",
        lastName: userData.lastName || "",
        email: userData.email || "",
        phoneNumber: userData.phoneNumber || "",
        hospitalName: userData.hospitalName || "",
        addressLine1: userData.addressLine1 || "",
        addressLine2: userData.addressLine2 || "",
        pincode: userData.pincode || "",
        country: userData.country || "",
        state: userData.state || "",
        city: userData.city || "",
        profileImage: userData.profileImage || "",
      });
    } catch (error: any) {
      console.error("Failed to fetch user profile:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value?.value || "",
    }));
  };

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_FILE_TYPES.includes(file.type)) {
      return "Invalid file type. Only JPEG, PNG, and GIF are allowed.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size exceeds 5MB limit.";
    }

    return null;
  };

  const handleFileSelect = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validationError = validateFile(file);
    if (validationError) {
      toast.error(validationError);
      e.target.value = "";
      return;
    }

    setSelectedFile(file);

    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select an image first");
      return;
    }

    try {
      setIsUploading(true);

      const formDataToUpload = new FormData();
      formDataToUpload.append("file", selectedFile);

      const response = await fetch("/api/users/profile/upload-image", {
        method: "POST",
        body: formDataToUpload,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to upload image");
      }

      const data = await response.json();

      setFormData((prev) => ({
        ...prev,
        profileImage: data.profileImage,
      }));

      await updateSession({
        profileImage: data.profileImage,
      });

      setImagePreview(null);
      setSelectedFile(null);

      toast.success("Profile image uploaded successfully");
    } catch (error: any) {
      console.error("Image upload error:", error);
      toast.error(error.message || "Failed to upload image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveImage = async () => {
    try {
      setIsUploading(true);

      const response = await fetch("/api/users/profile/upload-image", {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to remove image");
      }

      setFormData((prev) => ({
        ...prev,
        profileImage: "",
      }));

      await updateSession({
        profileImage: null,
      });

      setImagePreview(null);
      setSelectedFile(null);

      toast.success("Profile image removed successfully");
    } catch (error: any) {
      console.error("Image removal error:", error);
      toast.error(error.message || "Failed to remove image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (selectedFile) {
      await handleImageUpload();
    }

    try {
      setIsLoading(true);

      const response = await apiClient.put(
        "/api/users/profile",
        {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          hospitalName: formData.hospitalName,
          addressLine1: formData.addressLine1,
          addressLine2: formData.addressLine2,
          pincode: formData.pincode,
          country: formData.country,
          state: formData.state,
          city: formData.city,
        },
        {
          successMessage: "Profile updated successfully",
        }
      );

      await updateSession({
        firstName: formData.firstName,
        lastName: formData.lastName,
      });

      fetchUserProfile();
    } catch (error: any) {
      console.error("Profile update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const currentProfileImage =
    imagePreview || formData.profileImage || session?.user?.profileImage;

  const selectedCountry = Country.find((c) => c.value === formData.country);
  const selectedState = State.find((s) => s.value === formData.state);
  const selectedCity = City.find((c) => c.value === formData.city);

  return (
    <>
      <div className="page-wrapper">
        <div className="content">
          <div className="d-flex align-items-center justify-content-between gap-2 mb-4 flex-wrap">
            <div className="breadcrumb-arrow">
              <h4 className="mb-1">Settings</h4>
              <div className="text-end">
                <ol className="breadcrumb m-0 py-0">
                  <li className="breadcrumb-item">
                    <Link href={all_routes.dashboard}>Home</Link>
                  </li>
                  <li className="breadcrumb-item active">Settings</li>
                </ol>
              </div>
            </div>
          </div>

          <SettingsTabs />

          <form onSubmit={handleSubmit}>
            <div className="card mb-0">
              <div className="card-header border-0 pb-1">
                <h5 className="mb-0 pt-2">Personal Information</h5>
              </div>
              <div className="card-body">
                <div className="mb-3">
                  <label className="form-label">
                    Profile Image<span className="text-danger ms-1">*</span>
                  </label>
                  <div className="d-flex align-items-center flex-wrap gap-3">
                    <div className="flex-shrink-0">
                      <div className="position-relative d-flex align-items-center border rounded">
                        {currentProfileImage ? (
                          <img
                            src={currentProfileImage}
                            className="avatar avatar-xxl"
                            alt="Profile"
                            style={{ objectFit: "cover" }}
                          />
                        ) : (
                          <ImageWithBasePath
                            src="assets/img/avatars/avatar-44.jpg"
                            className="avatar avatar-xxl"
                            alt="Default"
                          />
                        )}
                      </div>
                    </div>
                    <div className="d-inline-flex flex-column align-items-start">
                      <div className="d-inline-flex align-items-start gap-2">
                        <div className="drag-upload-btn btn btn-dark position-relative mb-2">
                          <i className="ti ti-arrows-exchange-2 me-1" />
                          Change Image
                          <input
                            type="file"
                            className="form-control image-sign"
                            accept="image/jpeg,image/png,image/gif"
                            onChange={handleFileSelect}
                            disabled={isUploading}
                          />
                        </div>
                        {selectedFile && (
                          <button
                            type="button"
                            className="btn btn-success"
                            onClick={handleImageUpload}
                            disabled={isUploading}
                          >
                            {isUploading ? (
                              <>
                                <span className="spinner-border spinner-border-sm me-1" />
                                Uploading...
                              </>
                            ) : (
                              <>
                                <i className="ti ti-upload me-1" />
                                Upload
                              </>
                            )}
                          </button>
                        )}
                        {formData.profileImage && !selectedFile && (
                          <button
                            type="button"
                            className="btn btn-danger d-flex align-items-center gap-1"
                            onClick={handleRemoveImage}
                            disabled={isUploading}
                          >
                            <i className="ti ti-trash" /> Remove
                          </button>
                        )}
                      </div>
                      <span className="fs-13 text-body">
                        Use JPEG, PNG, or GIF. Best size: 200x200 pixels. Keep
                        it under 5MB
                      </span>
                      {selectedFile && (
                        <span className="fs-13 text-success mt-1">
                          Selected: {selectedFile.name}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="border-bottom mb-3 pb-3 justify-content-center">
                  <div className="row">
                    <div className="col-xl-4 col-md-6">
                      <div className="mb-3 mb-lg-0">
                        <label className="form-label">Hospital Name</label>
                        <input
                          type="text"
                          className="form-control"
                          name="hospitalName"
                          value={formData.hospitalName}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-xl-4 col-md-6">
                      <div className="mb-3 mb-lg-0">
                        <label className="form-label">Email</label>
                        <input
                          type="email"
                          className="form-control"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                    <div className="col-xl-4 col-md-6">
                      <div className="mb-0 w-100">
                        <label className="form-label d-block">
                          Mobile Number
                        </label>
                        <input
                          type="text"
                          className="form-control w-100"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-bottom mb-3">
                  <h5 className="mb-3">Address</h5>
                  <div className="row">
                    <div className="col-xl-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Address Line 1</label>
                        <input
                          type="text"
                          className="form-control"
                          name="addressLine1"
                          value={formData.addressLine1}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-xl-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Address Line 2</label>
                        <input
                          type="text"
                          className="form-control"
                          name="addressLine2"
                          value={formData.addressLine2}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-xl-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Pincode</label>
                        <input
                          type="text"
                          className="form-control"
                          name="pincode"
                          value={formData.pincode}
                          onChange={handleInputChange}
                        />
                      </div>
                    </div>
                    <div className="col-xl-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">Country</label>
                        <CommonSelect
                          options={Country}
                          className="select"
                          value={selectedCountry}
                          onChange={(option: any) =>
                            handleSelectChange("country", option)
                          }
                        />
                      </div>
                    </div>
                    <div className="col-xl-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">State</label>
                        <CommonSelect
                          options={State}
                          className="select"
                          value={selectedState}
                          onChange={(option: any) =>
                            handleSelectChange("state", option)
                          }
                        />
                      </div>
                    </div>
                    <div className="col-xl-4 col-md-6">
                      <div className="mb-3">
                        <label className="form-label">City</label>
                        <CommonSelect
                          options={City}
                          className="select"
                          value={selectedCity}
                          onChange={(option: any) =>
                            handleSelectChange("city", option)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="d-flex align-items-center justify-content-end gap-2">
                  <button
                    type="button"
                    className="btn btn-white"
                    onClick={() => fetchUserProfile()}
                    disabled={isLoading}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-1" />
                        Saving...
                      </>
                    ) : (
                      "Save Changes"
                    )}
                  </button>
                </div>
              </div>
            </div>
          </form>
        </div>

        <CommonFooter />
      </div>
    </>
  );
};

export default GeneralSettingsComponent;
