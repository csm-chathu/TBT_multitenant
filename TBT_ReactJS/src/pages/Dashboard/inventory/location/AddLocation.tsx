"use client"

import type React from "react"
import { useEffect, useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import * as yup from "yup"
import Button from "@/components/Atomic/Button"
import InputField from "@/components/Molecules/InputField"
import TextEditorField from "@/components/Molecules/TextEditorField"
import { Location } from "@/redux/location/locationTypes"
import { useDispatch, useSelector } from "react-redux"
import { AppDispatch, RootState } from "@/redux/store"
import { createNewLocation } from "@/redux/location/locationSlice"
import { fetchCountries } from "@/redux/country/countrySlice"
import { fetchOrganizations } from "@/redux/organizations/organizationSlice"
import SelectField from "@/components/Molecules/SelectField"
import {
  requiredStringValidator,
  htmlContentValidator,
  idValidator,
  validateForm,
} from "@/lib/validationSchemas"
import useToast from "@/hooks/useToast"

// Yup validation schema using reusable validators
const locationValidationSchema = yup.object({
  name: requiredStringValidator("Location name", 2, 200),
  country_id: idValidator("Country"),
  organization_id: idValidator("Organization"),
  description: htmlContentValidator("Description", 1, 500),
  remarks: yup.string().nullable().optional(),
});

const AddLocation: React.FC = () => {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(false)
    const dispatch = useDispatch<AppDispatch>();
    const { success: toastSuccess, error: toastError } = useToast()
    const countries = useSelector((state: RootState) => state.countries.list)
    const organizations = useSelector((state: RootState) => state.organizations.list)

    const [formData, setFormData] = useState<Location>({
        name: "",
        description: "",
        remarks: "",
        country_id: undefined,
        organization_id: undefined,
    })
    useEffect(() => {
      dispatch(fetchCountries());
      dispatch(fetchOrganizations());
    }, [dispatch])

    // Set default values for country and organization when data is loaded
    // Now select the first available option instead of matching by name
    useEffect(() => {
      if (countries.length > 0 || organizations.length > 0) {
        setFormData((prev) => {
          const updated: Location = { ...prev };

          // Default to first country in the list if not already set
          if (!prev.country_id && countries.length > 0) {
            updated.country_id = countries[0].id;
          }

          // Default to first organization in the list if not already set
          if (!prev.organization_id && organizations.length > 0) {
            updated.organization_id = organizations[0].id;
          }

          return updated;
        });
      }
    }, [countries, organizations]);

    const countryOptions = useMemo(
      () => countries.map((c) => ({ value: String(c.id ?? ""), label: c.name ?? "" })),
      [countries]
    )

    const organizationOptions = useMemo(
      () => organizations.map((o) => ({ value: String(o.id ?? ""), label: o.name ?? "" })),
      [organizations]
    )


    const [isSubmitting, setIsSubmitting] = useState(false)
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleInputChange = (field: keyof Location, value: any) => {
        setFormData((prev) => ({ ...prev, [field]: value }))
        // Clear error for this field when user starts typing
        if (errors[field]) {
          setErrors((prev) => {
            const newErrors = { ...prev }
            delete newErrors[field]
            return newErrors
          })
        }
    }

    const generateLocationHash = (locationName: string): string => {
      const timestamp = Date.now();
      const randomSuffix = Math.random().toString(36).substring(2, 8);
      return `${locationName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}-${randomSuffix}`;
    };

    const handleSubmit = async (event: React.FormEvent) => {
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
          // Generate a unique hash for the location
          const locationData = {
            ...formData,
            hash: generateLocationHash(formData.name || 'location'),
          } as Location;

          const result = await dispatch(createNewLocation(locationData));
          if (createNewLocation.fulfilled.match(result)) {
            console.log("Location created successfully:", result.payload);
            toastSuccess("Location created successfully");
            navigate("/dashboard/inventory/locations");
          } else {
            console.error("Failed to create location:", result.error);
            toastError(result.error?.message || "Failed to create location");
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

    // const handleCancel = () => {
    //     console.log("Form cancelled")
    //     // Reset form or navigate away
    // }

    return (
        <div className="space-y-6">

            <h1 className="text-2xl font-bold text-textColor-base">Add New Location</h1>

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
                              value={formData.country_id !== undefined ? String(formData.country_id) : undefined}
                              onChange={(value) => handleInputChange("country_id", Number(value))}
                              options={countryOptions}
                              placeholder="Select country"
                              required
                              disabled={isSubmitting}
                              error={errors.country_id}
                          />
                          <SelectField
                              label="Organization"
                              name="organization_id"
                              value={formData.organization_id !== undefined ? String(formData.organization_id) : undefined}
                              onChange={(value) => handleInputChange("organization_id", Number(value))}
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
                            error={errors.remarks}
                            placeholder="Enter remark here..."
                        />
                    </div>

                    <div className="flex justify-end space-x-4">
                        <Button style="Tertiary" text="Cancel" onClick={() => navigate(-1)} />
                        <Button type="submit" text="Submit" loading={loading} />
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AddLocation
