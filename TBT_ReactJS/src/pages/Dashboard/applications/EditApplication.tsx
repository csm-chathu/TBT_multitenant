"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../../components/Atomic/Button";
import InputField from "@/components/Molecules/InputField";
import PhoneInputField from "@/components/Molecules/PhoneInputField";
import RadioGroup from "@/components/Molecules/RadioGroup";
import TextEditorField from "@/components/Molecules/TextEditorField";
import { ENTITY_STATUS, ENTITY_STATUS_OPTIONS } from "@/constants/entityStatus";
import { Application } from "@/redux/applications/applicationTypes";
import { Organization } from "@/redux/organizations/organizationTypes";
import {
  fetchApplicationById,
  updateExistingApplication,
} from "@/redux/applications/applicationSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import SelectField from "@/components/Molecules/SelectField";
import { getAllOrganizations } from "@/services/organizationService";
import { getAllApplications } from "@/services/applicationService";
import useToast from "@/hooks/useToast";

const EditApplications: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { hash } = useParams<{ hash: any }>();
  const dispatch = useAppDispatch();
  const { success: toastSuccess, error: toastError } = useToast();
  const application = useAppSelector(
    (state) => state.applications.selectedApplicaton
  );

  const [formData, setFormData] = useState<Application>({
    name: "",
    organization_id: undefined,
    service_phone_number: "",
    service_email: "",
    status: ENTITY_STATUS.ACTIVE,
    description: "",
    remarks: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name || formData.name.trim() === "") {
      newErrors.name = "Application name is required";
    }

    if (!formData.organization_id) {
      newErrors.organization_id = "Organization is required";
    }

    if (!formData.service_phone_number || formData.service_phone_number.trim() === "") {
      newErrors.service_phone_number = "Phone number is required";
    } else if (!/^\d+$/.test(formData.service_phone_number.replace(/[\s\-\(\)\+]/g, ""))) {
      newErrors.service_phone_number = "Phone number should only contain numbers";
    }

    if (!formData.service_email || formData.service_email.trim() === "") {
      newErrors.service_email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.service_email)) {
      newErrors.service_email = "Please enter a valid email address";
    }


    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof Application, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };


  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      if (!application?.id) {
        console.error("Application ID is missing");
        return;
      }

      const updatedFormData: Application = {
        ...formData,
        id: application.id,
      };

      console.log("Dispatching update with:", {
        id: application.id,
        data: updatedFormData,
      });

      await dispatch(
        updateExistingApplication({
          id: application.id,
          data: updatedFormData,
        })
      ).unwrap();

      console.log("Agent updated successfully");
      toastSuccess("Application updated successfully");
      navigate("/dashboard/applications");
    } catch (error) {
      console.error("Submission error:", error);
      toastError((error as Error)?.message || "Submission error");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // const handleCancel = () => {
  //     console.log("Form cancelled")
  //     // Reset form or navigate away
  // }

  // const organizationOptions = [
  //     { value: "", label: "Select Organization", disabled: true },
  //     { value: "MDI Dev", label: "MDI Dev" },
  //     { value: "KFC", label: "KFC" },
  //     { value: "Dell", label: "Dell" },
  // ]
  const statusOptions = ENTITY_STATUS_OPTIONS;

  useEffect(() => {
    const loadApplication = async () => {
      if (!hash) return;
      
      try {
        // Check if hash is numeric (legacy ID)
        const numericId = parseInt(hash);
        if (!isNaN(numericId) && String(numericId) === hash) {
          dispatch(fetchApplicationById(numericId));
          return;
        }
        
        // Find application by hash
        const allApplications = await getAllApplications();
        const foundApp = allApplications.find((a: any) => {
          const appHash = a.hash || (a as any).hash;
          return appHash === hash || appHash?.endsWith(hash);
        });
        
        if (foundApp?.id) {
          dispatch(fetchApplicationById(foundApp.id));
        }
      } catch (error) {
        console.error("Failed to load application by hash:", error);
      }
    };
    
    loadApplication();
  }, [hash, dispatch]);

  useEffect(() => {
    if (application) {
      setFormData({
        name: application.name || "",
        organization_id:
          application.organization_id || application.organization?.id || undefined,
        service_phone_number: application.service_phone_number || "",
        service_email: application.service_email || "",
        status: application.status || ENTITY_STATUS.ACTIVE,
        description: application.description || "",
        remarks: application.remarks || "",
      });
    }
  }, [application]);

  useEffect(() => {
    const loadOrganizations = async () => {
      try {
        const list = await getAllOrganizations();
        setOrganizations(list);
      } catch (error) {
        console.error("Failed to load organizations", error);
      }
    };
    loadOrganizations();
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textColor-base">
        Edit Application
      </h1>

      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Application Name"
              name="application"
              value={formData.name}
              onChange={(value) => handleInputChange("name", value)}
              placeholder="Application Name"
              required
              disabled={isSubmitting}
              error={errors.name}
            />
            <SelectField
              label="Select Organization"
              name="organization_id"
              value={String(formData.organization_id ?? "")}
              onChange={(value) => handleInputChange("organization_id", Number(value))}
              options={organizations.map((o) => ({ value: String(o.id), label: o.name }))}
              required
              disabled={isSubmitting}
              error={errors.organization_id}
            />
            <PhoneInputField
              label="Phone Number"
              name="phonenumber"
              value={formData.service_phone_number}
              onChange={(value) => handleInputChange("service_phone_number", value)}
              placeholder="Enter Phone Number"
              required
              disabled={isSubmitting}
              error={errors.service_phone_number}
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.service_email}
              onChange={(value) => handleInputChange("service_email", value)}
              placeholder="Enter Email"
              required
              disabled={isSubmitting}
              error={errors.service_email}
            />
            <div className="col-span-2">
              <RadioGroup
                label="Select Status"
                name="status"
                value={formData.status}
                onChange={(value) =>
                  handleInputChange("status", value as Application["status"])
                }
                options={statusOptions}
                required
                disabled={isSubmitting}
              />
            </div>

            <TextEditorField
              label="Application Description"
              name="description"
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              disabled={isSubmitting}
              placeholder="Enter application description here..."
            />

              <TextEditorField
                label="Remark"
                name="remark"
                value={formData.remarks}
                onChange={(value) => handleInputChange("remarks", value)}
                disabled={isSubmitting}
                error={errors.remarks}
                placeholder="Enter remark here..."
              />
          </div>

          <div className="flex justify-end space-x-4">
            <Button
              style="Tertiary"
              text="Cancel"
              onClick={() => navigate(-1)}
            />
            <Button type="submit" text="Submit" loading={loading} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditApplications;
