"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import Button from "../../../components/Atomic/Button";
import InputField from "@/components/Molecules/InputField";
import PhoneInputField from "@/components/Molecules/PhoneInputField";
import SelectField from "@/components/Molecules/SelectField";
import RadioGroup from "@/components/Molecules/RadioGroup";
import TextEditorField from "@/components/Molecules/TextEditorField";
import { ENTITY_STATUS, ENTITY_STATUS_OPTIONS } from "@/constants/entityStatus";
import { CreateAgentDto } from "@/redux/agent/agentTypes";
import { createNewAgent } from "@/redux/agent/agentSlice";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/redux/store";
import { useAppSelector } from "@/redux/hooks";
import { fetchCountries } from "@/redux/country/countrySlice";
import { clearStates, fetchStatesByCountry } from "@/redux/state/stateSlice";
import {
  phoneNumberValidator,
  emailValidator,
  nameValidator,
  htmlContentValidator,
  idValidator,
  addressValidator,
  dobValidator,
  validateForm,
} from "@/lib/validationSchemas";
import useToast from "@/hooks/useToast";

// Yup validation schema using reusable validators
const agentValidationSchema = yup.object({
  first_name: nameValidator("First name"),
  last_name: nameValidator("Last name"),
  nickname: yup.string().optional(),
  email: emailValidator,
  dob: dobValidator(18),
  phone_number: phoneNumberValidator,
  mobile_number: yup
    .string()
    .nullable()
    .optional()
    .test("phone-format", "Phone number can only contain numbers, spaces, dashes, parentheses, and plus sign", (value) => {
      if (!value || value.trim() === "") return true;
      return /^[\d\s\-\(\)\+]+$/.test(value);
    })
    .test("digit-length", "Phone number must be between 10 and 15 digits", (value) => {
      if (!value || value.trim() === "") return true;
      const digitsOnly = value.replace(/\D/g, "");
      return digitsOnly.length >= 10 && digitsOnly.length <= 15;
    }),
  address_line1: addressValidator,
  country_id: idValidator("Country"),
  state_id: idValidator("State/Region"),
  description: htmlContentValidator("Description", 1, 500),
});

