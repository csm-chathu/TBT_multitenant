"use client";

import type React from "react";
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as yup from "yup";
import InputField from "@/components/Molecules/InputField";
import PhoneInputField from "@/components/Molecules/PhoneInputField";
import SelectField from "@/components/Molecules/SelectField"
import SearchableSelectField from "@/components/Molecules/SearchableSelectField";
import TagInputField from "@/components/Molecules/TagInputField";
import { type TagInputHandle } from "@/components/Atomic/TagInput";
import FileUploadField from "@/components/Molecules/FileUploadField";
import TextEditorField from "@/components/Molecules/TextEditorField";
import FormActions from "@/components/Molecules/FormActions";
import RadioGroup from "@/components/Molecules/RadioGroup";
import MultiSelectField from "@/components/Molecules/MultiSelectField";
import { createTicketWithFiles } from "@/services/ticketService";
import {
  deleteTicketResource,
  listTicketResources,
  // uploadTicketResource,
  type TicketResource,
} from "@/services/ticketResourceService";
import { validateFiles, FileValidationError, FILE_UPLOAD_CONSTRAINTS } from "@/lib/fileValidation";
import { getAllItems } from "@/services/itemService";
import { Item } from "@/redux/item/itemTypes";
import { TICKET_STATUS } from "@/constants/ticketStatus";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchLocations } from "@/redux/location/locationSlice";
import {
  phoneNumberValidator,
  requiredStringValidator,
  htmlContentValidator,
  oneOfValidator,
  validateForm,
} from "@/lib/validationSchemas";

interface CyberFormData {
  heading: string;
  indicatorType: string[];
  reporter: string;
  agent: string;
  multiple_assignees: string[];
  application: string;
  location: string;
  device: string;
  phoneNumber: string;
  customerEmail: string;
  incidentType: string[];
  priority: "Low" | "Medium" | "High" | "Critical";
  notes: string;
  description: string;
}

// Yup validation schema using reusable validators
const cyberValidationSchema = yup.object({
  heading: requiredStringValidator("Ticket heading", 3, 200),
  phoneNumber: phoneNumberValidator,
  customerEmail: yup.string().email("Please enter a valid email address").optional(),
  agent: yup
    .string()
    .required("Please select an agent")
    .test("not-empty", "Please select an agent", (value) => value !== ""),
  priority: oneOfValidator("Priority", ["Low", "Medium", "High", "Critical"] as const),
  description: htmlContentValidator("Description", 1, 500),
});

