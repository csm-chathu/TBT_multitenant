"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as yup from "yup";
import Button from "@/components/Atomic/Button";
import InputField from "@/components/Molecules/InputField";
import TextEditorField from "@/components/Molecules/TextEditorField";
import { Location } from "@/redux/location/locationTypes";
import { useDispatch, useSelector } from "react-redux";
import { useAppSelector } from "@/redux/hooks";
import {
  fetchLocationById,
  updateExistingLocation,
} from "@/redux/location/locationSlice";
import { AppDispatch, RootState } from "@/redux/store";
import { fetchCountries } from "@/redux/country/countrySlice";
import { fetchOrganizations } from "@/redux/organizations/organizationSlice";
import SelectField from "@/components/Molecules/SelectField";
import { getAllLocations } from "@/services/locationService";
import {
  requiredStringValidator,
  htmlContentValidator,
  idValidator,
  validateForm,
} from "@/lib/validationSchemas";
import useToast from "@/hooks/useToast";

// Yup validation schema using reusable validators
const locationValidationSchema = yup.object({
  name: requiredStringValidator("Location name", 2, 200),
  country_id: idValidator("Country"),
  organization_id: idValidator("Organization"),
  description: htmlContentValidator("Description", 1, 500),
  remarks: yup.string().nullable().optional(),
});

const EditdLocation: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { success: toastSuccess, error: toastError } = useToast()
  const { hash } = useParams<{ hash: any }>();
  const location = useAppSelector((state) => state.locations.selectedLocation);
  const countries = useSelector((state: RootState) => state.countries.list);
  const organizations = useSelector((state: RootState) => state.organizations.list);

  const [formData, setFormData] = useState<Location>({
    name: "",
    description: "",
    remarks: "",
    country_id: undefined,
    organization_id: undefined,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof Location, value: any) => {
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
      locationValidationSchema,
      formData
    );
    
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      if (!location?.id) {
        console.error("Location ID is missing");
        return;
      }

      const updatedFormData: Location = {
        ...formData,
        id: location.id,
      };

      console.log("Dispatching update with:", {
        id: location.id,
        data: updatedFormData,
      });

      await dispatch(
        updateExistingLocation({
          id: location.id,
          data: updatedFormData,
        })
      ).unwrap();

      console.log("Item updated successfully");
      toastSuccess("Location updated successfully");
      navigate("/dashboard/inventory/locations");
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
    const loadLocation = async () => {
      if (!hash) {
        dispatch(fetchCountries());
        dispatch(fetchOrganizations());
        return;
      }
      
      try {
        // Check if hash is numeric (legacy ID)
        const numericId = parseInt(hash);
        if (!isNaN(numericId) && String(numericId) === hash) {
          dispatch(fetchLocationById(numericId));
          dispatch(fetchCountries());
          dispatch(fetchOrganizations());
          return;
        }
        
        // Find location by hash
        const allLocations = await getAllLocations();
        const foundLocation = allLocations.find((l: any) => {
          const locationHash = l.hash || (l as any).hash;
          return locationHash === hash || locationHash?.endsWith(hash);
        });
        
        if (foundLocation?.id) {
          dispatch(fetchLocationById(foundLocation.id));
        }
        dispatch(fetchCountries());
        dispatch(fetchOrganizations());
      } catch (error) {
        console.error("Failed to load location by hash:", error);
        dispatch(fetchCountries());
        dispatch(fetchOrganizations());
      }
    };
    
    loadLocation();
  }, [hash, dispatch]);

  useEffect(() => {
    if (location) {
      setFormData({
        name: location.name || "",
        description: location.description || "",
        remarks: location.remarks || "",
        country_id: (location.country_id !== null && location.country_id !== undefined) ? location.country_id : undefined,
        organization_id: (location.organization_id !== null && location.organization_id !== undefined) ? location.organization_id : undefined,
      });
    }
  }, [location]);

  const countryOptions = useMemo(
    () => countries.map((c) => ({ value: String(c.id ?? ""), label: c.name ?? "" })),
    [countries]
  );

  const organizationOptions = useMemo(
    () => organizations.map((o) => ({ value: String(o.id ?? ""), label: o.name ?? "" })),
    [organizations]
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textColor-base">Edit Location</h1>

      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:col-span-2">
              <InputField
                label="Location Name"
                name="name"
                value={formData.name}
                onChange={(value) => handleInputChange("name", value)}
                placeholder="Enter Location Name"
                required
                disabled={isSubmitting}
                error={errors.name}
              />
              <SelectField
                label="Country"
                name="country_id"
                value={formData.country_id !== undefined && formData.country_id !== null ? String(formData.country_id) : ""}
                onChange={(value) => handleInputChange("country_id", value ? Number(value) : undefined)}
                options={countryOptions}
                placeholder="Select country"
                required
                disabled={isSubmitting}
                error={errors.country_id}
              />
              <SelectField
                label="Organization"
                name="organization_id"
                value={formData.organization_id !== undefined && formData.organization_id !== null ? String(formData.organization_id) : ""}
                onChange={(value) => handleInputChange("organization_id", value ? Number(value) : undefined)}
                options={organizationOptions}
                placeholder="Select organization"
                required
                disabled={isSubmitting}
                error={errors.organization_id}
              />
            </div>
            <TextEditorField
              label="Location Description"
              name="description"
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              required
              disabled={isSubmitting}
              error={errors.description}
              placeholder="Enter location description here..."
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

export default EditdLocation;
