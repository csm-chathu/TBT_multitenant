"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import * as yup from "yup";
import Button from "../../../components/Atomic/Button";
import InputField from "@/components/Molecules/InputField";
import PhoneInputField from "@/components/Molecules/PhoneInputField";
import SelectField from "@/components/Molecules/SelectField";
import RadioGroup from "@/components/Molecules/RadioGroup";
import TextEditorField from "@/components/Molecules/TextEditorField";
import { ENTITY_STATUS, ENTITY_STATUS_OPTIONS } from "@/constants/entityStatus";
import { fetchAgentById, updateExistingAgent } from "@/redux/agent/agentSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { UpdateAgentDto } from "@/redux/agent/agentTypes";
import { fetchCountries } from "@/redux/country/countrySlice";
import { clearStates, fetchStatesByCountry } from "@/redux/state/stateSlice";
import { getAllAgents } from "@/services/agentService";
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
  mobile_number: phoneNumberValidator,
  address_line1: addressValidator,
  country_id: idValidator("Country"),
  state_id: idValidator("State/Region"),
  description: htmlContentValidator("Description", 1, 500),
});

const EditAgent: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { hash } = useParams<{ hash: any }>();
  const dispatch = useAppDispatch();
  const { success: toastSuccess, error: toastError } = useToast();
  const agent = useAppSelector((state) => state.agents.selectedAgent);
  const countries = useAppSelector((s) => s.countries.list);
  const states = useAppSelector((s) => s.states.list);

  const [formData, setFormData] = useState<UpdateAgentDto>({
    first_name: "",
    last_name: "",
    nickname: "",
    email: "",
    dob: "",
    phone_number: "",
    mobile_number: "",
    address_line1: "",
    country_id: undefined,
    state_id: undefined,
    city: "",
    sex: "Male",
    status: ENTITY_STATUS.ACTIVE,
    description: "",
    remarks: "",
  });


  const handleInputChange = (field: keyof UpdateAgentDto, value: any) => {
    const numericFields: Array<keyof UpdateAgentDto> = ["country_id", "state_id"];
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

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
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
      if (!agent?.id) {
        console.error("Agent ID is missing");
        return;
      }

      const updatedFormData: UpdateAgentDto = {
        ...formData,
        id: agent.id,
      };

      console.log("Dispatching update with:", {
        id: agent.id,
        data: updatedFormData,
      });

      await dispatch(
        updateExistingAgent({
          id: agent.id,
          data: updatedFormData,
        })
      ).unwrap();

      console.log("Agent updated successfully");
      toastSuccess("Agent updated successfully");
      navigate("/dashboard/agents");
    } catch (error) {
      console.error("Submission error:", error);
      toastError((error as Error)?.message || "Submission error");
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleCancel = () => {
    navigate(-1);
  };

  const countryOptions = countries
    .map((c) => ({ value: String(c.id), label: String(c.name) }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const genderOptions = [
    { value: "Male", label: "Male" },
    { value: "Female", label: "Female" },
    { value: "Other", label: "Other" },
  ];

  const statusOptions = ENTITY_STATUS_OPTIONS;

  useEffect(() => {
    const loadAgent = async () => {
      if (!hash) return;
      
      try {
        // Check if hash is numeric (legacy ID)
        const numericId = parseInt(hash);
        if (!isNaN(numericId) && String(numericId) === hash) {
          dispatch(fetchAgentById(numericId));
          return;
        }
        
        // Find agent by hash
        const allAgents = await getAllAgents();
        const foundAgent = allAgents.find((a: any) => {
          const agentHash = a.hash || (a as any).hash;
          return agentHash === hash || agentHash?.endsWith(hash);
        });
        
        if (foundAgent?.id) {
          dispatch(fetchAgentById(foundAgent.id));
        }
      } catch (error) {
        console.error("Failed to load agent by hash:", error);
      }
    };
    
    loadAgent();
  }, [hash, dispatch]);

  const formatDateForInput = (date: string | Date | undefined): string => {
    if (!date) return "";
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return "";
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${year}-${month}-${day}`;
    } catch {
      return "";
    }
  };

  useEffect(() => {
    if (agent) {
      // Extract country_id and state_id from nested objects if they exist
      const countryId = agent.country_id ?? agent.Country?.id;
      const stateId = agent.state_id ?? agent.State?.id;
      
      setFormData({
        first_name: agent.first_name || "",
        last_name: agent.last_name || "",
        nickname: agent.nickname || "",
        email: agent.email || "",
        dob: formatDateForInput(agent.dob),
        phone_number: agent.phone_number || "",
        mobile_number: agent.mobile_number || "",
        address_line1: agent.address_line1 || "",
        country_id: countryId,
        state_id: stateId,
        city: agent.city || "",
        sex: agent.sex || "",
        status: agent.status || ENTITY_STATUS.ACTIVE,
        description: agent.description || "",
        remarks: agent.remarks || "",
      });
    }
  }, [agent]);

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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-textColor-base">Edit Agent</h1>
      </div>

      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* <SelectField
              label="Select Title"
              name="title"
              value={formData.title}
              onChange={(value) => handleInputChange("title", value)}
              options={titleOptions}
              required
              disabled={isSubmitting}
            /> */}
            <InputField
              label="First Name"
              name="firstname"
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
            <PhoneInputField
              label="Mobile Number"
              name="mobilenumber"
              value={formData.mobile_number}
              onChange={(value) => handleInputChange("mobile_number", value)}
              placeholder="Enter Mobile Number"
              required
              error={errors.mobile_number}
              disabled={isSubmitting}
            />
              <InputField
              label="Address"
              name="address_line1"
              value={formData.address_line1}
              onChange={(value) => handleInputChange("address_line1", value)}
              placeholder="Enter Address"
              required
              error={errors.address_line1}
              disabled={isSubmitting}
            />
             <SelectField
              label="Country"
              name="country_id"
              value={formData.country_id ?? ""}
              onChange={(value) => {
                handleInputChange("country_id", value);
                setFormData((prev) => ({ ...prev, state_id: undefined }));
              }}
              options={countryOptions}
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
           
            <RadioGroup
              label="Select Gender"
              name="gender"
              value={formData.sex}
              onChange={(value) =>
                handleInputChange("sex", value as UpdateAgentDto["sex"])}
              options={genderOptions}
              required
              disabled={isSubmitting}
            />
            <RadioGroup
              label="Select Status"
              name="status"
              value={formData.status}
              onChange={(value) =>
                handleInputChange("status", value as UpdateAgentDto["status"])
              }
              options={statusOptions}
              required
              disabled={isSubmitting}
            />
            <TextEditorField
              label="Remarks"
              name="remarks"
              value={formData.remarks}
              onChange={(value) => handleInputChange("remarks", value)}
              disabled={isSubmitting}
              placeholder="Enter remarks here..."
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
            <Button style="Tertiary" text="Cancel" onClick={handleCancel} />
            <Button type="submit" text="Submit" loading={loading} />
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditAgent;
