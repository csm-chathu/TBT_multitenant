"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as yup from "yup";
import Button from "@/components/Atomic/Button";
import InputField from "@/components/Molecules/InputField";
import TextEditorField from "@/components/Molecules/TextEditorField";
import { Brand } from "@/redux/brand/brandTypes";
import { useDispatch } from "react-redux";
import { fetchBrandById, updateExistingBrand } from "@/redux/brand/brandSlice";
import { useAppSelector } from "@/redux/hooks";
import { getAllBrands } from "@/services/brandService";
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

const EditBrand: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<any>();
  const { success: toastSuccess, error: toastError } = useToast();
  const { hash } = useParams<{ hash: any }>();
  const brand = useAppSelector((state) => state.brands.selectedBrand);

  const [formData, setFormData] = useState<Brand>({
    name: "",
    description: "",
    remarks: "",
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
        if (!brand?.id) {
          console.error("Brand ID is missing");
          return;
        }
  
        const updatedFormData: Brand = {
          ...formData,
          id: brand.id,
        };
  
        console.log("Dispatching update with:", {
          id: brand.id,
          data: updatedFormData,
        });
  
        await dispatch(
          updateExistingBrand({
            id: brand.id,
            data: updatedFormData,
          })
        ).unwrap();
  
        console.log("brand updated successfully");
        toastSuccess("Brand updated successfully");
        navigate("/dashboard/inventory/brands");
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

  useEffect(() => {
    const loadBrand = async () => {
      if (!hash) return;
      
      try {
        // Check if hash is numeric (legacy ID)
        const numericId = parseInt(hash);
        if (!isNaN(numericId) && String(numericId) === hash) {
          dispatch(fetchBrandById(numericId));
          return;
        }
        
        // Find brand by hash
        const allBrands = await getAllBrands();
        const foundBrand = allBrands.find((b: any) => {
          const brandHash = b.hash || (b as any).hash;
          return brandHash === hash || brandHash?.endsWith(hash);
        });
        
        if (foundBrand?.id) {
          dispatch(fetchBrandById(foundBrand.id));
        }
      } catch (error) {
        console.error("Failed to load brand by hash:", error);
      }
    };
    
    loadBrand();
  }, [hash, dispatch]);

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name || "",
        description: brand.description || "",
        remarks: brand.remarks || "",
      });
    }
  }, [brand]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textColor-base">Edit Brand</h1>

      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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

export default EditBrand;
