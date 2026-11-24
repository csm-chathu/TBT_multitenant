"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { createPortal } from "react-dom"
import InputField from "@/components/Molecules/InputField"
import PhoneInputField from "@/components/Molecules/PhoneInputField"
import SelectField from "@/components/Molecules/SelectField"
import RadioGroup from "@/components/Molecules/RadioGroup"
import Button from "@/components/Atomic/Button"
import { createTicketWithFiles } from "@/services/ticketService"
import { TICKET_STATUS } from "@/constants/ticketStatus"
import {
  helpDeskQuickValidationSchema,
  validateForm,
} from "@/lib/validationSchemas"
import useToast from "@/hooks/useToast"

interface QuickTicketModalProps {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

interface QuickTicketFormData {
  heading: string
  phoneNumber: string
  application: string
  priority: "Low" | "Medium" | "High" | "Critical"
  agent: string
}

const priorityOptions = [
  { value: "Low", label: "Low" },
  { value: "Medium", label: "Medium" },
  { value: "High", label: "High" },
  { value: "Critical", label: "Critical" },
]

export const QuickTicketModal: React.FC<QuickTicketModalProps> = ({
  open,
  onClose,
  onSuccess,
}) => {
  const { success: showSuccessToast, error: showErrorToast } = useToast()
  const [formData, setFormData] = useState<QuickTicketFormData>({
    heading: "",
    phoneNumber: "",
    application: "",
    priority: "Medium",
    agent: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  const [agentOptions, setAgentOptions] = useState<{ value: string; label: string }[]>([])
  const [applicationOptions, setApplicationOptions] = useState<{ value: string; label: string }[]>([])

  useEffect(() => {
    if (!open) return
    let isCancelled = false

    const fetchOptions = async () => {
      try {
        const [{ getAllAgents }, { getAllApplications }] = await Promise.all([
          import("@/services/agentService"),
          import("@/services/applicationService"),
        ])

        const [agents, apps] = await Promise.all([
          getAllAgents().catch(() => []),
          getAllApplications().catch(() => []),
        ])

        if (isCancelled) return

        setAgentOptions([
          { value: "", label: "Select Agent" },
          ...agents.map((a: any) => ({
            value: String(a.id ?? `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()),
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
      } catch (e) {
        console.warn("Failed to load options for Quick Ticket Modal", e)
      }
    }

    fetchOptions()
    return () => {
      isCancelled = true
    }
  }, [open])

  if (!open) return null

  const handleInputChange = (field: keyof QuickTicketFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const updated = { ...prev }
        delete updated[field]
        return updated
      })
    }
  }

  const handleReset = () => {
    setFormData({
      heading: "",
      phoneNumber: "",
      application: "",
      priority: "Medium",
      agent: "",
    })
    setErrors({})
  }

  const handleClose = () => {
    handleReset()
    onClose()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { isValid, errors: validationErrors } = await validateForm(
      helpDeskQuickValidationSchema,
      formData
    )

    if (!isValid) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    try {
      const payload = {
        title: formData.heading,
        body: formData.heading || "Quick Ticket logged via call/live inquiry",
        priority: formData.priority.toLowerCase(),
        ticketType: "Help Desk",
        hash: `quick-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        application_id: formData.application ? Number(formData.application) : 1,
        agent_id: formData.agent ? Number(formData.agent) : undefined,
        mobile_number: formData.phoneNumber || undefined,
        phone_number: formData.phoneNumber || undefined,
        status: TICKET_STATUS.ASSIGNED,
        files: [],
      }

      await createTicketWithFiles(payload)
      showSuccessToast("Quick Ticket logged successfully!")
      handleReset()
      onSuccess?.()
      onClose()
    } catch (err: any) {
      console.error("Quick Ticket submission failed:", err)
      showErrorToast(
        err?.response?.data?.message || "Failed to create quick ticket. Please try again."
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return createPortal(
    <div className="flex items-center justify-center fixed inset-0 bg-black/80 z-[999]">
      <div className="w-full max-w-xl mx-4 bg-surface-primary border border-primary-100 shadow-2xl rounded-xl overflow-hidden">
        {/* Header */}
        <div className="py-3 px-5 flex justify-between items-center border-b border-primary-100">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Quick Ticket Creation</h2>
            <p className="text-xs text-text-muted">Rapidly log support calls & inquiries</p>
          </div>
          <Button style="Icon" icon="close" onClick={handleClose} />
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 bg-surface-primary">
          <InputField
            label="Ticket Heading/Body"
            name="heading"
            value={formData.heading}
            onChange={(val) => handleInputChange("heading", val)}
            placeholder="Brief summary of the issue"
            required
            disabled={isSubmitting}
            error={errors.heading}
          />

          <PhoneInputField
            label="Phone Number"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={(val) => handleInputChange("phoneNumber", val)}
            placeholder="Phone Number"
            required
            disabled={isSubmitting}
            error={errors.phoneNumber}
          />

          <SelectField
            label="Select Application"
            name="application"
            value={formData.application}
            onChange={(val) => handleInputChange("application", val)}
            options={applicationOptions}
            required
            disabled={isSubmitting}
            error={errors.application}
          />

          <RadioGroup
            name="quick-ticket-modal-priority"
            label="Select Priority"
            value={formData.priority}
            onChange={(val) => handleInputChange("priority", val as QuickTicketFormData["priority"])}
            options={priorityOptions}
            orientation="horizontal"
            required
            disabled={isSubmitting}
            error={errors.priority}
          />

          <SelectField
            label="Select Agent/Assign"
            name="agent"
            value={formData.agent}
            onChange={(val) => handleInputChange("agent", val)}
            options={agentOptions}
            required
            disabled={isSubmitting}
            error={errors.agent}
          />

          {/* Footer Actions */}
          <div className="pt-4 flex items-center justify-end gap-3 border-t border-primary-100">
            <Button
              type="button"
              style="Tertiary"
              text="Cancel"
              onClick={handleClose}
              disabled={isSubmitting}
            />
            <Button
              type="submit"
              style="Primary"
              text={isSubmitting ? "Creating..." : "Create Quick Ticket"}
              disabled={isSubmitting}
            />
          </div>
        </form>
      </div>
    </div>,
    document.body
  )
}

export default QuickTicketModal