const AddAgent: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const { success: toastSuccess, error: toastError } = useToast();

  const [formData, setFormData] = useState<CreateAgentDto>({
    first_name: "",
    last_name: "",
    nickname: "",
    email: "",
    dob: "",
    mobile_number: "",
    phone_number: "",
    address_line1: "",
    country_id: undefined,
    state_id: undefined,
    city: "",
    sex: "Male",
    status: ENTITY_STATUS.ACTIVE,
    description: "",
    remarks: "",
    hash: crypto.randomUUID(),
    createdAt: new Date()
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Redux: countries and states
  const countries = useAppSelector((s) => s.countries.list);
  const states = useAppSelector((s) => s.states.list);

  useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  useEffect(() => {
    if (!formData.country_id) {
      dispatch(clearStates());
      return;
    }
    dispatch(fetchStatesByCountry(Number(formData.country_id)));
  }, [dispatch, formData.country_id]);


  const handleInputChange = (field: keyof CreateAgentDto, value: any) => {
    // normalize IDs to numbers
    const numericFields: Array<keyof CreateAgentDto> = ["country_id", "state_id"];
    const parsedValue = numericFields.includes(field)
      ? value === "" || value === undefined || value === null
        ? undefined
        : Number(value)
      : value;
    setFormData((prev) => ({ ...prev, [field]: parsedValue }));
    
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  // const handleFileUpload = (files: FileList | null) => {
  //   if (files) {
  //     console.log("Files uploaded:", files);
  //   }
  // };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form with reusable helper
    const { isValid, errors: validationErrors } = await validateForm(
      agentValidationSchema,
      formData
    );
    
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      const result = await dispatch(createNewAgent(formData));
      if (createNewAgent.fulfilled.match(result)) {
        console.log("Agent created successfully:", result.payload);
        toastSuccess("Agent created successfully");
        navigate("/dashboard/agents");
      } else {
        console.error("Failed to create agent:", result.error);
        toastError(result.error?.message || "Failed to create agent");
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
  //   console.log("Form cancelled");
  //   // Reset form or navigate away
  // };

  // const titleOptions = [
  //   { value: "", label: "Select Organization", disabled: true },
  //   { value: "MDI Dev", label: "MDI Dev" },
  //   { value: "EVENTCHECKIN", label: "EVENTCHECKIN" },
  // ];
  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];
  const statusOptions = ENTITY_STATUS_OPTIONS;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textColor-base">
          Add New Agent
        </h1>
      </div>

      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* <SelectField
              label="Select title"
              name="title"
              value={formData.title}
              onChange={(value) => handleInputChange("title", value)}
              options={titleOptions}
              required
              disabled={isSubmitting}
            /> */}
            <InputField
              label="first name"
              name="first_name"
              value={formData.first_name}
              onChange={(value) => handleInputChange("first_name", value)}
              placeholder="Enter First Name"
              required
              error={errors.first_name}
              disabled={isSubmitting}
              lettersOnly
            />
            <InputField
              label="Last Name"
              name="lastname"
              value={formData.last_name}
              onChange={(value) => handleInputChange("last_name", value)}
              placeholder="Enter Last Name"
              required
              error={errors.last_name}
              disabled={isSubmitting}
              lettersOnly
            />
            <InputField
              label="Nick Name"
              name="nickname"
              value={formData.nickname}
              onChange={(value) => handleInputChange("nickname", value)}
              placeholder="Enter Nick Name"
              error={errors.nickname}
              disabled={isSubmitting}
              lettersOnly
            />
            <InputField
              label="Email"
              name="email"
              type="email"
              value={formData.email}
              onChange={(value) => handleInputChange("email", value)}
              placeholder="Enter Email"
              required
              error={errors.email}
              disabled={isSubmitting}
            />
            <InputField
              label="Date of Birth"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={(value) => handleInputChange("dob", value)}
              required
              error={errors.dob}
              disabled={isSubmitting}
            />
            <PhoneInputField
              label="Phone Number"
              name="phonenumber"
              value={formData.phone_number}
              onChange={(value) => handleInputChange("phone_number", value)}
              placeholder="Enter Phone Number"
              required
              error={errors.phone_number}
              disabled={isSubmitting}
            />
            <SelectField
              label="Country"
              name="country_id"
              value={formData.country_id ?? ""}
              onChange={(value) => {
                // update country id and reset state_id
                handleInputChange("country_id", value);
                setFormData((prev) => ({ ...prev, state_id: undefined }));
                // immediately fetch states for the selected country so UI updates without waiting for state update
                if (value !== "" && value !== undefined && value !== null) {
                  dispatch(fetchStatesByCountry(Number(value)));
                } else {
                  dispatch(clearStates());
                }
              }}
              options={countries
                .map((c) => ({ value: String(c.id), label: String(c.name) }))
                .sort((a, b) => a.label.localeCompare(b.label))}
              required
              error={errors.country_id}
              disabled={isSubmitting}
            />
            <SelectField
              label="State/Region"
              name="state_id"
              value={formData.state_id ?? ""}
              onChange={(value) => handleInputChange("state_id", value)}
              options={states
                .map((s) => ({ value: String(s.id), label: String(s.name) }))
                .sort((a, b) => a.label.localeCompare(b.label))}
              placeholder={formData.country_id ? "Select state" : "Select country first"}
              required
              error={errors.state_id}
              disabled={isSubmitting || !formData.country_id}
            />
             <PhoneInputField
              label="Mobile Number"
              name="mobile_number"
              value={formData.mobile_number}
              onChange={(value) => handleInputChange("mobile_number", value)}
              placeholder="Enter Mobile Number"
              error={errors.mobile_number}
              disabled={isSubmitting}
            />
            <div className="md:col-span-2">
              <InputField
                label="Address"
                name="address_line1"
                value={formData.address_line1}
                onChange={(value) => handleInputChange("address_line1", value)}
                placeholder="Address Line 1"
                required
                error={errors.address_line1}
                disabled={isSubmitting}
              />
            </div>
            {/* <InputField
              label="Country"
              name="country_id"
              value={formData.country_id}
              onChange={(value) => handleInputChange("country_id", value)}
              placeholder="Enter Country"
              required
              disabled={isSubmitting}
            />
            <InputField
              label="City"
              name="state_id"
              value={formData.state_id}
              onChange={(value) => handleInputChange("state_id", value)}
              placeholder="Enter City"
              required
              disabled={isSubmitting}
            /> */}
            <RadioGroup
              label="Select Gender"
              name="gender"
              value={formData.sex}
              onChange={(value) =>
                handleInputChange("sex", value as CreateAgentDto["sex"])
              }
              options={genderOptions}
              required
              disabled={isSubmitting}
            />
            <RadioGroup
              label="Select Status"
              name="status"
              value={formData.status}
              onChange={(value) =>
                handleInputChange("status", value as CreateAgentDto["status"])
              }
              options={statusOptions}
              required
              disabled={isSubmitting}
            />
            <TextEditorField
              label="Notes"
              name="remarks"
              value={formData.remarks}
              onChange={(value) => handleInputChange("remarks", value)}
              disabled={isSubmitting}
              placeholder="Enter notes here..."
            />

            <TextEditorField
              label="Description"
              name="description"
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              required
              error={errors.description}
              disabled={isSubmitting}
              placeholder="Enter description here..."
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

export default AddAgent;
