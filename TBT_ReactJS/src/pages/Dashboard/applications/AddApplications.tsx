"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import Button from "../../../components/Atomic/Button";
import InputField from "@/components/Molecules/InputField";
import PhoneInputField from "@/components/Molecules/PhoneInputField";
import RadioGroup from "@/components/Molecules/RadioGroup";
import TextEditorField from "@/components/Molecules/TextEditorField";
import { ENTITY_STATUS, ENTITY_STATUS_OPTIONS } from "@/constants/entityStatus";
import { AppDispatch } from "@/redux/store";
import { useDispatch } from "react-redux";
import { createNewApplication } from "@/redux/applications/applicationSlice";
import { Application } from "@/redux/applications/applicationTypes";
import { Organization } from "@/redux/organizations/organizationTypes";
import SelectField from "@/components/Molecules/SelectField";
import { getAllOrganizations } from "@/services/organizationService";
import {
  phoneNumberValidator,
  emailValidator,
  requiredStringValidator,
  idValidator,
  validateForm,
} from "@/lib/validationSchemas";
import useToast from "@/hooks/useToast";

// Yup validation schema using reusable validators
const applicationValidationSchema = yup.object({
  name: requiredStringValidator("Application name", 2, 200),
  organization_id: idValidator("Organization"),
  service_phone_number: phoneNumberValidator,
  service_email: emailValidator,
  remarks: yup.string().nullable().optional(),
});

const AddApplications: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { success: toastSuccess, error: toastError } = useToast();

  const [formData, setFormData] = useState<Application>({
    name: "",
    organization_id: undefined,
    service_phone_number: "",
    service_email: "",
    status: ENTITY_STATUS.ACTIVE,
    description: "",
    remarks: "",
    hash: crypto.randomUUID(),
  });

  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const [isSubmitting, setIsSubmitting] = useState(false);

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


  // const handleSubmit = async () => {
  //     setIsSubmitting(true)
  //     try {
  //         console.log("Form submitted:", formData)
  //         // Simulate API call
  //         await new Promise((resolve) => setTimeout(resolve, 2000))
  //         // Handle success
  //     } catch (error) {
  //         console.error("Submission error:", error)
  //     } finally {
  //         setIsSubmitting(false)
  //     }
  // }

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form with reusable helper
    const { isValid, errors: validationErrors } = await validateForm(
      applicationValidationSchema,
      formData
    );
    
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const result = await dispatch(createNewApplication(formData));
      if (createNewApplication.fulfilled.match(result)) {
        console.log("Application created successfully:", result.payload);
        toastSuccess("Application created successfully");
        navigate("/dashboard/applications");
      } else {
        console.error("Failed to create application:", result.error);
        toastError(result.error?.message || "Failed to create application");
      }
      // Optionally, navigate or reset form here
    } catch (error) {
      console.error("Submission error:", error);
      toastError((error as Error)?.message || "Submission error");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  //   const handleCancel = () => {
  //     console.log("Form cancelled");
  //     // Reset form or navigate away
  //   };

  const statusOptions = ENTITY_STATUS_OPTIONS;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textColor-base">
        Add New Application
      </h1>

      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
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
              value={formData.organization_id ? String(formData.organization_id) : ""}
              onChange={(value) =>
                handleInputChange("organization_id", Number(value))
              }
              options={organizations.map((o) => ({
                value: String(o.id),
                label: o.name,
              }))}
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

export default AddApplications;
