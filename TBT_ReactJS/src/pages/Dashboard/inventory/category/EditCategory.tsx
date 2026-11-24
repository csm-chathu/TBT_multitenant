"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as yup from "yup";
import Button from "@/components/Atomic/Button";
import InputField from "@/components/Molecules/InputField";
import TextEditorField from "@/components/Molecules/TextEditorField";
import { Category } from "@/redux/category/categoryTypes";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/hooks";
import {
  fetchCategoryById,
  updateExistingCategory,
} from "@/redux/category/categorySlice";
import { getAllCategories } from "@/services/categoryService";
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

const EditCategory: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<any>();
  const { success: toastSuccess, error: toastError } = useToast();
  const { hash } = useParams<{ hash: any }>();
  const category = useAppSelector((state) => state.categories.selectedCategory);

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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      if (!category?.id) {
        console.error("Category ID is missing");
        return;
      }

      const updatedFormData: Category = {
        ...formData,
        id: category.id,
      };

      console.log("Dispatching update with:", {
        id: category.id,
        data: updatedFormData,
      });

      await dispatch(
        updateExistingCategory({
          id: category.id,
          data: updatedFormData,
        })
      ).unwrap();

      console.log("category updated successfully");
      toastSuccess("Category updated successfully");
      navigate("/dashboard/inventory/category");
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

  useEffect(() => {
    const loadCategory = async () => {
      if (!hash) return;
      
      try {
        // Check if hash is numeric (legacy ID)
        const numericId = parseInt(hash);
        if (!isNaN(numericId) && String(numericId) === hash) {
          dispatch(fetchCategoryById(numericId));
          return;
        }
        
        // Find category by hash
        const allCategories = await getAllCategories();
        const foundCategory = allCategories.find((c: any) => {
          const categoryHash = c.hash || (c as any).hash;
          return categoryHash === hash || categoryHash?.endsWith(hash);
        });
        
        if (foundCategory?.id) {
          dispatch(fetchCategoryById(foundCategory.id));
        }
      } catch (error) {
        console.error("Failed to load category by hash:", error);
      }
    };
    
    loadCategory();
  }, [hash, dispatch]);

  useEffect(() => {
    if (category) {
      setFormData({
        name: category.name || "",
        description: category.description || "",
        remarks: category.remarks || "",
      });
    }
  }, [category]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textColor-base">Edit Category</h1>

      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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

export default EditCategory;
