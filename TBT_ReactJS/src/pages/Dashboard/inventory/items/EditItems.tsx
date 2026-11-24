"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as yup from "yup";
import Button from "@/components/Atomic/Button";
import InputField from "@/components/Molecules/InputField";
import SelectField from "@/components/Molecules/SelectField";
import TextEditorField from "@/components/Molecules/TextEditorField";
import { Item } from "@/redux/item/itemTypes";
import { useAppSelector } from "@/redux/hooks";
import { useDispatch } from "react-redux";
import { fetchItemById, updateExistingItem } from "@/redux/item/itemSlice";
import { getAllItems } from "@/services/itemService";
import { fetchBrands } from "@/redux/brand/brandSlice";
import { fetchCategories } from "@/redux/category/categorySlice";
import { fetchLocations } from "@/redux/location/locationSlice";
import {
  idValidator,
  oneOfValidator,
  requiredStringValidator,
  htmlContentValidator,
  validateForm,
} from "@/lib/validationSchemas";
import useToast from "@/hooks/useToast";

const itemValidationSchema = yup.object({
  name: requiredStringValidator("Item name", 2, 200),
  category_id: idValidator("Category"),
  brand_id: idValidator("Brand"),
  location_id: idValidator("Location"),
  ownership: oneOfValidator("Ownership", ["Own", "Rent"] as const),
  condition: yup
    .string()
    .oneOf(["", "In Use", "Not In Use", "Not Working"], "Please select a valid condition")
    .notRequired(),
  user: requiredStringValidator("User", 2, 100),
  serialNo: requiredStringValidator("Serial number", 2, 100),
  ipAddress: requiredStringValidator("IP address", 3, 100),
  purchasedAt: requiredStringValidator("Purchase date", 1, 50),
  description: htmlContentValidator("Description", 1, 500),
  remarks: yup.string().nullable().optional(),
});

// Convert an ISO date/time string to YYYY-MM-DD for date inputs
const toDateInputValue = (value?: string | null) => {
  if (!value) return "";
  const parsed = new Date(value);
  if (isNaN(parsed.getTime())) return "";
  return parsed.toISOString().split("T")[0];
};

