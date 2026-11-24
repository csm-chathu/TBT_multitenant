"use client";

import type React from "react";
import { useEffect, useState } from "react";
import useToast from '@/hooks/useToast'
import { useNavigate, useParams } from "react-router-dom";
import * as yup from "yup";
import Button from "../../../components/Atomic/Button";
import InputField from "@/components/Molecules/InputField";
import PhoneInputField from "@/components/Molecules/PhoneInputField";
import SelectField from "@/components/Molecules/SelectField";
import RadioGroup from "@/components/Molecules/RadioGroup";
import TextEditorField from "@/components/Molecules/TextEditorField";
import { ENTITY_STATUS, ENTITY_STATUS_OPTIONS } from "@/constants/entityStatus";
import { Customer } from "@/redux/customer/customerTypes";
import { fetchCustomerById, updateExistingCustomer } from "@/redux/customer/customerSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchCountries } from "@/redux/country/countrySlice";
import { clearStates, fetchStatesByCountry } from "@/redux/state/stateSlice";
import { getAllCustomers } from "@/services/customerService";
import {
  emailValidator,
  htmlContentValidator,
  nameValidator,
  phoneNumberValidator,
  validateForm,
  oneOfValidator,
} from "@/lib/validationSchemas";

const customerValidationSchema = yup.object({
  first_name: nameValidator("First name"),
  last_name: nameValidator("Last name"),
  email: emailValidator,
  dob: yup.string().optional().nullable().test("valid-date", "Date of birth cannot be in the future", (value) => {
    if (!value) return true;
    const dobDate = new Date(value);
    const today = new Date();
    return dobDate <= today;
  }),
  phone_number: phoneNumberValidator,
  mobile_number: phoneNumberValidator,
  address_line1: yup.string().optional().nullable().max(200, "Address must not exceed 200 characters"),
  country_id: yup.number().optional().nullable(),
  state_id: yup.number().optional().nullable(),
  description: htmlContentValidator("Description", 1, 500),
  sex: oneOfValidator("Gender", ["Male", "Female", "Other"] as const),
  status: oneOfValidator("Status", Object.values(ENTITY_STATUS) as string[]),
});

