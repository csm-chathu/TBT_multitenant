"use client"

import type React from "react"
import { useEffect, useState, useRef } from "react"
import { useNavigate } from "react-router-dom"
import * as yup from "yup"
import InputField from "@/components/Molecules/InputField"
import PhoneInputField from "@/components/Molecules/PhoneInputField"
import SelectField from "@/components/Molecules/SelectField"
import SearchableSelectField from "@/components/Molecules/SearchableSelectField"
import TagInputField from "@/components/Molecules/TagInputField"
import { type TagInputHandle } from "@/components/Atomic/TagInput"
import FileUploadField from "@/components/Molecules/FileUploadField"
import TextEditorField from "@/components/Molecules/TextEditorField"
import FormActions from "@/components/Molecules/FormActions"
import RadioGroup from "@/components/Molecules/RadioGroup"
import MultiSelectField from "@/components/Molecules/MultiSelectField"
import { createTicketWithFiles } from "@/services/ticketService"
import {
  deleteTicketResource,
  listTicketResources,
  // uploadTicketResource,
  type TicketResource,
} from "@/services/ticketResourceService"
import { validateFiles, FileValidationError, FILE_UPLOAD_CONSTRAINTS } from "@/lib/fileValidation"
import { getAllItems } from "@/services/itemService"
import { Item } from "@/redux/item/itemTypes"
import { TICKET_STATUS } from "@/constants/ticketStatus"
import { useAppDispatch, useAppSelector } from "@/redux/hooks"
import { fetchLocations } from "@/redux/location/locationSlice"
import {
  phoneNumberValidator,
  requiredStringValidator,
  htmlContentValidator,
  oneOfValidator,
  arrayValidator,
  validateForm,
} from "@/lib/validationSchemas"
import useToast from "@/hooks/useToast"

interface HelpDeskFormData {
  heading: string
  phoneNumber: string
  customerEmail: string
  application: string
  location: string
  device: string
  priority: "Low" | "Medium" | "High" | "Critical"
  agent: string
  multiple_assignees: string[]
  description: string
  reporter: string
  indicatorType: string[]
}

// Yup validation schema using reusable validators
const helpDeskValidationSchema = yup.object({
  heading: requiredStringValidator("Ticket heading", 3, 200),
  phoneNumber: phoneNumberValidator,
  customerEmail: yup.string().email("Please enter a valid email address").optional(),
  application: yup
    .string()
    .required("Please select an application")
    .test("not-empty", "Please select an application", (value) => value !== ""),
  indicatorType: arrayValidator("Indicator type", 1),
  agent: yup
    .string()
    .required("Please select an agent")
    .test("not-empty", "Please select an agent", (value) => value !== ""),
  location: yup
    .string()
    .required("Please select a location")
    .test("not-empty", "Please select a location", (value) => value !== ""),
  priority: oneOfValidator("Priority", ["Low", "Medium", "High", "Critical"] as const),
  description: htmlContentValidator("Description", 1, 500),
})