const EditItems: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<any>();
  const { success: toastSuccess, error: toastError } = useToast();
  const { hash } = useParams<{ hash: any }>();
  const item = useAppSelector((state) => state.items.selectedItem);

  const [formData, setFormData] = useState<Item>({
    name: "",
    category_id: undefined,
    brand_id: undefined,
    location_id: undefined,
    ownership: "",
    condition: "",
    user: "",
    serialNo: "",
    ipAddress: "",
    purchasedAt: "",
    description: "",
    remarks: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof Item, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { isValid, errors: validationErrors } = await validateForm(
      itemValidationSchema,
      formData
    );

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      if (!item?.id) {
        console.error("Item ID is missing");
        return;
      }

      const normalizedPurchasedAt =
        formData.purchasedAt && formData.purchasedAt.trim() !== ""
          ? new Date(formData.purchasedAt).toISOString()
          : undefined;

      const updatedFormData: Item = {
        ...formData,
        id: item.id,
        purchasedAt: normalizedPurchasedAt,
      };

      console.log("Dispatching update with:", {
        id: item.id,
        data: updatedFormData,
      });

      await dispatch(
        updateExistingItem({
          id: item.id,
          data: updatedFormData,
        })
      ).unwrap();

      console.log("Item updated successfully");
      toastSuccess("Item updated successfully");
      navigate("/dashboard/inventory/Items");
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

  // const categoryOptions = [
  //   { value: "", label: "Select Category", disabled: true },
  //   { value: "DESKTOP-1", label: "DESKTOP-1" },
  //   { value: "DESKTOP-2", label: "DESKTOP-2" },
  //   { value: "DESKTOP-3", label: "DESKTOP-3" },
  // ];
  // const ItemOptions = [
  //   { value: "", label: "Select Item", disabled: true },
  //   { value: "Lenova", label: "Lenova" },
  //   { value: "Dell", label: "Dell" },
  //   { value: "Asus", label: "Asus" },
  // ];
  // const locationOptions = [
  //   { value: "", label: "Select Location", disabled: true },
  //   { value: "Option-1", label: "Option-1" },
  //   { value: "Option-2", label: "Option-2" },
  //   { value: "Option-3", label: "Option-3" },
  // ];
  const ownershipOptions = [
    { value: "", label: "Select Ownership", disabled: true },
    { value: "Own", label: "Own" },
    { value: "Rent", label: "Rent" },
  ];
  const conditionOptions = [
    { value: "", label: "Select Condition", disabled: true },
    { value: "In Use", label: "In Use" },
    { value: "Not In Use", label: "Not In Use" },
    { value: "Not Working", label: "Not Working" },
  ];

  // Load select options on mount
  const { brands } = useAppSelector((state) => state.brands);
  const { categories } = useAppSelector((state) => state.categories);
  const { locations } = useAppSelector((state) => state.locations);

  useEffect(() => {
    dispatch(fetchBrands());
    dispatch(fetchCategories());
    dispatch(fetchLocations());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  const categoryOptions = [
    { value: "", label: "Select Category", disabled: true },
    ...categories.map((c) => ({
      value: String(c.id ?? ""),
      label: c.name ?? c.label ?? `Category ${c.id}`,
    })),
  ];
  const brandOptions = [
    { value: "", label: "Select Brand", disabled: true },
    ...brands.map((b) => ({
      value: String(b.id ?? ""),
      label: b.name ?? b.label ?? `Brand ${b.id}`,
    })),
  ];
  const locationOptions = [
    { value: "", label: "Select Location", disabled: true },
    ...locations.map((l) => ({
      value: String(l.id ?? ""),
      label: l.name ?? l.label ?? `Location ${l.id}`,
    })),
  ];

  useEffect(() => {
    const loadItem = async () => {
      if (!hash) return;
      
      try {
        // Check if hash is numeric (legacy ID)
        const numericId = parseInt(hash);
        if (!isNaN(numericId) && String(numericId) === hash) {
          dispatch(fetchItemById(numericId));
          return;
        }
        
        // Find item by hash
        const allItems = await getAllItems();
        const foundItem = allItems.find((i: any) => {
          const itemHash = i.hash || (i as any).hash;
          return itemHash === hash || itemHash?.endsWith(hash);
        });
        
        if (foundItem?.id) {
          dispatch(fetchItemById(foundItem.id));
        }
      } catch (error) {
        console.error("Failed to load item by hash:", error);
      }
    };
    
    loadItem();
  }, [hash, dispatch]);

  useEffect(() => {
    if (item) {
      setFormData({
        name: item.name ?? "",
        category_id: item.category_id,
        brand_id: item.brand_id,
        location_id: item.location_id,
        ownership: item.ownership ?? "",
        condition: item.condition ?? "",
        user: item.user ?? "",
        serialNo: item.serialNo ?? "",
        ipAddress: item.ipAddress ?? "",
        purchasedAt: toDateInputValue(item.purchasedAt),
        description: item.description ?? "",
        remarks: item.remarks ?? "",
      });
    }
  }, [item]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textColor-base">Edit Item</h1>

      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Item Name"
              name="name"
              value={formData.name}
              onChange={(value) => handleInputChange("name", value)}
              placeholder="Item Name"
              required
              disabled={isSubmitting}
              error={errors.name}
            />
            <SelectField
              label="Select Category"
              name="category_id"
              value={formData.category_id ?? ""}
              onChange={(value) =>
                handleInputChange(
                  "category_id",
                  value ? Number(value) : undefined
                )
              }
              options={categoryOptions}
              required
              disabled={isSubmitting}
              error={errors.category_id}
            />
            <SelectField
              label="Select Ownership"
              name="ownership"
              value={formData.ownership}
              onChange={(value) => handleInputChange("ownership", value)}
              options={ownershipOptions}
              required
              disabled={isSubmitting}
              error={errors.ownership}
            />
            <SelectField
              label="Select Condition"
              name="condition"
              value={formData.condition}
              onChange={(value) => handleInputChange("condition", value)}
              options={conditionOptions}
              disabled={isSubmitting}
              error={errors.condition}
            />
            <SelectField
              label="Select Brand"
              name="brand_id"
              value={formData.brand_id ?? ""}
              onChange={(value) =>
                handleInputChange("brand_id", value ? Number(value) : undefined)
              }
              options={brandOptions}
              required
              disabled={isSubmitting}
              error={errors.brand_id}
            />
            <InputField
              label="User"
              name="user"
              value={formData.user}
              onChange={(value) => handleInputChange("user", value)}
              placeholder="Current User"
              required
              disabled={isSubmitting}
              error={errors.user}
            />
            <InputField
              label="Serial Number"
              name="serialNo"
              value={formData.serialNo}
              onChange={(value) => handleInputChange("serialNo", value)}
              placeholder="Enter Serial Number"
              required
              disabled={isSubmitting}
              error={errors.serialNo}
            />
            <InputField
              label="IP Address"
              name="ipAddress"
              value={formData.ipAddress}
              onChange={(value) => handleInputChange("ipAddress", value)}
              placeholder="e.g. 192.168.1.10"
              required
              disabled={isSubmitting}
              error={errors.ipAddress}
            />
            <InputField
              label="Purchase Date"
              name="purchasedAt"
              type="date"
              value={formData.purchasedAt}
              onChange={(value) => handleInputChange("purchasedAt", value)}
              required
              disabled={isSubmitting}
              error={errors.purchasedAt}
            />
            <SelectField
              label="Select Location"
              name="location_id"
              value={formData.location_id ?? ""}
              onChange={(value) =>
                handleInputChange(
                  "location_id",
                  value ? Number(value) : undefined
                )
              }
              options={locationOptions}
              required
              disabled={isSubmitting}
              error={errors.location_id}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <TextEditorField
              label="Item Description"
              name="description"
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              required
              disabled={isSubmitting}
              error={errors.description}
              placeholder="Enter item description here..."
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

export default EditItems;
