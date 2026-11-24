"use client";

import type React from "react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import Button from "@/components/Atomic/Button";
import InputField from "@/components/Molecules/InputField";
import TextEditorField from "@/components/Molecules/TextEditorField";
import { Category } from "@/redux/category/categoryTypes";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { createNewCategory } from "@/redux/category/categorySlice";
import {
  requiredStringValidator,
  htmlContentValidator,
  validateForm,
} from "@/lib/validationSchemas";
import useToast from "@/hooks/useToast";

// Yup validation schema using reusable validators
const categoryValidationSchema = yup.object({
  name: requiredStringValidator("Category name", 2, 200),
  description: htmlContentValidator("Description", 1, 500),
  remarks: yup.string().nullable().optional(),
});

const AddCategory: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { success: toastSuccess, error: toastError } = useToast();

  const [formData, setFormData] = useState<Category>({
    name: "",
    description: "",
    remarks: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof Category, value: any) => {
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

  const generateCategoryHash = (categoryName: string): string => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${categoryName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}-${randomSuffix}`;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form with reusable helper
    const { isValid, errors: validationErrors } = await validateForm(
      categoryValidationSchema,
      formData
    );
    
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);

    try {
      // Generate a unique hash for the category
      const categoryData = {
        ...formData,
        hash: generateCategoryHash(formData.name || 'category'),
      } as Category;

      const result = await dispatch(createNewCategory(categoryData));
      if (createNewCategory.fulfilled.match(result)) {
        console.log("Category created successfully:", result.payload);
        toastSuccess("Category created successfully");
        navigate("/dashboard/inventory/category");
      } else {
        console.error("Failed to create category:", result.error);
        toastError(result.error?.message || "Failed to create category");
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
      <h1 className="text-2xl font-bold text-textColor-base">
        Add New Category
      </h1>

      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <InputField
                label="Category Name"
                name="name"
                value={formData.name}
                onChange={(value) => handleInputChange("name", value)}
                placeholder="Enter Category Name"
                required
                disabled={isSubmitting}
                error={errors.name}
              />
            </div>
            <TextEditorField
              label="Category Description"
              name="description"
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              required
              disabled={isSubmitting}
              error={errors.description}
              placeholder="Enter category description here..."
            />
            <TextEditorField
              label="Remark"
              name="remarks"
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

export default AddCategory;