const HelpDeskForm: React.FC = () => {
  const navigate = useNavigate()
  const { error: showErrorToast } = useToast()
  const dispatch = useAppDispatch()
  const { locations } = useAppSelector((state) => state.locations)
  const [formData, setFormData] = useState<HelpDeskFormData>({
    heading: "",
    phoneNumber: "",
    customerEmail: "",
    application: "",
    location: "",
    device: "",
    priority: "Medium",
    agent: "",
    multiple_assignees: [],
    description: "",
    reporter: "",
    indicatorType: [],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showMultipleAssignees, setShowMultipleAssignees] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [agentOptions, setAgentOptions] = useState<
    { value: string; label: string }[]
  >([])
  const [applicationOptions, setApplicationOptions] = useState<
    { value: string; label: string }[]
  >([])
  const [reporterOptions, setReporterOptions] = useState<
    { value: string; label: string }[]
  >([])
  const [deviceOptions, setDeviceOptions] = useState<
    { value: string; label: string; disabled?: boolean }[]
  >([])
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [uploadedResources, setUploadedResources] = useState<TicketResource[]>([])
  const [createdTicketId, setCreatedTicketId] = useState<number | null>(null)
  const [fileValidationErrors, setFileValidationErrors] = useState<FileValidationError[]>([])
  const [formResetKey, setFormResetKey] = useState(0)

  const indicatorTypeInputRef = useRef<TagInputHandle>(null)

  const handleInputChange = (field: keyof HelpDeskFormData, value: any) => {
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

  const handleFileUpload = (files: FileList | null) => {
    console.log('handleFileUpload called with:', files)
    if (!files) {
      console.log('No files provided, clearing selected files')
      setSelectedFiles([])
      setFileValidationErrors([])
      return
    }
    const newFiles = Array.from(files)
    console.log('New files selected:', newFiles.map(f => ({ name: f.name, size: f.size, type: f.type })))
    
    // Merge new files with existing ones, avoiding duplicates
    const existingFileNames = new Set(selectedFiles.map(f => f.name + f.size + f.lastModified))
    const uniqueNewFiles = newFiles.filter(f => !existingFileNames.has(f.name + f.size + f.lastModified))
    
    // Combine existing files with new unique files
    const combinedFiles = [...selectedFiles, ...uniqueNewFiles]
    
    // Check if total exceeds max files limit
    if (combinedFiles.length > FILE_UPLOAD_CONSTRAINTS.MAX_FILES) {
      const excessCount = combinedFiles.length - FILE_UPLOAD_CONSTRAINTS.MAX_FILES
      const errors: FileValidationError[] = [{
        type: 'count',
        message: `Maximum ${FILE_UPLOAD_CONSTRAINTS.MAX_FILES} files allowed. You already have ${selectedFiles.length} file(s) and tried to add ${newFiles.length} more. Please remove ${excessCount} file(s) first.`
      }]
      setFileValidationErrors(errors)
      return
    }
    
    // Validate all combined files
    const validation = validateFiles(combinedFiles)
    setFileValidationErrors(validation.errors)
    
    // Set the combined files (up to max limit)
    setSelectedFiles(combinedFiles.slice(0, FILE_UPLOAD_CONSTRAINTS.MAX_FILES))
  }

  const handleFileValidationError = (errors: FileValidationError[]) => {
    setFileValidationErrors(errors)
  }

  const handleFileRemove = (indexToRemove: number) => {
    const updatedFiles = selectedFiles.filter((_, index) => index !== indexToRemove)
    setSelectedFiles(updatedFiles)
    
    // Re-validate remaining files
    if (updatedFiles.length > 0) {
      const validation = validateFiles(updatedFiles)
      setFileValidationErrors(validation.errors)
    } else {
      setFileValidationErrors([])
    }
  }

  const handleSubmit = async () => {
    // Check for file validation errors
    if (fileValidationErrors.length > 0) {
      console.log("Cannot submit: File validation errors exist")
      return
    }

    // Flush any pending indicator type input value before validation
    const pendingValue = indicatorTypeInputRef.current?.getPendingValue()
    let dataToValidate = formData
    if (pendingValue && pendingValue.length > 0 && !formData.indicatorType.includes(pendingValue)) {
      // Add pending value to formData before validation
      const updatedIndicatorTypes = [...formData.indicatorType, pendingValue]
      setFormData(prev => ({ ...prev, indicatorType: updatedIndicatorTypes }))
      // Flush it from the input component
      indicatorTypeInputRef.current?.flushPendingValue()
      // Use updated data for validation
      dataToValidate = { ...formData, indicatorType: updatedIndicatorTypes }
    }

    // Validate form with reusable helper
    const { isValid, errors: validationErrors } = await validateForm(
      helpDeskValidationSchema,
      dataToValidate
    );
    
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }

    setIsSubmitting(true)
    try {
      // Validate files one more time before submission
      const validation = validateFiles(selectedFiles)
      if (!validation.isValid) {
        setFileValidationErrors(validation.errors)
        console.error("File validation failed:", validation.errors)
        return
      }

        // Prepare payload for new S3 integration
        const payload = {
          title: dataToValidate.heading,
          body: dataToValidate.description,
          priority: dataToValidate.priority.toLowerCase(),
          // Submit ticket type as Help Desk when this form is used
          ticketType: "Help Desk",
          hash: `helpdesk-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
          // Add custom data as JSON string for help desk-specific fields
          serialNo: JSON.stringify({
            assetsDevice: dataToValidate.device,
            location: dataToValidate.location,
            reporter: dataToValidate.phoneNumber,
            organization: dataToValidate.application || "",
            ticketType: "Help Desk",
            indicatorType: dataToValidate.indicatorType,
          }),
          // Save indicatorType to additional_data field
          additional_data: JSON.stringify({
            indicatorType: dataToValidate.indicatorType,
          }),
        files: validation.validFiles, // Only include valid files
      }

      console.log('Submitting Help Desk ticket with S3 integration:', {
        ...payload,
        files: payload.files.map(f => ({ name: f.name, size: f.size, type: f.type }))
      })

      // Use new S3 integration endpoint
      const ticket = await createTicketWithFiles(payload)
      
      console.log('Help Desk ticket created successfully with S3 integration:', ticket)
      
      // Set the created ticket ID for any follow-up operations
      const ticketId = ticket.id ?? ticket.ticketId
      if (ticketId) {
        setCreatedTicketId(Number(ticketId))
        
        // Load the uploaded resources to show in UI
        try {
          const resources = await listTicketResources(Number(ticketId))
          setUploadedResources(resources)
          console.log('Loaded uploaded resources:', resources)
        } catch (error) {
          console.warn('Failed to load uploaded resources:', error)
        }
      }

      // Clear selected files after successful submission
      setSelectedFiles([])
      setFileValidationErrors([])
  console.log('S3 integrated Help Desk submission completed successfully')
  navigate('/dashboard/tickets') // Redirect to All Tickets page

    } catch (error: any) {
      console.error("Submission error:", error)

      // Prefer a clear message for upload failures / large payloads
      const status = error?.response?.status
      if (status === 413) {
        showErrorToast(
          "Upload failed: attachments are too large for the server limit. Please remove some files or upload smaller ones.",
        )
      } else {
        showErrorToast(
          error?.response?.data?.message ||
            "Failed to create ticket or upload files. Please try again.",
        )
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    // Reset form data to initial state
    setFormData({
      heading: "",
      phoneNumber: "",
      customerEmail: "",
      application: "",
      location: "",
      device: "",
      priority: "Medium" as const,
      agent: "",
      multiple_assignees: [],
      description: "",
      reporter: "",
      indicatorType: [],
    })
    // Clear errors
    setErrors({})
    // Clear files
    setSelectedFiles([])
    setUploadedResources([])
    setFileValidationErrors([])
    setCreatedTicketId(null)
    setShowMultipleAssignees(false)
    // Force components to remount by incrementing reset key
    setFormResetKey(prev => prev + 1)
    // Explicitly trigger onChange to ensure TextEditor clears
    handleInputChange("description", "")
    handleInputChange("indicatorType", [])
    // Reset tag input if ref exists
    setTimeout(() => {
      if (indicatorTypeInputRef.current) {
        indicatorTypeInputRef.current.flushPendingValue()
      }
    }, 0)
  }

  // Load dynamic options for agents and applications
  useEffect(() => {
    let isCancelled = false
    const fetchAll = async () => {
      try {
        const [{ getAllAgents }, { getAllApplications }] = await Promise.all([
          import("@/services/agentService"),
          import("@/services/applicationService"),
        ])

        const [agents, apps, items] = await Promise.all([
          getAllAgents().catch(() => []),
          getAllApplications().catch(() => []),
          getAllItems().catch(() => []),
        ])

        if (isCancelled) return

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
        ])

        setApplicationOptions([
          { value: "", label: "Select Application" },
          ...apps.map((app: any) => ({
            value: String(app.id ?? app.name),
            label: app.name || `App ${app.id}`,
          })),
        ])

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
        ])

        setDeviceOptions([
          { value: "", label: "Select Device", disabled: true },
          ...items.map((item: Item) => ({
            value: String(item.id ?? ""),
            label: item.name || `Item ${item.id}` || "Unnamed Item",
          })),
        ])


      } catch (e) {
        console.warn("Failed to load Helpdesk select options", e)
      }
    }

    fetchAll()
    return () => {
      isCancelled = true
    }
  }, [])

  // Load locations from Redux on mount
  useEffect(() => {
    dispatch(fetchLocations())
  }, [dispatch])

  const locationOptions = [
    { value: "", label: "Select Location", disabled: true },
    ...locations.map((l) => ({
      value: String(l.id ?? ""),
      label: l.name ?? l.label ?? `Location ${l.id}`,
    })),
  ]


  const priorityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
    { value: "Critical", label: "Critical" },
  ]

  return (
    <>
      <SelectField
        label="Reporter"
        name="reporter"
        value={formData.reporter}
        onChange={(value) => handleInputChange("reporter", value)}
        options={reporterOptions}
        disabled={isSubmitting}
      />
      <InputField
        label="Ticket Heading"
        name="heading"
        value={formData.heading}
        onChange={(value) => handleInputChange("heading", value)}
        placeholder="Add Heading"
        required
        disabled={isSubmitting}
        error={errors.heading}
      />

      <PhoneInputField
        label="Phone Number"
        name="phoneNumber"
        value={formData.phoneNumber}
        onChange={(value) => handleInputChange("phoneNumber", value)}
        placeholder="Phone Number"
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
        label="Select Application"
        name="application"
        value={formData.application}
        onChange={(value) => handleInputChange("application", value)}
        options={applicationOptions}
        required
        disabled={isSubmitting}
        error={errors.application}
      />

      <SearchableSelectField
        label="Location"
        name="location"
        value={formData.location}
        onChange={(value) => handleInputChange("location", value)}
        options={locationOptions.filter((o) => !(o as any).disabled)}
        placeholder="Search location..."
        required
        disabled={isSubmitting}
        error={errors.location}
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

      <TagInputField
        key={`indicatorType-${formResetKey}`}
        ref={indicatorTypeInputRef}
        label="Action Type"
        name="indicatorType"
        tags={formData.indicatorType}
        onTagsChange={(tags) => handleInputChange("indicatorType", tags)}
        placeholder="Type or select an action type"
        required
        disabled={isSubmitting}
        error={errors.indicatorType}
        maxTags={5}
      />

      <div className="md:col-span-1">
        <RadioGroup
          name="helpdesk-priority"
          label="Select Priority"
          value={formData.priority}
          onChange={(value) => handleInputChange("priority", value as HelpDeskFormData["priority"])}
          options={priorityOptions}
          orientation="horizontal"
          required
          disabled={isSubmitting}
          className="space-y-3"
          error={errors.priority}
        />
      </div>

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

      <div className="md:col-span-2">
        <FileUploadField
          label="Upload Files"
          name="helpdesk-dropzone"
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
                          console.log('Cannot delete file: No valid ticket ID')
                          return
                        }
                        try {
                          const numericTicketId = Number(createdTicketId)
                          if (!isNaN(numericTicketId)) {
                            await deleteTicketResource(numericTicketId, res.id)
                            setUploadedResources((prev) => prev.filter((r) => r.id !== res.id))
                          } else {
                            console.log('Cannot delete file: Invalid ticket ID')
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
          isSubmitting={isSubmitting}
        />
      </div>
    </>
  )
}

export default HelpDeskForm

// "use client"

// import type React from "react"
// import { useState } from "react"
// import InputField from "@/components/Molecules/InputField"
// import SelectField from "@/components/Molecules/SelectField"
// import FileUploadField from "@/components/Molecules/FileUploadField"
// import TextEditorField from "@/components/Molecules/TextEditorField"
// import FormActions from "@/components/Molecules/FormActions"
// import RadioGroup from "@/components/Molecules/RadioGroup"
// import { createTicket } from "@/services/ticketService";

// interface HelpDeskFormData {
//   heading: string
//   phoneNumber: string
//   application: string
//   priority: "Low" | "Medium" | "High" | "Critical"
//   agent: string
//   description: string
// }

// const HelpDeskForm: React.FC = () => {
//   const [formData, setFormData] = useState<HelpDeskFormData>({
//     heading: "",
//     phoneNumber: "",
//     application: "",
//     priority: "High",
//     agent: "",
//     description: "",
//   })
//   const [isSubmitting, setIsSubmitting] = useState(false)

//   const handleInputChange = (field: keyof HelpDeskFormData, value: any) => {
//     setFormData((prev) => ({ ...prev, [field]: value }))
//   }

//   const handleFileUpload = (files: FileList | null) => {
//     if (files) {
//       console.log("Files uploaded:", files)
//     }
//   }

//   const handleSubmit = async () => {
//     setIsSubmitting(true);
//     try {
//       // Map HelpDeskFormData to CreateTicketDto
//       const payload = {
//         ticketType: "Help Desk",
//         priority: formData.priority === "Low" ? 4 : formData.priority === "Medium" ? 3 : formData.priority === "High" ? 2 : 1,
//         organization: "", // You may want to add an organization field to the form
//         assetsDevice: formData.application, // Assuming application is the asset/device
//         incidentType: [], // You may want to add incident type selection to the form
//         indicators: [], // You may want to add indicators selection to the form
//         reporter: formData.phoneNumber, // Or another field if you have a reporter
//         assignee: formData.agent,
//         location: "", // You may want to add location selection to the form
//         description: formData.description,
//         // Optionally add status, etc. if needed by backend
//       };
//       await createTicket(payload);
//       alert("Ticket created successfully!");
//       // Optionally reset form or navigate
//     } catch (error) {
//       console.error("Submission error:", error);
//       alert("Failed to create ticket. Please try again.");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const handleCancel = () => {
//     console.log("Form cancelled")
//   }

//   const applicationOptions = [
//     { value: "", label: "Select Application", disabled: true },
//     { value: "Application 1", label: "Application 1" },
//     { value: "Application 2", label: "Application 2" },
//     { value: "Application 3", label: "Application 3" },
//   ]

//   const agentOptions = [
//     { value: "", label: "Select Agent", disabled: true },
//     { value: "Ronald Richards", label: "Ronald Richards" },
//     { value: "Darlene Robertson", label: "Darlene Robertson" },
//   ]

//   const priorityOptions = [
//     { value: "Low", label: "Low" },
//     { value: "Medium", label: "Medium" },
//     { value: "High", label: "High" },
//     { value: "Critical", label: "Critical" },
//   ]

//   return (
//     <>
//       <InputField
//         label="Ticket Heading"
//         name="heading"
//         value={formData.heading}
//         onChange={(value) => handleInputChange("heading", value)}
//         placeholder="Add Heading"
//         required
//         disabled={isSubmitting}
//       />

//       <InputField
//         label="Phone Number"
//         name="phoneNumber"
//         type="tel"
//         value={formData.phoneNumber}
//         onChange={(value) => handleInputChange("phoneNumber", value)}
//         placeholder="Phone Number"
//         required
//         disabled={isSubmitting}
//       />

//       <SelectField
//         label="Application"
//         name="application"
//         value={formData.application}
//         onChange={(value) => handleInputChange("application", value)}
//         options={applicationOptions}
//         required
//         disabled={isSubmitting}
//       />

//       <div className="md:col-span-1">
//         <RadioGroup
//           name="helpdesk-priority"
//           label="Select Priority"
//           value={formData.priority}
//           onChange={(value) => handleInputChange("priority", value as HelpDeskFormData["priority"])}
//           options={priorityOptions}
//           orientation="horizontal"
//           required
//           disabled={isSubmitting}
//           className="space-y-3"
//         />
//       </div>

//       <SelectField
//         label="Agent"
//         name="agent"
//         value={formData.agent}
//         onChange={(value) => handleInputChange("agent", value)}
//         options={agentOptions}
//         required
//         disabled={isSubmitting}
//       />

//       <div className="md:col-span-2 flex flex-col md:flex-row gap-4 md:gap-16">
//         <div className="md:w-1/2">
//           <FileUploadField
//             label="Upload Files"
//             name="helpdesk-dropzone"
//             onFileChange={handleFileUpload}
//             accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.zip"
//             multiple
//             disabled={isSubmitting}
//           />
//         </div>
//         <div className="md:w-1/2">
//           <p className="text-sm uppercase font-semibold">Files</p>
//           <div className="mt-3 p-4 border border-dashed border-gray-300 rounded-lg h-[280px] flex items-center justify-center text-gray-500">
//             No files uploaded yet
//           </div>
//         </div>
//       </div>

//       <div className="md:col-span-2">
//         <TextEditorField
//           label="Description"
//           name="description"
//           value={formData.description}
//           onChange={(value) => handleInputChange("description", value)}
//           required
//           disabled={isSubmitting}
//         />
//       </div>

//       <div className="md:col-span-2">
//         <FormActions
//           onSubmit={handleSubmit}
//           onCancel={handleCancel}
//           submitText="Publish Ticket"
//           cancelText="Cancel"
//           isSubmitting={isSubmitting}
//         />
//       </div>
//     </>
//   )
// }

// export default HelpDeskForm