const CyberForm: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { locations } = useAppSelector((state) => state.locations);
  const [formData, setFormData] = useState<CyberFormData>({
    heading: "",
    indicatorType: [],
    reporter: "",
    agent: "",
    multiple_assignees: [],
    application: "",
    location: "",
    device: "",
    phoneNumber: "",
    customerEmail: "",
    incidentType: [],
    priority: "Medium",
    notes: "",
    description: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showMultipleAssignees, setShowMultipleAssignees] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [agentOptions, setAgentOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [applicationOptions, setApplicationOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [reporterOptions, setReporterOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [incidentTypeOptions, setIncidentTypeOptions] = useState<
    { value: string; label: string }[]
  >([]);
  const [deviceOptions, setDeviceOptions] = useState<
    { value: string; label: string; disabled?: boolean }[]
  >([]);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedResources, setUploadedResources] = useState<TicketResource[]>([]);
  const [createdTicketId, setCreatedTicketId] = useState<number | null>(null);
  const [fileValidationErrors, setFileValidationErrors] = useState<FileValidationError[]>([]);
  const [formResetKey, setFormResetKey] = useState(0);
  const indicatorTypeInputRef = useRef<TagInputHandle>(null);

  const handleInputChange = (field: keyof CyberFormData, value: any) => {
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

  const handleFileUpload = (files: FileList | null) => {
    console.log('handleFileUpload called with:', files);
    if (!files) {
      console.log('No files provided, clearing selected files');
      setSelectedFiles([]);
      setFileValidationErrors([]);
      return;
    }
    const newFiles = Array.from(files);
    console.log('New files selected:', newFiles.map(f => ({ name: f.name, size: f.size, type: f.type })));
    
    // Merge new files with existing ones, avoiding duplicates
    const existingFileNames = new Set(selectedFiles.map(f => f.name + f.size + f.lastModified));
    const uniqueNewFiles = newFiles.filter(f => !existingFileNames.has(f.name + f.size + f.lastModified));
    
    // Combine existing files with new unique files
    const combinedFiles = [...selectedFiles, ...uniqueNewFiles];
    
    // Check if total exceeds max files limit
    if (combinedFiles.length > FILE_UPLOAD_CONSTRAINTS.MAX_FILES) {
      const excessCount = combinedFiles.length - FILE_UPLOAD_CONSTRAINTS.MAX_FILES;
      const errors: FileValidationError[] = [{
        type: 'count',
        message: `Maximum ${FILE_UPLOAD_CONSTRAINTS.MAX_FILES} files allowed. You already have ${selectedFiles.length} file(s) and tried to add ${newFiles.length} more. Please remove ${excessCount} file(s) first.`
      }];
      setFileValidationErrors(errors);
      return;
    }
    
    // Validate all combined files
    const validation = validateFiles(combinedFiles);
    setFileValidationErrors(validation.errors);
    
    // Set the combined files (up to max limit)
    setSelectedFiles(combinedFiles.slice(0, FILE_UPLOAD_CONSTRAINTS.MAX_FILES));
  };

  const handleFileValidationError = (errors: FileValidationError[]) => {
    setFileValidationErrors(errors);
  };

  const handleFileRemove = (indexToRemove: number) => {
    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove);
    setSelectedFiles(updatedFiles);
    
    // Re-validate remaining files
    if (updatedFiles.length > 0) {
      const validation = validateFiles(updatedFiles);
      setFileValidationErrors(validation.errors);
    } else {
      setFileValidationErrors([]);
    }
  };

  const handleSubmit = async () => {
    // Check for file validation errors
    if (fileValidationErrors.length > 0) {
      console.log("Cannot submit: File validation errors exist");
      return;
    }

    // Flush any pending indicator type input value before validation
    const pendingValue = indicatorTypeInputRef.current?.getPendingValue();
    let dataToValidate = formData;
    if (pendingValue && pendingValue.length > 0 && !formData.indicatorType.includes(pendingValue)) {
      // Add pending value to formData before validation
      const updatedIndicatorTypes = [...formData.indicatorType, pendingValue];
      setFormData(prev => ({ ...prev, indicatorType: updatedIndicatorTypes }));
      // Flush it from the input component
      indicatorTypeInputRef.current?.flushPendingValue();
      // Use updated data for validation
      dataToValidate = { ...formData, indicatorType: updatedIndicatorTypes };
    }

    // Validate form with reusable helper
    const { isValid, errors: validationErrors } = await validateForm(
      cyberValidationSchema,
      dataToValidate
    );
    
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      // Validate files one more time before submission
      const validation = validateFiles(selectedFiles);
      if (!validation.isValid) {
        setFileValidationErrors(validation.errors);
        console.error("File validation failed:", validation.errors);
        return;
      }

      // Prepare payload for new S3 integration
      const payload = {
        title: dataToValidate.heading,
        body: dataToValidate.description,
        priority: dataToValidate.priority.toLowerCase(),
        ticketType: "Cyber",
        hash: `cyber-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        application_id: dataToValidate.application ? Number(dataToValidate.application) : 1, // Default application ID
        agent_id: dataToValidate.agent ? Number(dataToValidate.agent) : undefined,
        multiple_assignees: dataToValidate.multiple_assignees ? dataToValidate.multiple_assignees.map(Number) : undefined,
        reporter_id: dataToValidate.reporter ? Number(dataToValidate.reporter) : undefined,
        device_id: dataToValidate.device ? Number(dataToValidate.device) : undefined,
        // send customer contact number explicitly
        mobile_number: dataToValidate.phoneNumber || undefined,
        phone_number: dataToValidate.phoneNumber || undefined,
        customer_email: dataToValidate.customerEmail || undefined,
        status: TICKET_STATUS.ASSIGNED,
        serialNo: JSON.stringify({
          assetsDevice: dataToValidate.device,
          location: dataToValidate.location,
          reporter: dataToValidate.phoneNumber || dataToValidate.reporter,
          incidentType: dataToValidate.incidentType,
          organization: dataToValidate.application || "",
          indicatorType: dataToValidate.indicatorType,
          notes: dataToValidate.notes,
          ticketType: "Cyber",
        }),
        additional_data: JSON.stringify({
          indicatorType: dataToValidate.indicatorType,
        }),
        files: validation.validFiles, // Only include valid files
      };

      console.log('Submitting ticket with S3 integration:', {
        ...payload,
        files: payload.files.map(f => ({ name: f.name, size: f.size, type: f.type }))
      });

      // Use new S3 integration endpoint
      const ticket = await createTicketWithFiles(payload);
      
      console.log('Ticket created successfully with S3 integration:', ticket);
      
      // Set the created ticket ID for any follow-up operations
      const ticketId = ticket.id ?? ticket.ticketId;
      if (ticketId) {
        setCreatedTicketId(Number(ticketId));
        
        // Load the uploaded resources to show in UI
        try {
          const resources = await listTicketResources(Number(ticketId));
          setUploadedResources(resources);
          console.log('Loaded uploaded resources:', resources);
        } catch (error) {
          console.warn('Failed to load uploaded resources:', error);
        }
      }

      // Clear selected files after successful submission
      setSelectedFiles([]);
      setFileValidationErrors([]);
      console.log('S3 integrated submission completed successfully');

      // Optionally show success message or redirect
  navigate('/dashboard/tickets'); // Redirect to All Tickets page

    } catch (error) {
      console.error("Submission error:", error);
      // You might want to show user-friendly error message
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    // Reset form data to initial state
    setFormData({
      heading: "",
      indicatorType: [],
      reporter: "",
      agent: "",
      multiple_assignees: [],
      application: "",
      location: "",
      device: "",
      phoneNumber: "",
      customerEmail: "",
      incidentType: [],
      priority: "Medium" as const,
      notes: "",
      description: "",
    });
    // Clear errors
    setErrors({});
    // Clear files
    setSelectedFiles([]);
    setUploadedResources([]);
    setFileValidationErrors([]);
    setCreatedTicketId(null);
    setShowMultipleAssignees(false);
    // Force components to remount by incrementing reset key
    setFormResetKey(prev => prev + 1);
    // Explicitly trigger onChange to ensure TextEditor clears
    handleInputChange("description", "");
    handleInputChange("indicatorType", []);
    handleInputChange("incidentType", []);
    handleInputChange("notes", "");
    // Reset tag input if ref exists
    setTimeout(() => {
      if (indicatorTypeInputRef.current) {
        indicatorTypeInputRef.current.flushPendingValue();
      }
    }, 0);
  };

  // Fetched options state defined above

  // Load locations from Redux on mount
  useEffect(() => {
    dispatch(fetchLocations());
  }, [dispatch]);

  const locationOptions = [
    { value: "", label: "Select Location", disabled: true },
    ...locations.map((l) => ({
      value: String(l.id ?? ""),
      label: l.name ?? l.label ?? `Location ${l.id}`,
    })),
  ];


  const priorityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
    { value: "Critical", label: "Critical" },
  ];

  // Fetch dynamic data for selects
  useEffect(() => {
    let isCancelled = false;
    const fetchAll = async () => {
      try {
        const [
          { getAllAgents },
          { getAllApplications },
          { getAllIncidents },
        ] =
          await Promise.all([
            import("@/services/agentService"),
            import("@/services/applicationService"),
            import("@/services/incidentService"),
          ]);

        const [agents, apps, incidents, items] = await Promise.all([
          getAllAgents().catch(() => []),
          getAllApplications().catch(() => []),
          getAllIncidents().catch(() => []),
          getAllItems().catch(() => []),
        ]);

        if (isCancelled) return;

        setAgentOptions([
          { value: "", label: "Select Agent" },
          ...agents.map((a: any) => ({
            value: String(
              a.id ?? `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()
            ),
            label:
              `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() ||
              a.nickname ||
              `Agent ${a.id}`,
          })),
        ]);

        setApplicationOptions([
          { value: "", label: "Select Application" },
          ...apps.map((app: any) => ({
            value: String(app.id ?? app.name),
            label: app.name || `App ${app.id}`,
          })),
        ]);

        setReporterOptions([
          { value: "", label: "Select Reporter" },
          ...agents.map((a: any) => ({
            value: String(
              a.id ?? `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()
            ),
            label:
              `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim() ||
              a.nickname ||
              `Agent ${a.id}`,
          })),
        ]);

        setIncidentTypeOptions(
          incidents.map((i: any) => ({
            value: i.type ?? String(i),
            label: i.type ?? String(i),
          }))
        );

        setDeviceOptions([
          { value: "", label: "Select Device", disabled: true },
          ...items.map((item: Item) => ({
            value: String(item.id ?? ""),
            label: item.name || `Item ${item.id}` || "Unnamed Item",
          })),
        ]);
      } catch (e) {
        console.warn("Failed to load select options", e);
      }
    };

    fetchAll();
    return () => {
      isCancelled = true;
    };
  }, []);

  return (
    <>
      <InputField
        label="Ticket Heading"
        name="heading"
        value={formData.heading}
        onChange={(value) => handleInputChange("heading", value)}
        placeholder="Summary of your issue"
        required
        disabled={isSubmitting}
        error={errors.heading}
      />

      <TagInputField
        key={`indicatorType-${formResetKey}`}
        ref={indicatorTypeInputRef}
        label="Indicator Type"
        name="indicatorType"
        tags={formData.indicatorType}
        onTagsChange={(tags) => handleInputChange("indicatorType", tags)}
        placeholder="Add indicator types..."
        disabled={isSubmitting}
        maxTags={5}
      />

      <SearchableSelectField
        label="Location"
        name="location"
        value={formData.location}
        onChange={(value) => handleInputChange("location", value)}
        options={locationOptions.filter((o) => !(o as any).disabled)}
        placeholder="Search location..."
        disabled={isSubmitting}
      />

      <SelectField
        label="Reporter"
        name="reporter"
        value={formData.reporter}
        onChange={(value) => handleInputChange("reporter", value)}
        options={reporterOptions}
        disabled={isSubmitting}
      />

      <div>
        <SelectField
          label="Select Agent/Assign"
          name="agent"
          value={formData.agent}
          onChange={(value) => handleInputChange("agent", value)}
          options={agentOptions}
          required
          disabled={isSubmitting}
          error={errors.agent}
        />
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => setShowMultipleAssignees(!showMultipleAssignees)}
            className="text-sm text-primary-600 hover:text-primary-800 flex items-center gap-1"
          >
            {showMultipleAssignees ? "- Hide Additional Assignees" : "+ Add Multiple Assignees"}
          </button>
        </div>
      </div>

      {showMultipleAssignees && (
        <MultiSelectField
          label="Additional Assignees (Optional)"
          name="multiple_assignees"
          value={formData.multiple_assignees}
          onChange={(value) => handleInputChange("multiple_assignees", value)}
          options={agentOptions.filter(opt => opt.value !== "")}
          placeholder="Select multiple assignees (hold Ctrl/Cmd)"
          disabled={isSubmitting}
          error={errors.multiple_assignees}
        />
      )}

      <SelectField
        label="Select Application"
        name="application"
        value={formData.application}
        onChange={(value) => handleInputChange("application", value)}
        options={applicationOptions}
        disabled={isSubmitting}
      />

      <SearchableSelectField
        label="Assets / Device"
        name="device"
        value={formData.device}
        onChange={(value) => handleInputChange("device", value)}
        options={deviceOptions.filter((o) => !(o as any).disabled)}
        placeholder="Search device..."
        disabled={isSubmitting}
        allowCustomValue={true}
      />

      <PhoneInputField
        label="Customer Phone Number"
        name="phoneNumber"
        value={formData.phoneNumber}
        onChange={(value) => handleInputChange("phoneNumber", value)}
        placeholder="+1 555-555-5555"
        required
        disabled={isSubmitting}
        error={errors.phoneNumber}
      />

      <InputField
        label="Customer Email (Optional)"
        name="customerEmail"
        type="email"
        value={formData.customerEmail}
        onChange={(value) => handleInputChange("customerEmail", value)}
        placeholder="Customer Email Address"
        disabled={isSubmitting}
        error={errors.customerEmail}
      />

      <SelectField
        label="Action Type"
        name="incidentType"
        value={formData.incidentType[0] ?? ""}
        onChange={(value) =>
          handleInputChange("incidentType", value ? [value] : [])
        }
        options={incidentTypeOptions}
        disabled={isSubmitting}
      />

      <div className="md:col-span-1">
        <RadioGroup
          name="priority"
          label="Select Priority"
          value={formData.priority}
          onChange={(value) =>
            handleInputChange("priority", value as CyberFormData["priority"])
          }
          options={priorityOptions}
          orientation="horizontal"
          required
          disabled={isSubmitting}
          error={errors.priority}
        />
      </div>

      <div className="md:col-span-2">
        <FileUploadField
          label="Upload Files"
          name="cyber-dropzone"
          onFileChange={handleFileUpload}
          onValidationError={handleFileValidationError}
          selectedFiles={selectedFiles}
          onFileRemove={handleFileRemove}
          multiple
          disabled={isSubmitting}
        />
        
        {/* Show uploaded resources after ticket creation */}
        {uploadedResources.length > 0 && (
          <div className="mt-6">
            <p className="text-sm uppercase font-semibold mb-3">Uploaded Files</p>
            <div className="p-4 border border-dashed border-gray-300 rounded-lg max-h-48 overflow-auto">
              <ul className="space-y-3">
                {uploadedResources.map((res) => (
                  <li key={res.id} className="flex items-center justify-between gap-3">
                    <a
                      href={res.file_url || res.thumb_url || '#'}
                      target="_blank"
                      rel="noreferrer"
                      className="text-primary-600 hover:underline truncate"
                      title={res.originalName || res.s3Key}
                    >
                      {res.originalName || res.s3Key || res.file_url}
                    </a>
                    <button
                      type="button"
                      className="text-red-600 hover:text-red-700 text-sm"
                      disabled={isSubmitting || !createdTicketId}
                      onClick={async () => {
                        if (!createdTicketId || createdTicketId === null) {
                          console.log('Cannot delete file: No valid ticket ID');
                          return;
                        }
                        try {
                          const numericTicketId = Number(createdTicketId);
                          if (!isNaN(numericTicketId)) {
                            await deleteTicketResource(numericTicketId, res.id);
                            setUploadedResources((prev) => prev.filter((r) => r.id !== res.id));
                          } else {
                            console.log('Cannot delete file: Invalid ticket ID');
                          }
                        } catch {
                          // ignore
                        }
                      }}
                    >
                      Delete
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>

      <div className="md:col-span-2">
        <TextEditorField
          key={`description-${formResetKey}`}
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

      <div className="md:col-span-2">
        <FormActions
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          submitText="Publish Ticket"
          cancelText="Reset form"
          isSubmitting={isSubmitting || fileValidationErrors.length > 0}
        />
      </div>
    </>
  );
};

export default CyberForm;