const EditCustomer: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Customer>({
    // title: "",
    first_name: "",
    last_name: "",
    // nickname: "",
    email: "",
    dob: "",
    phone_number: "",
    mobile_number: "",
    address_line1: "",
    country_id: undefined,
    state_id: undefined,
    // country: "",
    // city: "",
    sex: "Male",
    status: ENTITY_STATUS.ACTIVE,
    description: "",
    remarks: "",
    tag: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [customTag, setCustomTag] = useState<string>("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { hash } = useParams<{ hash: any }>();
  const dispatch = useAppDispatch();
  const { success: toastSuccess, error: toastError } = useToast()
  const customer = useAppSelector((state) => state.customers.selectedCustomer);
  const countries = useAppSelector((s) => s.countries.list);
  const states = useAppSelector((s) => s.states.list);

  const handleInputChange = (field: keyof Customer, value: any) => {
    const numericFields: Array<keyof Customer> = ["country_id", "state_id"];
    const parsedValue = numericFields.includes(field)
      ? value === "" || value === undefined || value === null
        ? undefined
        : Number(value)
      : value;
    setFormData((prev) => ({ ...prev, [field]: parsedValue }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  // const handleFileUpload = (files: FileList | null) => {
  //   if (files) {
  //     console.log("Files uploaded:", files);
  //   }
  // };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { isValid, errors: validationErrors } = await validateForm(
      customerValidationSchema,
      formData
    );

    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      if (!customer?.id) {
        console.error("Agent ID is missing");
        return;
      }

      const updatedFormData: Customer = {
        ...formData,
        id: customer.id,
      };

      console.log("Dispatching update with:", {
        id: customer.id,
        data: updatedFormData,
      });

      await dispatch(
        updateExistingCustomer({
          id: customer.id,
          data: updatedFormData,
        })
      ).unwrap();

      console.log("Customer updated successfully");
      try { toastSuccess('Customer updated successfully') } catch {}
      navigate("/dashboard/customers");
    } catch (error) {
      console.error("Submission error:", error);
      try { toastError('Failed to update customer') } catch {}
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  // const handleCancel = () => {
  //   console.log("Form cancelled");
  //   // Reset form or navigate away
  // };

  useEffect(() => {
    const loadCustomer = async () => {
      if (!hash) return;
      
      try {
        // Check if hash is numeric (legacy ID)
        const numericId = parseInt(hash);
        if (!isNaN(numericId) && String(numericId) === hash) {
          dispatch(fetchCustomerById(numericId));
          return;
        }
        
        // Find customer by hash
        const result = await getAllCustomers();
        const list = Array.isArray(result) ? result : (result as any).data ?? [];
        const foundCustomer = list.find((c: any) => {
          const customerHash = c.hash || (c as any).hash;
          return customerHash === hash || customerHash?.endsWith(hash);
        });
        
        if (foundCustomer?.id) {
          dispatch(fetchCustomerById(foundCustomer.id));
        }
      } catch (error) {
        console.error("Failed to load customer by hash:", error);
      }
    };
    
    loadCustomer();
  }, [hash, dispatch]);

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

  useEffect(() => {
    if (customer) {
      // Extract country_id from nested country object if available
      const countryId = customer.country_id || customer.country?.id || customer.Country?.id;
      // Extract state_id from nested state object if available
      const stateId = customer.state_id || customer.state?.id || customer.State?.id;
      
      setFormData({
        // title: customer.title || "",
        first_name: customer.first_name || "",
        last_name: customer.last_name || "",
        // nickname: customer.nickname || "",
        email: customer.email || "",
        dob: customer.dob || "",
        phone_number: customer.phone_number || "",
        mobile_number: customer.mobile_number || "",
        address_line1: customer.address_line1 || "",
        country_id: countryId,
        state_id: stateId,
        // country: customer.country || "",
        // city: customer.city || "",
        sex: customer.sex || "",
        status: customer.status || ENTITY_STATUS.ACTIVE,
        description: customer.description || "",
        remarks: customer.remarks || "",
        tag: customer.tag || "",
      });
    }
  }, [customer]);

  // const titleOptions = [
  //   { value: "Mr.", label: "Mr." },
  //   { value: "Mrs.", label: "Mrs." },
  //   { value: "Miss.", label: "Miss." },
  //   { value: "Dr.", label: "Dr." },
  //   { value: "Rev.", label: "Rev." },
  // ]
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
          Edit Customer
        </h1>
      </div>

      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
              name="firstname"
              value={formData.first_name}
              onChange={(value) => handleInputChange("first_name", value)}
              placeholder="Enter First Name"
              required
              disabled={isSubmitting}
              error={errors.first_name}
              lettersOnly
            />
            <InputField
              label="Last Name"
              name="lastname"
              value={formData.last_name}
              onChange={(value) => handleInputChange("last_name", value)}
              placeholder="Enter Last Name"
              required
              disabled={isSubmitting}
              error={errors.last_name}
              lettersOnly
            />
            {/* <InputField
              label="Nick Name"
              name="nickname"
              value={formData.nickname}
              onChange={(value) => handleInputChange("nickname", value)}
              placeholder="Enter Nick Name"
              required
              disabled={isSubmitting}
            /> */}
            <InputField
              label="Email"
              name="email"
              value={formData.email}
              onChange={(value) => handleInputChange("email", value)}
              placeholder="Enter Email"
              required
              disabled={isSubmitting}
              error={errors.email}
            />
            <InputField
              label="Date of Birth"
              name="dob"
              type="date"
              value={formData.dob}
              onChange={(value) => handleInputChange("dob", value)}
              placeholder="MM/DD/YYYY"
              disabled={isSubmitting}
              error={errors.dob}
            />
            <PhoneInputField
              label="Phone Number"
              name="phonenumber"
              value={formData.phone_number}
              onChange={(value) => handleInputChange("phone_number", value)}
              placeholder="Enter Phone Number"
              required
              disabled={isSubmitting}
              error={errors.phone_number}
            />
            <PhoneInputField
              label="Mobile Number"
              name="mobilenumber"
              value={formData.mobile_number}
              onChange={(value) => handleInputChange("mobile_number", value)}
              placeholder="Enter Mobile Number"
              required
              disabled={isSubmitting}
              error={errors.mobile_number}
            />
            <SelectField
              label="Country"
              name="country_id"
              value={formData.country_id ?? ""}
              onChange={(value) => {
                handleInputChange("country_id", value);
                setFormData((prev) => ({ ...prev, state_id: undefined }));
              }}
              options={countries
                .map((c) => ({ value: String(c.id), label: String(c.name) }))
                .sort((a, b) => a.label.localeCompare(b.label))}
              disabled={isSubmitting}
              error={errors.country_id}
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
              disabled={isSubmitting || !formData.country_id}
              error={errors.state_id}
            />
            
            <InputField
              label="Address"
              name="address"
              value={formData.address_line1}
              onChange={(value) => handleInputChange("address_line1", value)}
              placeholder="Address Line 1"
              disabled={isSubmitting}
              error={errors.address_line1}
            />
            {/* <div className="md:col-span-2">
              <InputField
                label="Address"
                name="address"
                value={formData.address_line1}
                onChange={(value) => handleInputChange("address_line1", value)}
                placeholder="Address Line 1"
                required
                disabled={isSubmitting}
              />
            </div> */}
            {/* <InputField
              label="Country"
              name="country"
              value={formData.country}
              onChange={(value) => handleInputChange("country", value)}
              placeholder="Enter Country"
              required
              disabled={isSubmitting}
            /> */}
            {/* <InputField
              label="City"
              name="city"
              value={formData.city}
              onChange={(value) => handleInputChange("city", value)}
              placeholder="Enter City"
              required
              disabled={isSubmitting}
            /> */}
            <RadioGroup
              label="Select Gender"
              name="gender"
              value={formData.sex}
              onChange={(value) =>
                handleInputChange("sex", value as Customer["sex"])
              }
              options={genderOptions}
              required
              disabled={isSubmitting}
              error={errors.sex}
            />
            <RadioGroup
              label="Select Status"
              name="status"
              value={formData.status}
              onChange={(value) =>
                handleInputChange("status", value as Customer["status"])
              }
              options={statusOptions}
              required
              disabled={isSubmitting}
              error={errors.status}
            />
            <div className="space-y-2">
              <SelectField
                label="Customer Tag / Badge"
                name="customer_tag_option"
                value={
                  !formData.tag
                    ? ""
                    : ["Annoying / Difficult", "VIP Customer", "Frequent Caller", "High Risk", "New Customer", "Regular Customer"].includes(formData.tag)
                    ? formData.tag
                    : "CUSTOM"
                }
                onChange={(val) => {
                  if (val === "CUSTOM") {
                    handleInputChange("tag", customTag || "Custom Tag");
                  } else {
                    handleInputChange("tag", val);
                  }
                }}
                options={[
                  { value: "", label: "None (No Tag)" },
                  { value: "Annoying / Difficult", label: "🔴 Annoying / Difficult Customer" },
                  { value: "VIP Customer", label: "🟡 VIP Customer" },
                  { value: "Frequent Caller", label: "🟣 Frequent Caller" },
                  { value: "High Risk", label: "🟠 High Risk" },
                  { value: "New Customer", label: "🔵 New Customer" },
                  { value: "Regular Customer", label: "🟢 Regular Customer" },
                  { value: "CUSTOM", label: "✏️ Custom Tag..." },
                ]}
                disabled={isSubmitting}
              />
              {formData.tag !== undefined &&
                formData.tag !== "" &&
                !["Annoying / Difficult", "VIP Customer", "Frequent Caller", "High Risk", "New Customer", "Regular Customer"].includes(formData.tag) && (
                  <InputField
                    label="Custom Tag Name"
                    name="custom_tag"
                    value={formData.tag || ""}
                    onChange={(val) => {
                      setCustomTag(val);
                      handleInputChange("tag", val);
                    }}
                    placeholder="Enter custom badge text"
                    disabled={isSubmitting}
                  />
                )}
            </div>
            <div className="md:col-span-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextEditorField
                  label="Notes"
                  name="notes"
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
                  disabled={isSubmitting}
              error={errors.description}
                  placeholder="Enter description here..."
                />
              </div>
            </div>
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

export default EditCustomer;
