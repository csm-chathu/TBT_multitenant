"use client"

import type React from "react"
import { useNavigate, useParams } from "react-router-dom"
import { useState, useEffect, useRef, useMemo } from "react"
import Button from "../../../components/Atomic/Button"
import UserAvatar from "../../../components/Molecules/ui/UserAvatar"
import AttachmentPreview from "../../../components/Molecules/AttachmentPreview"
import SelectField from "../../../components/Molecules/SelectField"
import { getTicketById, getTicketByHash, getEnrichedTicketById, updateTicket, updateTicketAssignees, updateTicketActionTypes, getTicketActionTypes, createActionType, type TicketActionType, getAllTickets, deleteTicket } from "@/services/ticketService"
import { listTicketResources, type TicketResource, getTicketResourceSignedUrl } from "@/services/ticketResourceService"
import { Ticket, type UpdateTicketDto } from "@/redux/ticket/ticketTypes"
import useToast from '@/hooks/useToast'
import { getTicketComments, createTicketComment, type TicketComment } from "@/services/ticketCommentService"
import { sendTicketReplyMessage } from "@/services/messageService"
import { getAllAgents } from "@/services/agentService"
import { Agent } from "@/redux/agent/agentTypes"
import { TICKET_STATUS, TICKET_STATUS_OPTIONS } from "@/constants/ticketStatus"
import { TICKET_PRIORITY, TICKET_PRIORITY_OPTIONS, PRIORITY_LABELS, PRIORITY_LABELS_LOWERCASE, TICKET_PRIORITY_VALUES, type TicketPriorityValue } from "@/constants/ticketPriority"
import { addTicketHistory, createAssigneeChangeHistory, createPriorityChangeHistory, createStatusChangeHistory } from "@/services/ticketHistoryService"
import { formatRichTextToPlain, formatPhone } from "@/utils/textUtils"
import locale from "@/locale/en"
import { ArrowLeft, Paperclip, X } from "lucide-react"
import { Suggestion } from "./Suggestion"
import {  getStatusClass } from '@/lib/statusUtils'
import BillingInvoice from "@/components/Molecules/invoice"
import TicketTimelineDrawer from "@/components/Molecules/TicketTimelineDrawer"
import { useAppSelector } from '@/redux/hooks'
import { selectCurrentUser } from '@/redux/user/userSlice'
import CustomerTagBadge from "@/components/Molecules/ui/CustomerTagBadge"
import { getCurrentUserId } from "@/lib/jwt"
import { getCannedReplies, type CannedReply } from "@/services/cannedReplyService"


const STATUS_OPTIONS = TICKET_STATUS_OPTIONS

const PRIORITY_OPTIONS = TICKET_PRIORITY_OPTIONS

