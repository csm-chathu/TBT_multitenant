"use client"

import React, { useState, useMemo } from "react"
import CyberForm from "./CyberForm"
import HelpDeskForm from "./HelpDeskForm"
import RadioGroupPrimary from "@/components/Molecules/RadioGroupPrimary"
import { getTicketTypesFromEnv } from "@/lib/ticketConfig"
import { TICKET_TYPE, TICKET_TYPE_OPTIONS, type TicketTypeValue } from "@/constants/ticketTypes"

const AddTicket: React.FC = () => {
  // Get available ticket types from environment configuration
  // This is memoized since env vars don't change at runtime
  const availableTicketTypes = useMemo(() => getTicketTypesFromEnv(), [])
  
  // Set default ticket type to first available type
  const defaultTicketType = availableTicketTypes[0]
  const [ticketType, setTicketType] = useState<TicketTypeValue>(defaultTicketType)

  // Filter ticket type options to only show available types
  const ticketTypeOptions = useMemo(
    () => TICKET_TYPE_OPTIONS.filter((option) => availableTicketTypes.includes(option.value)),
    [availableTicketTypes]
  )

  const showTicketTypeSelector = availableTicketTypes.length > 1

  return (
    <div className="space-y-6">
      <p className="text-xl font-medium tracking-tighter">Create New Ticket</p>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-y-8 gap-x-16 mt-6 p-5 bg-surface-primary border border-primary-100 rounded-lg">
        {showTicketTypeSelector && (
          <div className="space-y-3">
            <p className="text-sm uppercase font-semibold">Select Ticket Type</p>
            <RadioGroupPrimary
              name="ticketType"
              value={ticketType}
              onChange={(value) => setTicketType(value as TicketTypeValue)}
              options={ticketTypeOptions}
              orientation="horizontal"
              className="gap-x-4"
            />
          </div>
        )}

        {ticketType === TICKET_TYPE.CYBER && availableTicketTypes.includes(TICKET_TYPE.CYBER) && (
          <CyberForm />
        )}
        {ticketType === TICKET_TYPE.HELPDESK && availableTicketTypes.includes(TICKET_TYPE.HELPDESK) && (
          <HelpDeskForm />
        )}
      </div>
    </div>
  )
}

export default AddTicket
