"use client";

import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import Button from "@/components/Atomic/Button";
import InputField from "@/components/Molecules/InputField";
import TextEditorField from "@/components/Molecules/TextEditorField";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { Brand } from "@/redux/brand/brandTypes";
import { createNewBrand } from "@/redux/brand/brandSlice";
import {
  requiredStringValidator,
  htmlContentValidator,
  validateForm,
} from "@/lib/validationSchemas";
import useToast from "@/hooks/useToast";

// Yup validation schema using reusable validators
const brandValidationSchema = yup.object({
  name: requiredStringValidator("Brand name", 2, 200),
  description: htmlContentValidator("Description", 1, 500),
  remarks: yup.string().nullable().optional(),
});

const AddBrand: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { success: toastSuccess, error: toastError } = useToast();

  const [formData, setFormData] = useState<Brand>({
    name: "",
    label: "",
    description: "",
    remarks: "",
    hash: "",
    data: "",
    createdAt: new Date(),
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof Brand, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const generateBrandHash = (brandName: string): string => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${brandName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}-${randomSuffix}`;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form with reusable helper
    const { isValid, errors: validationErrors } = await validateForm(
      brandValidationSchema,
      formData
    );
    
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);

    try {
      // Generate a unique hash for the brand
      const brandData = {
        ...formData,
        hash: generateBrandHash(formData.name || 'brand'),
      } as Brand;

      const result = await dispatch(createNewBrand(brandData));
      if (createNewBrand.fulfilled.match(result)) {
        console.log("Brand created successfully:", result.payload);
        toastSuccess("Brand created successfully");
        navigate("/dashboard/inventory/brands");
      } else {
        console.error("Failed to create brand:", result.error);
        toastError(result.error?.message || "Failed to create brand");
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

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textColor-base">Add New Brand</h1>

      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <InputField
                label="Brand Name"
                name="name"
                value={formData.name}
                onChange={(value) => handleInputChange("name", value)}
                placeholder="Enter Brand Name"
                required
                disabled={isSubmitting}
                error={errors.name}
              />
            </div>
            <TextEditorField
              label="Brand Description"
              name="description"
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              required
              disabled={isSubmitting}
              error={errors.description}
              placeholder="Enter brand description here..."
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

export default AddBrand;