const ViewTicket: React.FC = () => {
  const { id, hash } = useParams()
  const navigate = useNavigate()
  const [ticket, setTicket] = useState<Ticket | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [comments, setComments] = useState<TicketComment[]>([])
  const [commentValue, setCommentValue] = useState<string>("")
  const [isInternal, setIsInternal] = useState<boolean>(false)
  const [showInvoice, setShowInvoice] = useState<boolean>(false)
  const [internalRecipient, setInternalRecipient] = useState<string>("")
  const [submitting, setSubmitting] = useState<boolean>(false)
  const [newestFirst, setNewestFirst] = useState<boolean>(true)
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [resources, setResources] = useState<Array<{ file_url?: string; thumb_url?: string; hash?: string; file_path?: string; file_mime_type?: string; originalName?: string; id?: number }>>([])
  const signedUrlCache = useRef<Map<string, string>>(new Map())
  const [agents, setAgents] = useState<Agent[]>([])
  const [selectedAssignee, setSelectedAssignee] = useState<string>("")
  const [selectedStatus, setSelectedStatus] = useState<string>("")
  const [selectedPriority, setSelectedPriority] = useState<string>("")
  const [multipleAssigneeIds, setMultipleAssigneeIds] = useState<number[]>([])
  const [updatingAssignee, setUpdatingAssignee] = useState<boolean>(false)
  const [updatingSubAssignees, setUpdatingSubAssignees] = useState<boolean>(false)
  const [showSubAssigneeDropdown, setShowSubAssigneeDropdown] = useState(false)
  const subAssigneeDropdownRef = useRef<HTMLDivElement>(null)
  const [customerTicketCount, setCustomerTicketCount] = useState<number | null>(null)
  const [actionTypes, setActionTypes] = useState<TicketActionType[]>([])
  const [updatingActionTypes, setUpdatingActionTypes] = useState<boolean>(false)
  const [creatingActionType, setCreatingActionType] = useState<boolean>(false)
  const [showActionTypeDropdown, setShowActionTypeDropdown] = useState<boolean>(false)
  const [actionTypeSearch, setActionTypeSearch] = useState<string>("")
  const actionTypeDropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!showSubAssigneeDropdown) return
    const handler = (e: MouseEvent) => {
      if (subAssigneeDropdownRef.current && !subAssigneeDropdownRef.current.contains(e.target as Node)) {
        setShowSubAssigneeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showSubAssigneeDropdown])

  useEffect(() => {
    if (!showActionTypeDropdown) return
    const handler = (e: MouseEvent) => {
      if (actionTypeDropdownRef.current && !actionTypeDropdownRef.current.contains(e.target as Node)) {
        setShowActionTypeDropdown(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showActionTypeDropdown])

  useEffect(() => {
    const fetchActionTypes = async () => {
      try {
        const types = await getTicketActionTypes()
        setActionTypes(Array.isArray(types) ? types : [])
      } catch (err) {
        console.error("Failed to load action types:", err)
      }
    }
    fetchActionTypes()
  }, [])
  const [updatingStatus, setUpdatingStatus] = useState<boolean>(false)
  const [updatingPriority, setUpdatingPriority] = useState<boolean>(false)
  const [timelineTicket, setTimelineTicket] = useState<{ id: number; title: string } | null>(null)
  const { success: toastSuccess, error: toastError } = useToast()
  const currentUser = useAppSelector(selectCurrentUser)
  const isSuperAdmin = (currentUser?.roles ?? []).some((r: any) => r.name === 'Super Admin')
  const [stale, setStale] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState<File[]>([])
  const [cannedReplies, setCannedReplies] = useState<CannedReply[]>([])
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const commentsTicketIdRef = useRef<number | null>(null)
  const ticketDescription = formatRichTextToPlain(ticket?.body)


  // caching
  useEffect(() => {
    const cache = signedUrlCache.current

    const isAbsoluteUrl = (value: string | null | undefined): boolean => {
      if (!value) return false
      const trimmed = value.trim()
      if (!trimmed) return false
      return /^(https?:|data:|blob:)/i.test(trimmed)
    }

    const ensureSignedUrl = async (raw: string | null | undefined): Promise<string | null> => {
      if (!raw) return null
      const trimmed = raw.trim()
      if (!trimmed) return null
      if (isAbsoluteUrl(trimmed)) return trimmed
      if (cache.has(trimmed)) {
        return cache.get(trimmed) ?? null
      }
      const signed = await getTicketResourceSignedUrl(trimmed)
      if (signed) {
        cache.set(trimmed, signed)
        return signed
      }
      return null
    }

    const enrichResourcesWithSignedUrls = async (resourceList: any[]): Promise<any[]> => {
      if (!Array.isArray(resourceList) || resourceList.length === 0) return []

      return Promise.all(
        resourceList.map(async (resource) => {
          const attemptCache = new Map<string, string | null>()
          const ensureWithCache = async (candidate: string | null | undefined): Promise<string | null> => {
            if (!candidate) return null
            const trimmed = candidate.trim()
            if (!trimmed) return null
            if (attemptCache.has(trimmed)) return attemptCache.get(trimmed) ?? null
            const resolved = await ensureSignedUrl(trimmed)
            attemptCache.set(trimmed, resolved)
            return resolved
          }

          const candidates = [resource.file_url, resource.thumb_url, resource.file_path, resource.hash, resource.s3Key]
            .map((value) => (typeof value === 'string' ? value.trim() : ''))
            .filter((value): value is string => value.length > 0)

          let fileUrl: string | null = await ensureWithCache(resource.file_url)
          if (!fileUrl) {
            for (const candidate of candidates) {
              const resolved = await ensureWithCache(candidate)
              if (resolved) {
                fileUrl = resolved
                break
              }
            }
          }

          let thumbUrl: string | null = await ensureWithCache(resource.thumb_url)
          if (!thumbUrl && fileUrl) {
            thumbUrl = fileUrl
          }
          if (!thumbUrl) {
            for (const candidate of candidates) {
              const resolved = await ensureWithCache(candidate)
              if (resolved) {
                thumbUrl = resolved
                if (!fileUrl) {
                  fileUrl = resolved
                }
                break
              }
            }
          }

          if (!fileUrl) {
            const fallback = candidates.find((candidate) => !!candidate)
            fileUrl = fallback ?? null
          }
          if (!thumbUrl) {
            thumbUrl = fileUrl
          }

          return {
            ...resource,
            file_url: fileUrl ?? resource.file_url,
            thumb_url: thumbUrl ?? resource.thumb_url,
          }
        }),
      )
    }

    const resolveLegacyAttachmentUrls = async (urls: string[]): Promise<string[]> => {
      if (!Array.isArray(urls) || urls.length === 0) return []
      const resolved = await Promise.all(urls.map(async (url) => (await ensureSignedUrl(url)) ?? url))
      return resolved.filter((value): value is string => typeof value === "string" && value.trim().length > 0)
    }

    const fetchTicket = async () => {
      if (!id && !hash) {
        setError("No ticket identifier provided")
        setLoading(false)
        return
      }

      try {
        let ticketId: number | undefined
        let ticketData: Ticket | null = null

        // If hash is provided, fetch ticket directly by hash
        if (hash) {
          const foundTicket = await getTicketByHash(hash).catch(() => null)

          if (!foundTicket) {
            setError("Ticket not found")
            setLoading(false)
            return
          }

          ticketData = foundTicket
          ticketId = foundTicket.id || foundTicket.ticketId
        } else {
          // Use id directly
          ticketId = parseInt(id!)
          ticketData = await getTicketById(ticketId)
        }

        if (!ticketData || !ticketId) {
          setError("Ticket not found")
          setLoading(false)
          return
        }

        setTicket(ticketData)

        try {
          const enriched = await getEnrichedTicketById(ticketId)
          const attachmentsArray = Array.isArray(enriched.attachments) ? enriched.attachments : []

          // Merge enriched data (including indicatorType) into ticket state
          if (enriched) {
            const enrichedData = enriched as any
            setTicket((prev) => {
              if (!prev) return prev
              return {
                ...prev,
                ...(enrichedData.indicatorType !== undefined && { indicatorType: enrichedData.indicatorType }),
                ...(enrichedData.action_types !== undefined && { action_types: enrichedData.action_types }),
                ...(enrichedData.title !== undefined && { title: enrichedData.title }),
                ...(enrichedData.body !== undefined && { body: enrichedData.body }),
                ...(enrichedData.priority !== undefined && { priority: enrichedData.priority }),
                ...(enrichedData.status !== undefined && { status: enrichedData.status }),
                ...(enrichedData.invoice !== undefined && { invoice: enrichedData.invoice }),
              }
            })

            if (enrichedData.multiple_assignees) {
              try {
                const parsed = typeof enrichedData.multiple_assignees === 'string'
                  ? JSON.parse(enrichedData.multiple_assignees)
                  : enrichedData.multiple_assignees
                if (Array.isArray(parsed)) {
                  setMultipleAssigneeIds(parsed.map(Number).filter(Boolean))
                }
              } catch {}
            }
          }

          let resourcesFromEnriched = Array.isArray(enriched.resources)
            ? enriched.resources.map((res: any) => ({
              file_url: res?.file_url,
              thumb_url: res?.thumb_url,
              hash: res?.hash,
              file_path: res?.file_path,
              file_mime_type: res?.file_mime_type,
              originalName: res?.originalName || res?.name || "",
              id: res?.id,
            }))
            : []

          try {
            const listed: TicketResource[] = await listTicketResources(ticketId)
            if (Array.isArray(listed) && listed.length > 0) {
              const enrichedMap = new Map(resourcesFromEnriched.map((r: any) => [r.id, r]))
              resourcesFromEnriched = listed.map((m: any) => {
                const enrichedRes = enrichedMap.get(m.id)
                const originalName = enrichedRes?.originalName || m.originalName || enrichedRes?.name || m.name || ""
                return {
                  file_url: m.file_url || enrichedRes?.file_url,
                  thumb_url: m.thumb_url || enrichedRes?.thumb_url,
                  hash: m.hash || enrichedRes?.hash,
                  file_path: m.file_path || enrichedRes?.file_path,
                  file_mime_type: enrichedRes?.file_mime_type || m.file_mime_type,
                  originalName,
                  id: m.id,
                }
              })
            }
          } catch (mergeErr) {
            console.warn("Failed to fetch resources list, using enriched only:", mergeErr)
          }

          const [resolvedResources, resolvedAttachments] = await Promise.all([
            enrichResourcesWithSignedUrls(resourcesFromEnriched),
            resolveLegacyAttachmentUrls(attachmentsArray),
          ])

          setAttachmentUrls(resolvedAttachments)
          setResources(resolvedResources)
        } catch (e) {
          console.warn("Failed to load enriched ticket, continuing with base ticket:", e)
          setAttachmentUrls([])
          setResources([])
        }
      } catch (err) {
        setError("Failed to load ticket")
        console.error("Error fetching ticket:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchTicket()
  }, [id, hash])

  // Fetch total ticket count for the reporter/customer
  useEffect(() => {
    const customerId = (ticket as any)?.Customer?.id
    if (!customerId) return
    setCustomerTicketCount(null)
    getAllTickets({ customerId, page: 1, limit: 1 }).then((res) => {
      const total = Array.isArray(res) ? res.length : ((res as any).meta?.total ?? (res as any).total ?? null)
      setCustomerTicketCount(total)
    }).catch(() => {})
  }, [(ticket as any)?.Customer?.id])

  // Load comments for this ticket — guarded by ID so enriched-data merges don't re-fetch
  useEffect(() => {
    if (!ticket) return
    const ticketId = ticket.id || ticket.ticketId
    if (!ticketId) return
    if (commentsTicketIdRef.current === ticketId) return
    commentsTicketIdRef.current = ticketId
    const fetchComments = async () => {
      try {
        const list = await getTicketComments(ticketId)
        setComments(Array.isArray(list) ? list : [])
      } catch (err) {
        console.error("Error fetching comments:", err)
      }
    }
    fetchComments()
  }, [ticket])

  // Listen for global realtime events dispatched by RealtimeProvider
  useEffect(() => {
    const handler = async (e: Event) => {
      try {
        const detail = (e as CustomEvent)?.detail
        if (!detail) return
        const ev = detail.event as string
        const payload = detail.payload
        if (!ev) return

        const incomingTicketId = payload?.ticket?.id ?? payload?.ticketId ?? payload?.id ?? payload?.ticket_id
        const currentTicketId = ticket ? Number(ticket.id || ticket.ticketId) : null

        if (ev === 'ticket.comment.public' || ev === 'ticket.comment.internal') {
          // Only act on comments that belong to the currently viewed ticket
          if (incomingTicketId && currentTicketId && Number(incomingTicketId) !== Number(currentTicketId)) {
            return
          }

          // const comment = payload?.comment
          try {
            if (!currentTicketId) {
              console.warn('Realtime comment received but no ticket loaded to call comments API')
            } else {
              // Call comments API so any side-effects or caches update, but do not mutate local state here
              const list = await getTicketComments(currentTicketId)
              setComments(Array.isArray(list) ? list : [])
            }
          } catch (err) {
            console.warn('Failed to call comments API after realtime event', err)
          }
        }
        if (ev === 'ticket.updated') {
          const incomingTicketId = payload?.ticket?.id ?? payload?.ticketId ?? payload?.id ?? payload?.ticket_id
          if (ticket && Number(ticket.id || ticket.ticketId) === Number(incomingTicketId)) {
            try {
              setStale(true)
            } catch (e) {
              /* ignore */
            }
          }
        }
      } catch (err) {
        console.warn('Error handling realtime:event in ViewTicket', err)
      }
    }

    window.addEventListener('realtime:event', handler as EventListener)
    return () => window.removeEventListener('realtime:event', handler as EventListener)
  }, [ticket])

  // Load canned replies
  useEffect(() => {
    getCannedReplies()
      .then(setCannedReplies)
      .catch(() => {})
  }, [])

  // Load agents for assignee dropdown
  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agentsList = await getAllAgents()
        setAgents(Array.isArray(agentsList) ? agentsList : [])
      } catch (err) {
        console.error("Error fetching agents:", err)
      }
    }
    fetchAgents()
  }, [])

  // Set initial assignee, status, and priority when ticket loads
  useEffect(() => {
    if (ticket) {
      const currentAssigneeId = (ticket as any).Agent?.id || (ticket as any).agent_id
      if (currentAssigneeId) {
        setSelectedAssignee(String(currentAssigneeId))
      } else {
        setSelectedAssignee("")
      }
      setSelectedStatus(ticket.status ?? "")
      // Set priority - convert number to string for select field
      const priorityValue = normalizePriority(ticket.priority)
      setSelectedPriority(priorityValue ? String(priorityValue) : "")
    } else {
      setSelectedAssignee("")
      setSelectedStatus("")
      setSelectedPriority("")
    }
  }, [ticket])

  const filteredComments = comments.filter((c) => (isInternal ? c.type === "internal" : true))

  const displayedComments = useMemo(() => {
    const list = Array.isArray(filteredComments) ? [...filteredComments] : []
    const seen = new Set<number>()
    const uniqueList = list.filter((c) => {
      if (!c.id) return true
      if (seen.has(c.id)) return false
      seen.add(c.id)
      return true
    })
    uniqueList.sort((a, b) => {
      const aTime = a.createdAt ? Date.parse(String(a.createdAt)) : 0
      const bTime = b.createdAt ? Date.parse(String(b.createdAt)) : 0
      return newestFirst ? bTime - aTime : aTime - bTime
    })
    return uniqueList
  }, [filteredComments, newestFirst])

  // Defensive formatter to turn possibly-object fields into readable strings
  const asDisplay = (val: any): string | undefined => {
    if (val === null || val === undefined) return undefined
    if (typeof val === 'string' || typeof val === 'number') return String(val)
    if (Array.isArray(val)) return val.map((v) => asDisplay(v)).filter(Boolean).join(', ')
    if (typeof val === 'object') {
      const fullName = [val.first_name, val.last_name].filter(Boolean).join(' ').trim()
      return val.name || fullName || val.email || val.mobile_number || val.phone_number || (typeof val.id !== 'undefined' ? `#${val.id}` : undefined)
    }
    try { return JSON.stringify(val) } catch { return String(val) }
  }

  const getInitials = (val: any): string | undefined => {
    const text = asDisplay(val)
    if (!text) return undefined
    const cleanText = String(text).trim().replace(/^[^a-zA-Z0-9]+/, '')
    const parts = cleanText.split(/\s+/).filter(Boolean)
    if (parts.length === 0) return undefined
    const initials = parts.slice(0, 2).map((p) => p[0]).join('')
    return initials.toUpperCase()
  }

  // Determine whether the editor value contains any visible/non-HTML text.
  const hasVisibleContent = (val: string | null | undefined): boolean => {
    if (!val) return false
    try {
      // Remove <br> tags and any other HTML tags, then trim whitespace
      const stripped = String(val)
        .replace(/<br\s*\/?>(?=)/gi, '')
        .replace(/<[^>]*>/g, '')
        .replace(/\s+/g, '')
      return stripped.length > 0
    } catch {
      return false
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      setSelectedFiles((prev) => [...prev, ...filesArray])
    }
  }

  const removeSelectedFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleQuickReply = (text: string) => {
    setCommentValue((prev) => prev.trim() ? `${prev}\n${text}` : text)
  }

  const handleCancelComment = () => {
    setCommentValue("")
    setSelectedFiles([])
    setIsInternal(false)
    setInternalRecipient("")
  }

  const handleSubmitComment = async () => {
    if (!ticket) return
    const ticketId = ticket.id || ticket.ticketId
    if (!ticketId) return
    const trimmed = commentValue.trim()
    if (!trimmed && selectedFiles.length === 0) return
    setSubmitting(true)
    try {
      const currentSenderId = currentUser?.id ?? (currentUser as any)?.user_id ?? getCurrentUserId()
      const payload: any = {
        comment: trimmed,
        type: isInternal ? "internal" : "public",
      }
      if (currentSenderId) {
        payload.from = Number(currentSenderId)
      }
      if (isInternal && internalRecipient) {
        payload.to = Number(internalRecipient)
      }
      if (selectedFiles.length > 0) {
        payload.files = selectedFiles
      }

      const created = await createTicketComment(ticketId, payload)
      if (currentSenderId && !(created as any).from) {
        try {
          ;(created as any).from = Number(currentSenderId)
        } catch {}
      }
      // If we included an internal recipient, optimistically attach it as `to` so UI can render immediately
      if (isInternal && internalRecipient) {
        try {
          ;(created as any).to = Number(internalRecipient)
        } catch {}
      }
      // Optimistically append if not already added by realtime event
      setComments((prev) => {
        if (prev.some((c) => c.id === created.id)) {
          return prev
        }
        return [...prev, created]
      })
      setCommentValue("")
      setSelectedFiles([])
      setIsInternal(false)
      setInternalRecipient("")
      try {
        const preview = trimmed ? `": ${trimmed.slice(0, 60)}${trimmed.length > 60 ? '…' : ''}"` : ''
        toastSuccess(`Comment added on #${ticketId}${preview}`)
      } catch {}

      // For public comments, also create a message record (send + store)
      if (!isInternal && trimmed) {
        try {
          await sendTicketReplyMessage({
            body: trimmed,
            ticketId: ticketId,
          })
        } catch (e: any) {
          console.warn('Failed to send/store SMS for comment:', e)
          try { toastError(String((e instanceof Error ? e.message : e?.message) || "Failed to send message")) } catch {}
        }
      }
    } catch (err) {
      console.error("Failed to add comment:", err)
      try { toastError('Failed to add comment. Please try again.') } catch {}
    } finally {
      setSubmitting(false)
    }
  }

  const resolveAgentById = (targetId: string) => {
    if (!targetId) return undefined
    return agents.find((agent) => {
      const candidateId = agent.id ?? (agent as any).agent_id
      return candidateId !== undefined && String(candidateId) === targetId
    })
  }

  const getCommentRecipientAgent = (c: TicketComment) => {
    // Prefer explicit `to` field (new backend contract). Fallback to legacy fields if present.
    const explicitTo = (c as any).to ?? (c as any).recipient_agent_id
    let idVal: number | string | undefined
    if (explicitTo !== undefined && explicitTo !== null && explicitTo !== "") {
      idVal = explicitTo
    } else if (c.remarks) {
      // Try JSON parse for legacy remarks
      try {
        const parsed = JSON.parse(String(c.remarks))
        if (parsed && (parsed.to || parsed.recipient_agent_id)) idVal = parsed.to ?? parsed.recipient_agent_id
      } catch (e) {
        // fallback: if remarks is just a numeric id
        const trimmed = String(c.remarks).trim()
        if (/^\d+$/.test(trimmed)) idVal = Number(trimmed)
      }
    }

    if (!idVal) return undefined
    return resolveAgentById(String(idVal))
  }

  const handleAssigneeChange = async (newAssigneeId: string) => {
    if (!ticket) return
    const ticketId = ticket.id || ticket.ticketId
    if (!ticketId) return
    if (newAssigneeId === selectedAssignee) return

    // Store old assignee for history
    const oldAssignee = resolveAgentById(selectedAssignee)
    const oldAssigneeName = oldAssignee
      ? `${oldAssignee.first_name || ""} ${oldAssignee.last_name || ""}`.trim() ||
      oldAssignee.nickname ||
      oldAssignee.email ||
      (oldAssignee.id ? `Agent #${oldAssignee.id}` : "Unassigned")
      : "Unassigned"

    setUpdatingAssignee(true)
    try {
      const numericAssigneeId = newAssigneeId ? Number(newAssigneeId) : undefined
      const nextStatus = newAssigneeId ? TICKET_STATUS.ASSIGNED : undefined
      const updatePayload: UpdateTicketDto = {
        agent_id: numericAssigneeId,
      }
      if (nextStatus) {
        updatePayload.status = nextStatus
      }
      const updatedTicket = await updateTicket(ticketId, updatePayload)

      const resolvedAgent = resolveAgentById(newAssigneeId)
      const fallbackDisplay = resolvedAgent
        ? `${resolvedAgent.first_name || ""} ${resolvedAgent.last_name || ""}`.trim() ||
        resolvedAgent.nickname ||
        resolvedAgent.email ||
        (resolvedAgent.id ? `Agent #${resolvedAgent.id}` : undefined)
        : undefined

      setTicket((prev) => {
        const base = updatedTicket ?? prev
        if (!base) return prev
        const nextTicket = {
          ...base,
          agent_id: numericAssigneeId,
          assignee: fallbackDisplay ?? base.assignee ?? "",
          Agent: resolvedAgent
            ? {
              id: resolvedAgent.id ?? (resolvedAgent as any).agent_id ?? numericAssigneeId,
              first_name: resolvedAgent.first_name ?? "",
              last_name: resolvedAgent.last_name ?? "",
              nickname: resolvedAgent.nickname ?? "",
            }
            : undefined,
        }
        if (nextStatus) {
          nextTicket.status = nextStatus
        }
        return nextTicket
      })
      setSelectedAssignee(newAssigneeId)
      if (nextStatus) {
        setSelectedStatus(nextStatus)
      }

      // Add history entry
      const newAssigneeName = resolvedAgent
        ? `${resolvedAgent.first_name || ""} ${resolvedAgent.last_name || ""}`.trim() ||
        resolvedAgent.nickname ||
        resolvedAgent.email ||
        (resolvedAgent.id ? `Agent #${resolvedAgent.id}` : "Unassigned")
        : "Unassigned"

      // Get current status (from updated ticket or fallback to current state)
      const currentStatus = updatedTicket?.status || ticket.status || selectedStatus || nextStatus || "Open"

      // History logging is non-blocking
      const historyPayload = createAssigneeChangeHistory({
        oldAssigneeName,
        newAssigneeName: newAssigneeId ? newAssigneeName : undefined,
        status: currentStatus,
        assigneeId: numericAssigneeId,
        ticketId,
      })

      addTicketHistory(historyPayload).catch((error) => {
        console.warn('Ticket updated but history logging failed:', error);
      })

      try { toastSuccess(newAssigneeId ? locale.success.assignee_update_success : locale.success.assignee_remove_success) } catch {}
    } catch (err) {
      console.error("Failed to update assignee:", err)
      try { toastError('Failed to update assignee. Please try again.') } catch {}
      // Revert to previous value on error
      const currentAssigneeId = (ticket as any).Agent?.id || (ticket as any).agent_id
      if (currentAssigneeId) {
        setSelectedAssignee(String(currentAssigneeId))
      } else {
        setSelectedAssignee("")
      }
    } finally {
      setUpdatingAssignee(false)
    }
  }

  const handleSubAssigneesChange = async (newSubIds: string[]) => {
    if (!ticket) return
    const ticketId = ticket.id || ticket.ticketId
    if (!ticketId) return

    const numericSubIds = newSubIds.map(Number).filter(Boolean)
    const leadId = selectedAssignee ? Number(selectedAssignee) : null

    // Lead goes first, then sub-assignees (deduplicated)
    const agentIds = leadId
      ? [leadId, ...numericSubIds.filter((id) => id !== leadId)]
      : numericSubIds

    setUpdatingSubAssignees(true)
    try {
      await updateTicketAssignees(ticketId, agentIds)
      setMultipleAssigneeIds(numericSubIds)
      try { toastSuccess('Sub assignees updated successfully') } catch {}
    } catch (err) {
      console.error('Failed to update sub assignees:', err)
      try { toastError('Failed to update sub assignees. Please try again.') } catch {}
    } finally {
      setUpdatingSubAssignees(false)
    }
  }

  const currentActionTypes = useMemo(() => {
    const raw = (ticket as any)?.action_types
    if (!raw) return []
    const items: any[] = Array.isArray(raw)
      ? raw
      : typeof raw === "string" && raw.trim()
      ? raw.split(",").map((s) => s.trim())
      : []

    const list: Array<{ id: number; name: string }> = []
    const seen = new Set<string>()

    for (const item of items) {
      if (!item) continue
      if (typeof item === "object" && item !== null) {
        const id = Number(item.id) || 0
        const name = String(item.name || "").trim()
        if (name && !seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase())
          list.push({ id, name })
        }
      } else if (typeof item === "number") {
        const found = actionTypes.find((a) => a.id === item)
        const name = found?.name || `Type #${item}`
        if (!seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase())
          list.push({ id: item, name })
        }
      } else if (typeof item === "string") {
        const trimmed = item.trim()
        if (!trimmed) continue
        const found = actionTypes.find(
          (a) => a.name.toLowerCase() === trimmed.toLowerCase() || String(a.id) === trimmed
        )
        const id = found ? found.id : 0
        const name = found ? found.name : trimmed
        if (!seen.has(name.toLowerCase())) {
          seen.add(name.toLowerCase())
          list.push({ id, name })
        }
      }
    }
    return list
  }, [ticket, actionTypes])

  const availableActionTypes = useMemo(() => {
    return actionTypes.filter(
      (at) => !currentActionTypes.some((c) => (c.id > 0 && c.id === at.id) || c.name.toLowerCase() === at.name.toLowerCase())
    )
  }, [actionTypes, currentActionTypes])

  const filteredAvailableActionTypes = useMemo(() => {
    return availableActionTypes.filter((at) =>
      at.name.toLowerCase().includes(actionTypeSearch.toLowerCase())
    )
  }, [availableActionTypes, actionTypeSearch])

  const handleActionTypesChange = async (nextIds: number[]) => {
    if (!ticket) return
    const ticketId = ticket.id || ticket.ticketId
    if (!ticketId) return

    setUpdatingActionTypes(true)
    try {
      const updated = await updateTicketActionTypes(Number(ticketId), nextIds)
      
      const newActionTypes = actionTypes.filter((a) => nextIds.includes(a.id))
      setTicket((prev) => {
        if (!prev) return prev
        return {
          ...prev,
          action_types: (updated as any)?.action_types ?? newActionTypes,
        }
      })
      toastSuccess("Action type updated successfully")
    } catch (err: any) {
      console.error("Failed to update action types:", err)
      toastError(err?.response?.data?.message || "Failed to update action type. Please try again.")
    } finally {
      setUpdatingActionTypes(false)
    }
  }

  const addActionType = (newTypeId: number) => {
    setShowActionTypeDropdown(false)
    setActionTypeSearch("")
    const currentIds = currentActionTypes
      .map((t) => {
        if (t.id > 0) return t.id
        const match = actionTypes.find((a) => a.name.toLowerCase() === t.name.toLowerCase())
        return match ? match.id : null
      })
      .filter((id): id is number => typeof id === "number" && id > 0)

    if (!currentIds.includes(newTypeId)) {
      handleActionTypesChange([...currentIds, newTypeId])
    }
  }

  const removeActionType = (removeId: number, removeName: string) => {
    const remainingIds = currentActionTypes
      .filter((t) => (removeId > 0 ? t.id !== removeId : t.name.toLowerCase() !== removeName.toLowerCase()))
      .map((t) => {
        if (t.id > 0) return t.id
        const match = actionTypes.find((a) => a.name.toLowerCase() === t.name.toLowerCase())
        return match ? match.id : null
      })
      .filter((id): id is number => typeof id === "number" && id > 0)

    handleActionTypesChange(remainingIds)
  }

  const handleCreateAndAddActionType = async (name: string) => {
    const trimmed = name.trim()
    if (!trimmed) return
    if (!ticket) return
    const ticketId = ticket.id || ticket.ticketId
    if (!ticketId) return

    // If an action type with this name already exists in available, just add it!
    const existing = actionTypes.find((a) => a.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      addActionType(existing.id)
      return
    }

    setCreatingActionType(true)
    try {
      const appId = (ticket as any)?.application_id || (ticket as any)?.application?.id
      const created = await createActionType(trimmed, appId ? Number(appId) : undefined)
      
      // Update global action types list
      setActionTypes((prev) => {
        if (prev.some((a) => a.id === created.id)) return prev
        return [...prev, created].sort((a, b) => a.name.localeCompare(b.name))
      })

      // Add to ticket
      const currentIds = currentActionTypes
        .map((t) => {
          if (t.id > 0) return t.id
          const match = actionTypes.find((a) => a.name.toLowerCase() === t.name.toLowerCase())
          return match ? match.id : null
        })
        .filter((id): id is number => typeof id === "number" && id > 0)

      setShowActionTypeDropdown(false)
      setActionTypeSearch("")

      const nextIds = [...currentIds, created.id]
      await handleActionTypesChange(nextIds)
    } catch (err: any) {
      console.error("Failed to create action type:", err)
      toastError(err?.response?.data?.message || "Failed to create action type. Please try again.")
    } finally {
      setCreatingActionType(false)
    }
  }

  const handleStatusChange = async (newStatus: string) => {
    if (!ticket) return
    const ticketId = ticket.id || ticket.ticketId
    if (!ticketId) return
    if (newStatus === selectedStatus) return

    // Store old status for history
    const oldStatus = ticket.status || selectedStatus || "No Status"

    setUpdatingStatus(true)
    try {
      const payload: UpdateTicketDto = {
        // If newStatus is empty, send null to explicitly clear the status
        // If newStatus has a value, send that value to update the status
        status: newStatus || null,
      }
      const updatedTicket = await updateTicket(ticketId, payload)
      setTicket((prev) => {
        if (!prev) return updatedTicket ?? prev
        return {
          ...prev,
          ...(updatedTicket ?? {}),
          status: newStatus || "",
        }
      })
      setSelectedStatus(newStatus)

      // Add history entry (non-blocking)
      const historyPayload = createStatusChangeHistory({
        oldStatus,
        newStatus,
        ticketId,
      })

      addTicketHistory(historyPayload).catch((error) => {
        console.warn('Ticket updated but history logging failed:', error);
      })

      try { toastSuccess(newStatus ? locale.success.status_update_success : locale.success.status_cleared_success) } catch {}
    } catch (err) {
      console.error("Failed to update status:", err)
      try { toastError(locale.errors.status_update_failed) } catch {}
      setSelectedStatus(ticket.status ?? "")
    } finally {
      setUpdatingStatus(false)
    }
  }

  const handlePriorityChange = async (newPriority: string) => {
    if (!ticket) return
    const ticketId = ticket.id || ticket.ticketId
    if (!ticketId) return
    if (newPriority === selectedPriority) return

    // Store old priority for history
    const oldPriorityValue = normalizePriority(ticket.priority)
    const oldPriorityLabel = oldPriorityValue
      ? PRIORITY_LABELS[oldPriorityValue as TicketPriorityValue]
      : "No Priority"

    setUpdatingPriority(true)
    try {
      // Convert the selected value (number string like "4") to priority label (like "critical")
      const priorityNumber = newPriority ? Number(newPriority) : undefined
      const priorityLabel = priorityNumber === TICKET_PRIORITY.LOW ? PRIORITY_LABELS_LOWERCASE[TICKET_PRIORITY.LOW] :
        priorityNumber === TICKET_PRIORITY.MEDIUM ? PRIORITY_LABELS_LOWERCASE[TICKET_PRIORITY.MEDIUM] :
          priorityNumber === TICKET_PRIORITY.HIGH ? PRIORITY_LABELS_LOWERCASE[TICKET_PRIORITY.HIGH] :
            priorityNumber === TICKET_PRIORITY.CRITICAL ? PRIORITY_LABELS_LOWERCASE[TICKET_PRIORITY.CRITICAL] : undefined

      const payload: UpdateTicketDto = {
        priority: priorityLabel as "low" | "medium" | "high" | "critical" | undefined,
      }
      const updatedTicket = await updateTicket(ticketId, payload)
      setTicket((prev) => {
        if (!prev) return updatedTicket ?? prev
        const updated = updatedTicket ?? prev
        return {
          ...prev,
          ...updated,
          ...(priorityNumber !== undefined ? { priority: priorityNumber as TicketPriorityValue } : {}),
        }
      })
      setSelectedPriority(newPriority)

      // Add history entry (non-blocking)
      const newPriorityLabel = priorityNumber
        ? PRIORITY_LABELS[priorityNumber as TicketPriorityValue]
        : "No Priority"

      // Get current status (from updated ticket or fallback to current state)
      const currentStatus = updatedTicket?.status || ticket.status || selectedStatus || "Open"

      const historyPayload = createPriorityChangeHistory({
        oldPriorityLabel,
        newPriorityLabel,
        status: currentStatus,
        priorityValue: priorityLabel,
        ticketId,
      })

      addTicketHistory(historyPayload).catch((error) => {
        console.warn('Ticket updated but history logging failed:', error);
      })

      try { toastSuccess(locale.success.priority_update_success) } catch {}
    } catch (err) {
      console.error("Failed to update priority:", err)
      try { toastError(locale.errors.priority_update_failed) } catch {}
      // Revert to previous value on error
      const priorityValue = normalizePriority(ticket.priority)
      setSelectedPriority(priorityValue ? String(priorityValue) : "")
    } finally {
      setUpdatingPriority(false)
    }
  }
  const allResources: Array<{ display: string; download: string; mime?: string; name?: string }> = [
    // Try to use presigned file_url/thumb_url first, but allow hash as fallback if backend doesn't provide presigned URLs yet
    ...resources
      .filter((r) => r.file_url || r.thumb_url || r.hash) // Include if has any URL field
      .map((r) => {
        // Prefer presigned URLs, but fall back to hash if backend doesn't provide presigned URLs yet
        // Note: hash will cause Access Denied if bucket is private, but at least we can see what's available
        const downloadUrl = r.file_url || r.hash || ""
        const displayUrl = r.thumb_url || r.file_url || r.hash || ""
        return {
          display: displayUrl,
          download: downloadUrl,
          mime: r.file_mime_type,
          name: r.originalName,
        }
      })
      .filter((r) => r.display && r.download), // Only show if both display and download URLs exist
    // Legacy attachment URLs if any (display and download are same)
    ...attachmentUrls
      .filter((u) => u && typeof u === 'string')
      .map((u) => ({ display: u, download: u })),
  ]

  // Removed unused isImageLike helper

  const normalizePriority = (value: unknown): TicketPriorityValue | undefined => {
    if (value === null || value === undefined) return undefined
    const str = String(value).toLowerCase().trim()
    if (str === String(TICKET_PRIORITY.LOW) || str === 'low') return TICKET_PRIORITY.LOW
    if (str === String(TICKET_PRIORITY.MEDIUM) || str === 'medium' || str === 'med') return TICKET_PRIORITY.MEDIUM
    if (str === String(TICKET_PRIORITY.HIGH) || str === 'high') return TICKET_PRIORITY.HIGH
    if (str === String(TICKET_PRIORITY.CRITICAL) || str === 'critical' || str === 'crit') return TICKET_PRIORITY.CRITICAL
    const n = Number(str)
    if (TICKET_PRIORITY_VALUES.includes(n as any)) return n as TicketPriorityValue
    return undefined
  }

  const getPriorityLabel = (priority: number | string | undefined) => {
    const p = normalizePriority(priority)
    switch (p) {
      case TICKET_PRIORITY.LOW:
        return PRIORITY_LABELS[TICKET_PRIORITY.LOW]
      case TICKET_PRIORITY.MEDIUM:
        return PRIORITY_LABELS[TICKET_PRIORITY.MEDIUM]
      case TICKET_PRIORITY.HIGH:
        return PRIORITY_LABELS[TICKET_PRIORITY.HIGH]
      case TICKET_PRIORITY.CRITICAL:
        return PRIORITY_LABELS[TICKET_PRIORITY.CRITICAL]
      default:
        return "N/A"
    }
  }

  const getPriorityClass = (priority: number | string | undefined) => {
    const p = normalizePriority(priority)
    switch (p) {
      case TICKET_PRIORITY.LOW:
        return "priority-chip priority-low"
      case TICKET_PRIORITY.MEDIUM:
        return "priority-chip priority-medium"
      case TICKET_PRIORITY.HIGH:
        return "priority-chip priority-high"
      case TICKET_PRIORITY.CRITICAL:
        return "priority-chip priority-critical"
      default:
        return "priority-chip"
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen max-w-6xl mx-auto animate-pulse">
        {/* Top bar: Back + right action buttons */}
        <div className="flex items-center justify-between mb-6">
          <div className="h-8 w-20 rounded-md bg-surface-tertiary" />
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-md bg-surface-tertiary" />
            <div className="h-8 w-28 rounded-md bg-surface-tertiary" />
            <div className="h-8 w-32 rounded-md bg-surface-tertiary" />
          </div>
        </div>

        {/* Title row: Ticket #X – Title + status + priority badges */}
        <div className="flex items-center gap-3 mb-6">
          <div className="h-7 w-64 rounded bg-surface-tertiary" />
          <div className="h-6 w-20 rounded-full bg-surface-tertiary" />
          <div className="h-6 w-20 rounded-full bg-surface-tertiary" />
        </div>

        <div className="flex gap-6 items-start">
          {/* Main content */}
          <div className="flex-1 space-y-5 min-w-0">
            {/* Description box */}
            <div className="rounded-lg border border-borderColor-secondary p-5 space-y-3">
              <div className="h-3 w-24 rounded bg-surface-tertiary" />
              <div className="h-3 w-full rounded bg-surface-tertiary" />
              <div className="h-3 w-5/6 rounded bg-surface-tertiary" />
              <div className="h-3 w-3/4 rounded bg-surface-tertiary" />
              <div className="h-3 w-1/2 rounded bg-surface-tertiary" />
              <div className="h-20" />
            </div>

            {/* Attachment section */}
            <div className="space-y-2">
              <div className="h-3 w-20 rounded bg-surface-tertiary" />
              <div className="h-3 w-28 rounded bg-surface-tertiary" />
            </div>

            {/* Comment tabs + sort */}
            <div className="flex items-center justify-between">
              <div className="flex gap-2">
                <div className="h-9 w-32 rounded-md bg-surface-tertiary" />
                <div className="h-9 w-36 rounded-md bg-surface-tertiary" />
              </div>
              <div className="h-9 w-28 rounded-md bg-surface-tertiary" />
            </div>

            {/* Comment textarea */}
            <div className="rounded-lg border border-borderColor-secondary p-4 space-y-4">
              <div className="h-32 w-full rounded bg-surface-tertiary" />
              <div className="flex items-center justify-between">
                <div className="h-8 w-8 rounded bg-surface-tertiary" />
                <div className="flex gap-2">
                  <div className="h-9 w-20 rounded-md bg-surface-tertiary" />
                  <div className="h-9 w-20 rounded-md bg-surface-tertiary" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="w-72 flex-shrink-0 rounded-lg border border-borderColor-secondary p-5 space-y-5">
            {/* Status */}
            {['Status', 'Priority', 'Reporter', 'Location', 'Lead Assignee', 'Sub Assignee'].map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="h-3 w-16 rounded bg-surface-tertiary" />
                <div className="h-9 w-40 rounded-md bg-surface-tertiary" />
              </div>
            ))}

            {/* Action Type */}
            <div className="space-y-2">
              <div className="h-3 w-24 rounded bg-surface-tertiary" />
              <div className="h-6 w-16 rounded-full bg-surface-tertiary" />
            </div>

            {/* Created / Updated */}
            <div className="space-y-3 pt-2 border-t border-borderColor-secondary">
              {[1, 2].map((i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="h-3 w-14 rounded bg-surface-tertiary" />
                  <div className="h-3 w-32 rounded bg-surface-tertiary" />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !ticket) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error || "Ticket not found"}</p>
            <Button style="Primary" text="Go Back" onClick={() => window.history.back()} />
          </div>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen max-w-6xl mx-auto">
        {stale && (
          <div className="mb-4 bg-red-50 border-l-4 border-red-400 rounded px-4 py-3 flex items-center gap-3">
            <span className="material-symbols-outlined text-red-400 text-xl flex-shrink-0">update</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-red-800 truncate">
                Ticket{ticket?.id ? ` #${ticket.id}` : ''} updated{ticket?.title ? ` – ${ticket.title}` : ''}
              </p>
              <p className="text-xs text-red-600 mt-0.5">Refresh to load the latest changes.</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => window.location.reload()}
                className="px-3 py-1.5 text-xs font-medium rounded bg-gray-800 text-white hover:bg-gray-700 transition-colors"
              >
                Refresh
              </button>
              <button
                onClick={() => setStale(false)}
                className="p-1 rounded text-gray-500 hover:text-gray-800 transition-colors"
                title="Dismiss"
              >
                <span className="material-symbols-outlined text-base leading-none">close</span>
              </button>
            </div>
          </div>
        )}
        {/* Main Content */}
        <div className="grid grid-cols-12 gap-10 mt-6">
          <div className="col-span-8">
            <div className="flex items-center gap-2">
              <button
                onClick={() => window.history.back()}
                className="px-3 py-1 flex items-center gap-2 rounded-md bg-surface-primary hover:bg-primary-100">
                <ArrowLeft size={16} /> Back
              </button>
              {isSuperAdmin && (
                <button
                  onClick={async () => {
                    if (!window.confirm(`Delete ticket #${ticket.id}? This cannot be undone.`)) return
                    try {
                      await deleteTicket(Number(ticket.id))
                      toastSuccess('Ticket deleted successfully')
                      navigate(-1)
                    } catch {
                      toastError('Failed to delete ticket')
                    }
                  }}
                  className="px-3 py-1 flex items-center gap-2 rounded-md bg-red-100 text-red-600 hover:bg-red-200">
                  <X size={16} /> Delete Ticket
                </button>
              )}
            </div>
            <div className="my-6 flex flex-col md:flex-row md:items-start  gap-4">
              <h1 className="text-3xl break-words">
                Ticket #{ticket.id ?? ticket.ticketId} - {(ticket as any).title || (ticket as any).heading || ticketDescription || "N/A"}
              </h1>
              <div className="flex gap-2 pt-2">
                <span className={getStatusClass(String(ticket.status))} title={String(ticket.status)}>{String(ticket.status)}</span>
                <span className={getPriorityClass(ticket.priority)}>
                  {getPriorityLabel(ticket.priority)}
                </span>
              </div>
            </div>
            {/* Description */}
            <div className=" mb-4 p-4 min-h-40 space-y-1 bg-surface-primary rounded-lg">
            <p className="text-textColor-muted">Description</p>
              <p className="break-words whitespace-pre-line">{ticketDescription || "N/A"}</p>
            </div>
            {/* Attachments */}
            <div className="mt-8 space-y-2">
              <p className="text-textColor-muted">Attachment</p>
              {allResources.length === 0 ? (
                <div>
                  <p className="text-sm text-textColor-muted">No attachments.</p>
                  {resources.length > 0 && (
                    <p className="text-xs text-yellow-600 mt-2">
                      Warning: {resources.length} resource(s) found but missing presigned URLs (file_url/thumb_url).
                      Check console for details.
                    </p>
                  )}
                </div>
              ) : (
                <div className="flex flex-wrap gap-4">
                  {allResources.map((res, index) => {
                    // Get filename from originalName, or extract from URL
                    let fileName = res.name || ''

                    // If name is not available, try to extract from download URL
                    if (!fileName || fileName.trim() === '') {
                      const urlParts = res.download?.split('/') || []
                      const lastPart = urlParts[urlParts.length - 1] || ''
                      // Remove query params if present
                      const cleanName = lastPart.split('?')[0]
                      if (cleanName && cleanName.length > 0) {
                        // Remove UUID prefix if present (e.g., "2025-11-03T19-43-50-613Z-b01c9076-08b0-4fe5-8562-08a256d756f9-me.png" -> "me.png")
                        const parts = cleanName.split('-')
                        if (parts.length > 1) {
                          // Check if it looks like a UUID pattern, take the last meaningful part
                          const lastFewParts = parts.slice(-2).join('-')
                          if (lastFewParts.includes('.')) {
                            fileName = lastFewParts
                          } else {
                            fileName = cleanName
                          }
                        } else {
                          fileName = cleanName
                        }
                      }
                    }

                    // Fallback to a default name if still empty
                    if (!fileName || fileName.trim() === '') {
                      fileName = `attachment-${index + 1}`
                    }

                    return (
                      <AttachmentPreview
                        key={`${res.download}-${index}`}
                        fileUrl={res.display}
                        downloadUrl={res.download}
                        fileName={fileName}
                        mimeType={res.mime}
                      />
                    )
                  })}
                </div>
              )}
            </div>
            {/* Invoice — always show if data exists, otherwise show only when user requests it */}
            {((ticket as any)?.invoice || showInvoice) && (
              <BillingInvoice ticketId={ticket?.id || (ticket as any)?.ticketId} initialInvoice={(ticket as any)?.invoice} />
            )}
            {/* Comments */}
            <div className="my-16 space-y-8 ">
              <div className="flex justify-between">
                <div className="bg-surface-primary p-1 rounded-lg shadow-md">
                  <button
                    className={`px-3 py-2 text-sm font-semibold rounded-md ${isInternal
                        ? "text-textColor-muted"
                        : "text-textColor-base bg-primary-100 "
                      }`}
                    onClick={() => setIsInternal(false)}
                  >
                    All Comments
                  </button>
                  <button
                    className={`px-3 py-2 text-sm font-semibold rounded-md ${isInternal
                      ? "text-textColor-base bg-primary-100 "
                      : "text-textColor-muted"
                      }`}
                    onClick={() => setIsInternal(true)}
                  >
                    Internal Comments
                  </button>
                </div>
                <button
                  onClick={() => setNewestFirst((s) => !s)}
                  className={`h-10 px-3 flex items-center gap-2 text-sm font-medium rounded-md ${newestFirst ? 'bg-surface-primary text-textColor-base shadow-md' : 'text-textColor-muted hover:text-textColor-base hover:bg-primary-100'}`}
                >
                  <span>{newestFirst ? 'Newest First' : 'Oldest First'}</span>
                  <span className="material-symbols-outlined">filter_list</span>
                </button>
              </div>
              {/* New Comment */}
              <div className="flex gap-5 pb-5">
                <div className="w-full space-y-4 bg-surface-primary rounded-lg p-4">
                    {/* Show internal recipient dropdown only when composing an internal comment */}
                    {isInternal && (
                      <div className="pb-2">
                        <SelectField
                          label="Internal Recipient"
                          name="internal_recipient"
                          value={internalRecipient}
                          onChange={(value) => setInternalRecipient(value)}
                          options={[
                            { value: "", label: "Select agent" },
                            ...agents
                              .map((agent) => {
                                const agentId = agent.id ?? (agent as any).agent_id ?? ""
                                return { agent, agentId }
                              })
                              .filter(({ agentId }) => agentId !== "")
                              .map(({ agent, agentId }) => ({ value: String(agentId), label: `${agent.first_name || ""} ${agent.last_name || ""}`.trim() || agent.nickname || agent.email || `Agent #${agentId}` })),
                          ]}
                          placeholder="Select agent"
                          disabled={submitting}
                          className="md:w-1/2 "
                        />
                      </div>
                    )}
                    <textarea
                      value={commentValue}
                      onChange={(e) => setCommentValue(e.target.value)}
                      placeholder="Write a comment..."
                      rows={6}
                      className="w-full min-h-[120px] p-3 border border-borderColor-secondary rounded-md bg-transparent text-textColor-base resize-vertical"
                    />

                    {/* Canned reply chips */}
                    {cannedReplies.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        {cannedReplies.map((reply) => (
                          <button
                            key={reply.id}
                            type="button"
                            onClick={() => handleQuickReply(reply.text)}
                            disabled={submitting}
                            className="px-2.5 py-1 text-xs rounded-full border border-borderColor-secondary bg-surface-secondary text-textColor-muted hover:bg-primary-100 hover:text-textColor-base hover:border-primary-400 transition-colors disabled:opacity-50"
                            title={reply.text}
                          >
                            {reply.text.length > 45 ? reply.text.slice(0, 45) + "…" : reply.text}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Selected files preview */}
                    {selectedFiles.length > 0 && (
                      <div className="flex flex-wrap gap-2 pt-2">
                        {selectedFiles.map((file, idx) => (
                          <div key={idx} className="flex items-center gap-1.5 px-2 py-1 bg-surface-secondary border border-borderColor-secondary rounded text-xs text-textColor-base">
                            <span className="truncate max-w-[150px]">{file.name}</span>
                            <button
                              type="button"
                              onClick={() => removeSelectedFile(idx)}
                              className="text-textColor-muted hover:text-red-500"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex flex-wrap items-center justify-between gap-2 border-t border-borderColor-secondary pt-3 mt-2">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          className="h-8 w-8 flex items-center justify-center rounded-md border border-borderColor-secondary hover:bg-primary-100 text-textColor-muted hover:text-textColor-base"
                          title="Attach files"
                        >
                          <Paperclip size={16} />
                        </button>
                        <input
                          type="file"
                          multiple
                          onChange={handleFileChange}
                          className="hidden"
                          ref={fileInputRef}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSubmitComment}
                          disabled={(!hasVisibleContent(commentValue) && selectedFiles.length === 0) || submitting}
                          className={`h-8 rounded-md px-3 flex items-center gap-x-1 text-sm ${(!hasVisibleContent(commentValue) && selectedFiles.length === 0) || submitting
                              ? "bg-primary-100 text-textColor-muted cursor-not-allowed"
                              : "bg-primary-500 hover:bg-primary-600 text-base-white"
                            }`}
                        >
                          {submitting ? "Submitting..." : "Submit"}
                        </button>
                        <button
                          onClick={handleCancelComment}
                          className="h-8 rounded-md px-3 flex items-center gap-x-2 text-sm font-semibold  border border-borderColor-secondary hover:bg-primary-100"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                </div>
              </div>
                       
              {/* Existing Comments */}
              {filteredComments.length === 0 ? (
                <div className="text-sm text-textColor-muted">No comments yet.</div>
              ) : (
                displayedComments.map((c) => {
                  const recipientAgent = getCommentRecipientAgent(c)
                  const recipientLabel = recipientAgent
                    ? `${recipientAgent.first_name || ""} ${recipientAgent.last_name || ""}`.trim() || recipientAgent.nickname || recipientAgent.email || (recipientAgent.id ? `Agent #${recipientAgent.id}` : undefined)
                    : (( (c as any).to ?? (c as any).recipient_agent_id ) ? `Agent #${( (c as any).to ?? (c as any).recipient_agent_id )}` : undefined)

                  const fromUser = (c as any).FromUser
                  const fromAgent = c.from
                    ? agents.find((a) => a.user_id !== undefined && a.user_id !== null && Number(a.user_id) === Number(c.from))
                    : undefined
                  const fromLabel = fromAgent
                    ? `${fromAgent.first_name || ""} ${fromAgent.last_name || ""}`.trim() || fromAgent.nickname || fromAgent.email || `Agent #${fromAgent.id}`
                    : fromUser
                      ? fromUser.name || `${fromUser.first_name || ""} ${fromUser.last_name || ""}`.trim() || fromUser.username || fromUser.email
                      : (currentUser && c.from && (Number(currentUser.id) === Number(c.from) || Number((currentUser as any).user_id) === Number(c.from)))
                        ? `${currentUser.first_name || ""} ${currentUser.last_name || ""}`.trim() || currentUser.name || currentUser.username || currentUser.email
                        : (c.from ? `User #${c.from}` : undefined)

                  const cleanFromLabel = fromLabel ? fromLabel.trim().replace(/^[^a-zA-Z0-9]+/, '') : ''
                  const avatarInitial = cleanFromLabel
                    ? cleanFromLabel.charAt(0).toUpperCase()
                    : (fromLabel ? fromLabel.trim().replace(/^\+/, '').charAt(0).toUpperCase() : (c.type === 'internal' ? 'I' : 'P'))

                  return (
                    <div key={c.id} className="flex gap-5">
                      <UserAvatar background="#3DB658" name={avatarInitial} />
                      <div className="space-y-3 max-w-[880px]">
                        <div className="flex items-center gap-3">
                          <p className="font-semibold">{fromLabel ?? (c.type === 'internal' ? 'Internal' : 'Public')}</p>
                          {c.type === 'internal' ? (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-400 border border-amber-500/30 font-medium">
                              Internal
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/30 font-medium">
                              Public
                            </span>
                          )}
                          <span className="text-xs px-2 py-0.5 rounded-md bg-surface-secondary text-textColor-muted border border-borderColor-secondary">
                            {new Date(c.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <div className="mt-2">
                          {recipientLabel && c.type === 'internal' && (
                            <span className="inline-block mr-2 text-xs px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 border border-borderColor-secondary">
                              @{recipientLabel}
                            </span>
                          )}
                          <p className="inline whitespace-pre-wrap break-words">{c.comment}</p>
                          
                          {c.resources && c.resources.media_files && c.resources.media_files.length > 0 && (
                            <div className="mt-3 flex flex-wrap gap-3">
                              {c.resources.media_files.map((file: any, fileIndex: number) => {
                                let fileName = '';
                                if (file.file_path) {
                                  const parts = file.file_path.split('/');
                                  const rawName = parts[parts.length - 1] || '';
                                  const nameParts = rawName.split('-');
                                  if (nameParts.length > 1) {
                                    const lastFewParts = nameParts.slice(-2).join('-');
                                    fileName = lastFewParts.includes('.') ? lastFewParts : rawName;
                                  } else {
                                    fileName = rawName;
                                  }
                                }
                                if (!fileName) {
                                  fileName = `attachment-${fileIndex + 1}`;
                                }
                                return (
                                  <AttachmentPreview
                                    key={`${file.file_path || fileIndex}`}
                                    fileUrl={file.thumb_url || file.file_url}
                                    downloadUrl={file.file_url}
                                    fileName={fileName}
                                    mimeType={file.file_mime_type}
                                  />
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>

          {/* Sidebar */}
          <div className="col-span-4 ">
            <div className="mb-4 flex justify-end gap-2">
              <Suggestion id={ticket?.id || (ticket as any)?.ticketId} />
              {!(ticket as any)?.invoice && !showInvoice && (
                <button
                  onClick={() => setShowInvoice(true)}
                  className="px-3 py-1 flex items-center gap-2 rounded-md bg-surface-primary hover:bg-primary-100"
                >
                  <span className="material-symbols-outlined text-base" style={{ fontSize: 16 }}>receipt_long</span>
                  Add Invoice
                </button>
              )}
              <button
                onClick={() => {
                  const ticketId = ticket?.id || (ticket as any)?.ticketId
                  if (!ticketId) return
                  setTimelineTicket({ id: Number(ticketId), title: ticket?.title || (ticket as any)?.heading || `Ticket #${ticketId}` })
                }}
                className="px-3 py-1 flex items-center gap-2 rounded-md bg-surface-primary hover:bg-primary-100">
                <span className="material-symbols-outlined text-base" style={{ fontSize: 16 }}>timeline</span>
                Ticket Timeline
              </button>
            </div>
            <div className="p-4 px-5 space-y-3 bg-surface-primary rounded-lg">
              {/* Status */}
              <div className="flex gap-2 items-center">
                <div className="w-1/4">
                    <p className="text-textColor-muted">Status</p>  
                </div>
                <div className="flex items-center gap-2 text-warning-600 py-1 rounded-full text-sm">
                  <SelectField
                    label=""
                    name="status"
                    value={selectedStatus}
                    onChange={handleStatusChange}
                    options={[
                      { value: "", label: "Select status" },
                      ...STATUS_OPTIONS,
                    ]}
                    placeholder="Select status"
                    disabled={updatingStatus}
                    className="!mb-0 min-w-[200px]"
                  />
                </div>
              </div>
              {/* Priority */}
              <div className="flex gap-2 items-center">
                <div className="w-1/4">
                    <p className="text-textColor-muted">Priority</p>
                </div>
                <SelectField
                  label=""
                  name="priority"
                  value={selectedPriority}
                  onChange={handlePriorityChange}
                  options={[
                    { value: "", label: "Select priority" },
                    ...PRIORITY_OPTIONS,
                  ]}
                  placeholder="Select priority"
                  disabled={updatingPriority}
                  className="!mb-0 min-w-[200px]"
                />
              </div>
              {/* Reporter */}
              <div className="flex gap-2 items-center ">
                <div className="w-1/4">
                    <p className="text-textColor-muted">Reporter</p>
                </div>
                {(() => {
                  const customer = (ticket as any).Customer
                  const isCustomer = !!(customer?.hash)
                  const raw = asDisplay((ticket as any).reporter) || asDisplay(customer)
                  const display = !raw ? 'N/A' : /^\+?[\d\s\-().]{7,}$/.test(raw.trim()) ? formatPhone(raw.trim()) : raw
                  return (
                    <div
                      className={`flex items-center gap-2 py-1 rounded-full text-sm flex-wrap${isCustomer ? ' cursor-pointer text-blue-400 hover:text-blue-300' : ''}`}
                      onClick={isCustomer ? () => navigate(`/dashboard/customers/details/${customer.hash}`) : undefined}
                      title={isCustomer ? 'View customer profile' : undefined}
                    >
                      <UserAvatar name={getInitials((ticket as any).reporter) || getInitials(customer) || 'NA'} background={'#3B82F6'} small className="text-xs h-4 w-4" />
                      <p className="font-medium whitespace-nowrap">{display}</p>
                      {isCustomer && customer?.tag && (
                        <CustomerTagBadge tag={customer.tag} size="sm" />
                      )}
                      {isCustomer && customerTicketCount !== null && (
                        <span className="shrink-0 text-xs bg-primary-100 text-primary-700 rounded-full px-2 py-0.5 font-medium" title="Total tickets by this customer">
                          {customerTicketCount} ticket{customerTicketCount !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>
                  )
                })()}
              </div>
              <div className="flex gap-2 items-center ">
                <div className="w-1/4">
                    <p className="text-textColor-muted">Location</p>
                </div>
                <div className="flex items-center gap-2 py-1 rounded-full text-sm">
                  <p className="font-medium">{asDisplay((ticket as any).locationName) || 'N/A'}</p>
                </div>
              </div>
              {/* Lead Assignee */}
              <div className="flex gap-2 items-center">
                <div className="w-1/4 shrink-0">
                  <p className="text-textColor-muted">Lead Assignee</p>
                </div>
                <div className="flex items-center gap-2 py-1 rounded-full text-sm">
                  <SelectField
                    label=""
                    name="assignee"
                    value={selectedAssignee}
                    onChange={handleAssigneeChange}
                    options={[
                      { value: "", label: "Unassigned" },
                      ...agents
                        .map((agent) => {
                          const agentId = agent.id ?? (agent as any).agent_id ?? ""
                          return { agent, agentId }
                        })
                        .filter(({ agentId }) => agentId !== "")
                        .map(({ agent, agentId }) => {
                          const label =
                            `${agent.first_name || ""} ${agent.last_name || ""}`.trim() ||
                            agent.nickname ||
                            agent.email ||
                            (agentId ? `Agent #${agentId}` : "Unnamed Agent")
                          return {
                            value: String(agentId),
                            label,
                          }
                        }),
                    ]}
                    placeholder="Select assignee"
                    disabled={updatingAssignee}
                    className="!mb-0 min-w-[200px] max-w-[200px]"
                  />
                </div>
              </div>
              {/* Sub Assignees */}
              {(() => {
                const leadId = selectedAssignee ? Number(selectedAssignee) : null
                const subIds = multipleAssigneeIds.filter((aid) => aid !== leadId)

                const availableAgents = agents.filter((agent) => {
                  const agentId = Number(agent.id ?? (agent as any).agent_id)
                  return agentId && agentId !== leadId && !subIds.includes(agentId)
                })

                const removeSubAssignee = (removeId: number) => {
                  handleSubAssigneesChange(subIds.filter((id) => id !== removeId).map(String))
                }

                const addSubAssignee = (agentId: string) => {
                  setShowSubAssigneeDropdown(false)
                  handleSubAssigneesChange([...subIds, Number(agentId)].map(String))
                }

                const addButton = availableAgents.length > 0 && !updatingSubAssignees && (
                  <div ref={subAssigneeDropdownRef} className="relative inline-flex">
                    <button
                      type="button"
                      onClick={() => setShowSubAssigneeDropdown((v) => !v)}
                      className="flex items-center gap-1 text-sm text-textColor-muted hover:text-primary-600"
                      title="Add sub assignee"
                    >
                      <span className="material-symbols-outlined text-sm leading-none">add</span>
                      <span>Add</span>
                    </button>
                    {showSubAssigneeDropdown && (
                      <ul className="absolute left-0 top-6 z-50 w-48 bg-surface-primary border border-borderColor-secondary rounded-lg shadow-lg max-h-48 overflow-auto">
                        {availableAgents.map((agent) => {
                          const agentId = agent.id ?? (agent as any).agent_id
                          const agentLabel =
                            `${agent.first_name || ""} ${agent.last_name || ""}`.trim() ||
                            agent.nickname || agent.email || `Agent #${agentId}`
                          return (
                            <li
                              key={agentId}
                              onMouseDown={(e) => { e.preventDefault(); addSubAssignee(String(agentId)) }}
                              className="px-3 py-2 text-sm cursor-pointer hover:bg-surface-secondary"
                            >
                              {agentLabel}
                            </li>
                          )
                        })}
                      </ul>
                    )}
                  </div>
                )

                return (
                  <div className="flex gap-2 items-start">
                    <div className="w-1/4 shrink-0 pt-1">
                      <p className="text-textColor-muted">Sub Assignee</p>
                    </div>
                    <div className="flex flex-col gap-2 flex-1">
                      {subIds.map((aid, idx) => {
                        const agent = agents.find((a) => Number(a.id ?? (a as any).agent_id) === aid)
                        const label = agent
                          ? `${agent.first_name || ""} ${agent.last_name || ""}`.trim() || agent.nickname || agent.email || `Agent #${aid}`
                          : `Agent #${aid}`
                        const isLast = idx === subIds.length - 1
                        return (
                          <div key={aid} className="flex items-center gap-2">
                            <UserAvatar name={getInitials(label) || "A"} background="#6366F1" small className="text-xs h-4 w-4" />
                            <span className="text-sm font-medium">{label}</span>
                            {!updatingSubAssignees && (
                              <button
                                type="button"
                                onClick={() => removeSubAssignee(aid)}
                                className="material-symbols-outlined text-sm text-textColor-muted hover:text-red-500 leading-none"
                              >
                                close
                              </button>
                            )}
                            {isLast && addButton}
                          </div>
                        )
                      })}
                      {subIds.length === 0 && addButton}
                    </div>
                  </div>
                )
              })()}




              {/* Action Type */}
              <div className="space-y-3 py-4 border-y border-borderColor-secondary">
                <div className="flex items-center justify-between">
                  <p className="text-textColor-muted">Action Type</p>
                  {!updatingActionTypes && (
                    <div ref={actionTypeDropdownRef} className="relative inline-flex">
                      <button
                        type="button"
                        onClick={() => {
                          setShowActionTypeDropdown((v) => !v)
                          setActionTypeSearch("")
                        }}
                        disabled={creatingActionType}
                        className="flex items-center gap-1 text-sm text-textColor-muted hover:text-primary-600 transition-colors cursor-pointer disabled:opacity-50"
                        title="Add or create action type"
                      >
                        <span className="material-symbols-outlined text-sm leading-none">add</span>
                        <span>Add</span>
                      </button>
                      {showActionTypeDropdown && (
                        <div className="absolute right-0 top-6 z-50 w-64 bg-surface-primary border border-borderColor-secondary rounded-lg shadow-xl p-2 max-h-72 overflow-hidden flex flex-col">
                          <div className="mb-2">
                            <input
                              type="text"
                              value={actionTypeSearch}
                              onChange={(e) => setActionTypeSearch(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault()
                                  const trimmed = actionTypeSearch.trim()
                                  if (!trimmed) return
                                  const matched = filteredAvailableActionTypes.find(
                                    (a) => a.name.toLowerCase() === trimmed.toLowerCase()
                                  )
                                  if (matched) {
                                    addActionType(matched.id)
                                  } else {
                                    handleCreateAndAddActionType(trimmed)
                                  }
                                }
                              }}
                              placeholder="Search or type new..."
                              className="w-full px-2.5 py-1.5 text-xs rounded border border-borderColor-secondary bg-surface-secondary text-textColor-primary placeholder:text-textColor-muted focus:outline-none focus:border-primary-500"
                              autoFocus
                              disabled={creatingActionType}
                            />
                          </div>

                          <ul className="overflow-y-auto max-h-52 divide-y divide-borderColor-secondary/50">
                            {actionTypeSearch.trim().length > 0 &&
                              !actionTypes.some(
                                (a) => a.name.toLowerCase() === actionTypeSearch.trim().toLowerCase()
                              ) && (
                                <li
                                  onMouseDown={(e) => {
                                    e.preventDefault()
                                    handleCreateAndAddActionType(actionTypeSearch.trim())
                                  }}
                                  className="p-2 text-xs cursor-pointer bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 font-medium rounded transition-colors flex items-center justify-between border border-primary-500/30 mb-1"
                                >
                                  <span className="flex items-center gap-1.5 truncate">
                                    <span className="material-symbols-outlined text-sm">add_circle</span>
                                    <span>
                                      Create "<strong>{actionTypeSearch.trim()}</strong>"
                                    </span>
                                  </span>
                                  <span className="text-[10px] uppercase font-semibold tracking-wider bg-primary-500/20 px-1.5 py-0.5 rounded text-primary-300 shrink-0">
                                    New
                                  </span>
                                </li>
                              )}

                            {filteredAvailableActionTypes.map((item) => (
                              <li
                                key={item.id}
                                onMouseDown={(e) => {
                                  e.preventDefault()
                                  addActionType(item.id)
                                }}
                                className="px-3 py-2 text-xs cursor-pointer hover:bg-surface-secondary text-textColor-primary rounded transition-colors flex items-center justify-between"
                              >
                                <span>{item.name}</span>
                                <span className="material-symbols-outlined text-xs text-textColor-muted">add</span>
                              </li>
                            ))}

                            {filteredAvailableActionTypes.length === 0 &&
                              !(
                                actionTypeSearch.trim().length > 0 &&
                                !actionTypes.some(
                                  (a) => a.name.toLowerCase() === actionTypeSearch.trim().toLowerCase()
                                )
                              ) && (
                                <li className="px-3 py-3 text-xs text-textColor-muted text-center">
                                  {actionTypeSearch ? "No matching action types" : "No action types available"}
                                </li>
                              )}
                          </ul>
                          {creatingActionType && (
                            <div className="pt-2 text-center text-xs text-primary-500 italic">
                              Creating action type...
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 items-center">
                  {currentActionTypes.map((item) => (
                    <span
                      key={item.id > 0 ? item.id : item.name}
                      className="chip inline-flex items-center gap-1.5 py-1 px-2.5 rounded-md text-xs font-medium"
                    >
                      <span>{item.name}</span>
                      {!updatingActionTypes && (
                        <button
                          type="button"
                          onClick={() => removeActionType(item.id, item.name)}
                          className="material-symbols-outlined text-xs text-textColor-muted hover:text-red-500 leading-none cursor-pointer"
                          title={`Remove ${item.name}`}
                        >
                          close
                        </button>
                      )}
                    </span>
                  ))}
                  {currentActionTypes.length === 0 && (
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm text-textColor-muted">N/A</p>
                      {availableActionTypes.length > 0 && !updatingActionTypes && (
                        <button
                          type="button"
                          onClick={() => {
                            setShowActionTypeDropdown((v) => !v)
                            setActionTypeSearch("")
                          }}
                          className="text-xs text-primary-600 hover:text-primary-700 font-medium underline cursor-pointer"
                        >
                          Assign Action Type
                        </button>
                      )}
                    </div>
                  )}
                  {updatingActionTypes && (
                    <span className="text-xs text-textColor-muted italic">Updating...</span>
                  )}
                </div>
              </div>

  

              {/* Created */}
              <div className="flex gap-2 items-center justify-between">
                <p className="text-textColor-muted">Created</p>
                <p className="text-sm font-medium">
                  {ticket.createdAt
                    ? new Date(String((ticket.createdAt as any) ?? '').replace(/ [A-Z]{2,4}$/, '')).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : ticket.dateCreated || 'N/A'
                  }
                </p>
              </div>

              {/* Update */}
              <div className="flex gap-2 items-center justify-between">
                <p className="text-textColor-muted">Update</p>
                <p className="text-sm font-medium">
                  {(ticket as any).updatedAt
                    ? new Date(typeof (ticket as any).updatedAt === 'string' ? (ticket as any).updatedAt.replace(/ [A-Z]{2,4}$/, '') : (ticket as any).updatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                    : ticket.createdAt
                      ? new Date(String((ticket.createdAt as any) ?? '').replace(/ [A-Z]{2,4}$/, '')).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
                      : 'N/A'
                  }
                </p>
              </div>
            </div>
          </div>
        </div>

        <TicketTimelineDrawer ticket={timelineTicket} onClose={() => setTimelineTicket(null)} />
      </div>
      
    </>
  )
}

export default ViewTicket