"use client"

import type React from "react"
import { useState, useEffect } from "react"
import PopupModal from "@/components/Molecules/ui/PopupModal"
import SelectField from "@/components/Molecules/SelectField"
import { Ticket, type UpdateTicketDto } from "@/redux/ticket/ticketTypes"
import { TICKET_STATUS_OPTIONS } from "@/constants/ticketStatus"
import { updateTicket } from "@/services/ticketService"
import { addTicketHistory, createStatusChangeHistory } from "@/services/ticketHistoryService"
import { getStatusClass } from "@/lib/statusUtils"
import useToast from "@/hooks/useToast"
import { useAppDispatch } from "@/redux/hooks"
import { upsertTicketRealtime } from "@/redux/ticket/ticketSlice"

interface UpdateTicketStatusModalProps {
  open: boolean
  ticket: Ticket | null
  onClose: () => void
  onSuccess?: (updatedTicket: Ticket) => void
}

const UpdateTicketStatusModal: React.FC<UpdateTicketStatusModalProps> = ({
  open,
  ticket,
  onClose,
  onSuccess,
}) => {
  const dispatch = useAppDispatch()
  const { success: toastSuccess, error: toastError } = useToast()
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false)

  useEffect(() => {
    if (ticket) {
      const status = (ticket as any).status || (ticket as any).current_status || (ticket as any).CurrentStatus || ""
      setSelectedStatus(status)
    }
  }, [ticket])

  if (!ticket) return null

  const ticketId = ticket.id || (ticket as any).ticketId
  const ticketTitle = ticket.title || (ticket as any).heading || "Untitled Ticket"
  const currentStatus = (ticket as any).status || (ticket as any).current_status || (ticket as any).CurrentStatus || "N/A"

  const handleStatusChange = async (newStatus: string) => {
    if (!ticketId) return
    if (newStatus === currentStatus) return

    setSelectedStatus(newStatus)
    setIsSubmitting(true)

    try {
      const payload: UpdateTicketDto = {
        status: newStatus || null,
      }

      const updatedTicket = await updateTicket(ticketId, payload)

      const mergedTicket: Ticket = {
        ...ticket,
        ...(updatedTicket ?? {}),
        status: newStatus || "",
      }

      // Add status change history entry
      const historyPayload = createStatusChangeHistory({
        oldStatus: currentStatus,
        newStatus: newStatus,
        ticketId,
      })

      addTicketHistory(historyPayload).catch((err) => {
        console.warn("Ticket status updated but history logging failed:", err)
      })

      // Dispatch real-time Redux update so the entire UI stays synchronized
      dispatch(upsertTicketRealtime(mergedTicket))

      if (onSuccess) {
        onSuccess(mergedTicket)
      }

      try {
        toastSuccess(newStatus ? `Status updated to "${newStatus}"` : "Status cleared")
      } catch {}

      onClose()
    } catch (err) {
      console.error("Failed to update status:", err)
      setSelectedStatus(currentStatus)
      try {
        toastError("Failed to update status. Please try again.")
      } catch {}
    } finally {
      setIsSubmitting(false)
    }
  }

  const statusOptions = [
    { value: "", label: "Select status" },
    ...TICKET_STATUS_OPTIONS,
  ]

  return (
    <PopupModal
      open={open}
      onClose={onClose}
      title={`Update Status - Ticket #${ticketId}`}
      hideFooter={true}
    >
      <div className="space-y-5">
        {/* Ticket Summary Card */}
        <div className="p-3.5 bg-surface-secondary rounded-lg border border-borderColor-secondary space-y-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-semibold text-textColor-primary">
              #{ticketId}: {ticketTitle}
            </span>
            <span className={getStatusClass(currentStatus)} title={`Current status: ${currentStatus}`}>
              {currentStatus}
            </span>
          </div>
        </div>

        {/* Status Selection Dropdown */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-textColor-muted">
            New Status
          </label>
          <SelectField
            label=""
            name="status"
            value={selectedStatus}
            onChange={(val) => handleStatusChange(val)}
            options={statusOptions}
            placeholder="Select status"
            disabled={isSubmitting}
            className="!mb-0 w-full"
          />
          {isSubmitting && (
            <p className="text-xs text-primary-500 animate-pulse mt-1">Updating status...</p>
          )}
        </div>
      </div>
    </PopupModal>
  )
}

export default UpdateTicketStatusModal
