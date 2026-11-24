"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import InputField from "@/components/Molecules/InputField";
import SelectField from "@/components/Molecules/SelectField";
import TagInputField from "@/components/Molecules/TagInputField";
import FileUploadField from "@/components/Molecules/FileUploadField";
import TextEditorField from "@/components/Molecules/TextEditorField";
import FormActions from "@/components/Molecules/FormActions";
import RadioGroup from "@/components/Molecules/RadioGroup";
import { useDispatch } from "react-redux";
import { useAppSelector } from "@/redux/hooks";
import { AppDispatch } from "@/redux/store";
import { fetchTicketById, updateExistingTicket } from "@/redux/ticket/ticketSlice";
import { getAllTickets } from "@/services/ticketService";
import { 
  deleteTicketResource, 
  listTicketResources, 
  uploadTicketResource, 
  type TicketResource 
} from "@/services/ticketResourceService";
import { getEnrichedTicketById, type EnrichedTicketResponse } from "@/services/ticketService";
import { TICKET_STATUS } from "@/constants/ticketStatus";
import { TICKET_PRIORITY, PRIORITY_LABELS, PRIORITY_LABELS_LOWERCASE, type TicketPriorityValue } from "@/constants/ticketPriority";
import { addTicketHistory, createAssigneeChangeHistory, createPriorityChangeHistory, createStatusChangeHistory } from "@/services/ticketHistoryService";

interface EditTicketFormData {
  title: string;
  description: string;
  ticketType: string;
  priority: "Low" | "Medium" | "High" | "Critical";
  organization: string;
  assetsDevice: string;
  incidentType: string[];
  indicators: string[];
  reporter: string;
  assignee: string;
  location: string;
  status: string;
}

type EnrichedResource = (NonNullable<EnrichedTicketResponse["resources"]>[number]) & {
  file_url?: string;
  thumb_url?: string;
};

const EditTicket: React.FC = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { hash } = useParams<{ hash: string }>();
  const ticket = useAppSelector((state) => state.tickets.selectedTicket);
  const { loading: ticketLoading } = useAppSelector((state) => state.tickets);

  const [formData, setFormData] = useState<EditTicketFormData>({
    title: "",
    description: "",
    ticketType: "Help Desk",
    priority: "Medium",
    organization: "",
    assetsDevice: "",
    incidentType: [],
    indicators: [],
    reporter: "",
    assignee: "",
    location: "",
    status: TICKET_STATUS.ASSIGNED,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadedResources, setUploadedResources] = useState<TicketResource[]>([]);
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([]);
  const [resources, setResources] = useState<EnrichedResource[]>([]);

  // Load ticket data
  useEffect(() => {
    const loadTicket = async () => {
      if (!hash) return;
      
      try {
        // Find ticket by hash
        const allTicketsResponse = await getAllTickets();
        const allTickets = Array.isArray(allTicketsResponse) ? allTicketsResponse : allTicketsResponse.data;
        const foundTicket = allTickets.find((t: any) => {
          const ticketHash = t.hash || (t as any).hash;
          return ticketHash === hash || ticketHash === `tkt_${hash}` || ticketHash?.endsWith(hash);
        });
        
        if (foundTicket) {
          const ticketId = foundTicket.id || foundTicket.ticketId;
          if (ticketId) {
            dispatch(fetchTicketById(Number(ticketId)));
          }
        }
      } catch (error) {
        console.error("Failed to load ticket by hash:", error);
      }
    };
    
    loadTicket();
  }, [hash, dispatch]);

  // Populate form when ticket data is loaded
  useEffect(() => {
    if (ticket) {
      setFormData({
        title: ticket.title || ticket.heading || ticket.body || "", // Map title/heading/body to title for editing
        description: ticket.body || "",
        ticketType: ticket.ticketType || "Help Desk",
        priority: ticket.priority === TICKET_PRIORITY.LOW ? PRIORITY_LABELS[TICKET_PRIORITY.LOW] : 
                 ticket.priority === TICKET_PRIORITY.MEDIUM ? PRIORITY_LABELS[TICKET_PRIORITY.MEDIUM] : 
                 ticket.priority === TICKET_PRIORITY.HIGH ? PRIORITY_LABELS[TICKET_PRIORITY.HIGH] : PRIORITY_LABELS[TICKET_PRIORITY.CRITICAL],
        organization: ticket.organization || "",
        assetsDevice: ticket.assetsDevice || "",
        incidentType: ticket.incidentType || [],
        indicators: ticket.indicators || [],
        reporter: ticket.reporter ? `${ticket.reporter.first_name} ${ticket.reporter.last_name}` : "",
        assignee: ticket.assignee || "",
        location: ticket.location || "",
        status: ticket.status || TICKET_STATUS.ASSIGNED,
      });

      // Load existing file resources
      if (ticket.id) {
        loadTicketResources(ticket.id);
        // Load enriched resources with URLs (attachments + resources)
        (async () => {
          try {
            const enriched = await getEnrichedTicketById(Number(ticket.id));
            const a = Array.isArray(enriched.attachments) ? enriched.attachments : [];
            const r = Array.isArray(enriched.resources) ? enriched.resources : [];
            setAttachmentUrls(a);
            setResources(r);
          } catch (e) {
            console.warn('Failed to load enriched ticket for edit:', e);
          }
        })();
      }
    }
  }, [ticket]);



  const loadTicketResources = async (ticketId: number) => {
    try {
      const resources = await listTicketResources(ticketId);
      setUploadedResources(resources);
    } catch (error) {
      console.error("Failed to load ticket resources:", error);
    }
  };

  const handleInputChange = (field: keyof EditTicketFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) {
      setSelectedFiles([]);
      return;
    }
    const fileArray = Array.from(files);
    setSelectedFiles(fileArray);
  };

  const isImageUrl = (url: string): boolean => {
    const lower = url.toLowerCase();
    return [".png", ".jpg", ".jpeg", ".gif", ".webp", ".bmp", ".svg"].some(ext => lower.includes(ext));
  };

  const handleSubmit = async () => {
    if (!ticket?.id) {
      console.error("No ticket ID available for update");
      return;
    }

    setIsSubmitting(true);
    try {
      const priorityNumber = 
        formData.priority === PRIORITY_LABELS[TICKET_PRIORITY.LOW] ? TICKET_PRIORITY.LOW :
        formData.priority === PRIORITY_LABELS[TICKET_PRIORITY.MEDIUM] ? TICKET_PRIORITY.MEDIUM :
        formData.priority === PRIORITY_LABELS[TICKET_PRIORITY.HIGH] ? TICKET_PRIORITY.HIGH : TICKET_PRIORITY.CRITICAL;

      // Store old values for history comparison
      const oldStatus = ticket.status || "No Status";
      const oldPriorityValue = normalizePriority(ticket.priority);
      const oldPriorityLabel = oldPriorityValue
        ? PRIORITY_LABELS[oldPriorityValue as TicketPriorityValue]
        : "No Priority";
      const oldAssignee = ticket.assignee || "Unassigned";

      // Prepare update data
      const updateData = {
        ticketType: formData.ticketType === "Cyber" ? "Cyber" : "Help Desk",
        priority: priorityNumber as TicketPriorityValue,
        organization: formData.organization,
        assetsDevice: formData.assetsDevice,
        incidentType: formData.incidentType,
        indicators: formData.indicators,
        reporter: formData.reporter,
        assignee: formData.assignee,
        location: formData.location,
        status: formData.status,
        description: formData.description,
      };

      console.log("Updating ticket with data:", updateData);

      // Update the ticket
      await dispatch(updateExistingTicket({ 
        id: ticket.id, 
        data: updateData 
      })).unwrap();

      // Log history entries for changed fields (non-blocking)
      const ticketId = ticket.id;
      const historyPromises: Promise<void>[] = [];

      // Check if status changed
      if (formData.status !== oldStatus) {
        const newStatus = formData.status || "Open";
        historyPromises.push(
          addTicketHistory(
            createStatusChangeHistory({
              oldStatus,
              newStatus,
              ticketId,
            })
          ).catch((error) => {
            console.warn('Ticket updated but status history logging failed:', error);
          })
        );
      }

      // Check if priority changed
      if (formData.priority !== oldPriorityLabel) {
        const priorityLabel = PRIORITY_LABELS_LOWERCASE[priorityNumber as TicketPriorityValue];
        const currentStatus = formData.status || ticket.status || "Open";
        historyPromises.push(
          addTicketHistory(
            createPriorityChangeHistory({
              oldPriorityLabel,
              newPriorityLabel: formData.priority,
              status: currentStatus,
              priorityValue: priorityLabel,
              ticketId,
            })
          ).catch((error) => {
            console.warn('Ticket updated but priority history logging failed:', error);
          })
        );
      }

      // Check if assignee changed
      if (formData.assignee !== oldAssignee) {
        const newAssignee = formData.assignee || "Unassigned";
        const currentStatus = formData.status || ticket.status || "Open";
        historyPromises.push(
          addTicketHistory(
            createAssigneeChangeHistory({
              oldAssigneeName: oldAssignee,
              newAssigneeName: newAssignee,
              status: currentStatus,
              assigneeId: formData.assignee || undefined,
              ticketId,
            })
          ).catch((error) => {
            console.warn('Ticket updated but assignee history logging failed:', error);
          })
        );
      }

      // Wait for all history entries (but don't block on errors)
      await Promise.allSettled(historyPromises);

      // Handle file uploads if any
      if (selectedFiles.length > 0) {
        console.log("Uploading new files:", selectedFiles);
        await Promise.all(
          selectedFiles.map((file) => 
            uploadTicketResource(String(ticket.id!), file).catch((error) => {
              console.error("Failed to upload file:", file.name, error);
              return null;
            })
          )
        );

        // Refresh resources list
        await loadTicketResources(ticket.id!);
      }

      console.log("Ticket updated successfully");
      navigate("/dashboard/tickets");
    } catch (error) {
      console.error("Failed to update ticket:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper function to normalize priority values
  const normalizePriority = (value: unknown): TicketPriorityValue | undefined => {
    if (value === null || value === undefined) return undefined;
    const str = String(value).toLowerCase().trim();
    if (str === String(TICKET_PRIORITY.LOW) || str === 'low') return TICKET_PRIORITY.LOW;
    if (str === String(TICKET_PRIORITY.MEDIUM) || str === 'medium' || str === 'med') return TICKET_PRIORITY.MEDIUM;
    if (str === String(TICKET_PRIORITY.HIGH) || str === 'high') return TICKET_PRIORITY.HIGH;
    if (str === String(TICKET_PRIORITY.CRITICAL) || str === 'critical' || str === 'crit') return TICKET_PRIORITY.CRITICAL;
    const n = Number(str);
    if ([1, 2, 3, 4].includes(n)) return n as TicketPriorityValue;
    return undefined;
  };

  const handleCancel = () => {
    // Reset form data to original ticket values
    if (ticket) {
      setFormData({
        title: ticket.title || ticket.heading || ticket.body || "",
        description: ticket.body || "",
        ticketType: ticket.ticketType || "Help Desk",
        priority: ticket.priority === TICKET_PRIORITY.LOW ? PRIORITY_LABELS[TICKET_PRIORITY.LOW] : 
                 ticket.priority === TICKET_PRIORITY.MEDIUM ? PRIORITY_LABELS[TICKET_PRIORITY.MEDIUM] : 
                 ticket.priority === TICKET_PRIORITY.HIGH ? PRIORITY_LABELS[TICKET_PRIORITY.HIGH] : PRIORITY_LABELS[TICKET_PRIORITY.CRITICAL],
        organization: ticket.organization || "",
        assetsDevice: ticket.assetsDevice || "",
        incidentType: ticket.incidentType || [],
        indicators: ticket.indicators || [],
        reporter: ticket.reporter ? `${ticket.reporter.first_name} ${ticket.reporter.last_name}` : "",
        assignee: ticket.assignee || "",
        location: ticket.location || "",
        status: ticket.status || TICKET_STATUS.ASSIGNED,
      });
      // Reset files to original uploaded resources only
      setSelectedFiles([]);
      // Reload original resources
      if (ticket.id) {
        loadTicketResources(ticket.id);
      }
    }
  };

  const combinedResources = useMemo(() => {
    const normalizedFromResources = resources
      .map((resource) => {
        const display = resource.thumb_url || resource.file_url || resource.hash || "";
        const download = resource.file_url || resource.thumb_url || resource.hash || "";
        return { display, download };
      })
      .filter((item) => item.display && item.download);

    const normalizedAttachments = attachmentUrls
      .map((url) => ({ display: url, download: url }))
      .filter((item) => item.display && item.download);

    return [...normalizedFromResources, ...normalizedAttachments];
  }, [resources, attachmentUrls]);

  const priorityOptions = [
    { value: "Low", label: "Low" },
    { value: "Medium", label: "Medium" },
    { value: "High", label: "High" },
    { value: "Critical", label: "Critical" },
  ];

  const statusOptions = [
    TICKET_STATUS.ASSIGNED,
    TICKET_STATUS.IN_PROGRESS,
    TICKET_STATUS.CLOSED,
  ].map((status) => ({ value: status, label: status }));

  const ticketTypeOptions = [
  { value: "Help Desk", label: "Help Desk" },
  { value: "Cyber", label: "Cyber" },
  ];

  if (ticketLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg">Loading ticket...</div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-lg text-red-600">Ticket not found</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textColor-base">
        Edit Ticket #{ticket.ticketId}
      </h1>
      
      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Title/Heading */}
          <div className="md:col-span-2">
            <InputField
              label="Ticket Title"
              name="title"
              value={formData.title}
              onChange={(value) => handleInputChange("title", value)}
              placeholder="Ticket title"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Ticket Type and Priority */}
          <SelectField
            label="Ticket Type"
            name="ticketType"
            value={formData.ticketType}
            onChange={(value) => handleInputChange("ticketType", value)}
            options={ticketTypeOptions}
            required
            disabled={isSubmitting}
          />

          <SelectField
            label="Status"
            name="status"
            value={formData.status}
            onChange={(value) => handleInputChange("status", value)}
            options={statusOptions}
            disabled={isSubmitting}
          />

          {/* Priority */}
          <div className="md:col-span-2">
            <RadioGroup
              name="priority"
              label="Priority"
              value={formData.priority}
              onChange={(value) => handleInputChange("priority", value as EditTicketFormData["priority"])}
              options={priorityOptions}
              orientation="horizontal"
              required
              disabled={isSubmitting}
            />
          </div>

          {/* Organization and Assets */}
          <InputField
            label="Organization"
            name="organization"
            value={formData.organization}
            onChange={(value) => handleInputChange("organization", value)}
            placeholder="Organization"
            required
            disabled={isSubmitting}
          />

          <InputField
            label="Assets/Device"
            name="assetsDevice"
            value={formData.assetsDevice}
            onChange={(value) => handleInputChange("assetsDevice", value)}
            placeholder="Assets/Device"
            required
            disabled={isSubmitting}
          />

          {/* Reporter and Assignee */}
          <InputField
            label="Reporter"
            name="reporter"
            value={formData.reporter}
            onChange={(value) => handleInputChange("reporter", value)}
            placeholder="Reporter"
            required
            disabled={isSubmitting}
          />

          <InputField
            label="Assignee"
            name="assignee"
            value={formData.assignee}
            onChange={(value) => handleInputChange("assignee", value)}
            placeholder="Assignee"
            required
            disabled={isSubmitting}
          />

          {/* Location */}
          <div className="md:col-span-2">
            <InputField
              label="Location"
              name="location"
              value={formData.location}
              onChange={(value) => handleInputChange("location", value)}
              placeholder="Location"
              disabled={isSubmitting}
            />
          </div>

          {/* Action Type and Indicators */}
          <div className="md:col-span-2">
            <TagInputField
              label="Action Type"
              name="incidentType"
              tags={formData.incidentType}
              onTagsChange={(tags) => handleInputChange("incidentType", tags)}
              placeholder="Add action types..."
              disabled={isSubmitting}
            />
          </div>

          <div className="md:col-span-2">
            <TagInputField
              label="Indicators"
              name="indicators"
              tags={formData.indicators}
              onTagsChange={(tags) => handleInputChange("indicators", tags)}
              placeholder="Add indicators..."
              disabled={isSubmitting}
            />
          </div>

          {/* File Upload Section */}
          <div className="md:col-span-2">
            <FileUploadField
              label="Upload Additional Files"
              name="edit-file-upload"
              onFileChange={handleFileUpload}
              accept=".jpg,.jpeg,.png,.pdf,.doc,.docx,.zip"
              multiple
              disabled={isSubmitting}
            />
          </div>

          {/* Existing Files */}
          {uploadedResources.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-sm uppercase font-semibold mb-3">Existing Files</p>
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
                        disabled={isSubmitting}
                        onClick={async () => {
                          if (!ticket.id) return;
                          try {
                            await deleteTicketResource(ticket.id, res.id);
                            setUploadedResources((prev) => prev.filter((r) => r.id !== res.id));
                          } catch (error) {
                            console.error("Failed to delete file:", error);
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

          {/* S3 Attachments Preview */}
          <div className="md:col-span-2">
            <p className="text-sm uppercase font-semibold mb-3">S3 Attachments</p>
            {combinedResources.length === 0 ? (
              <div className="text-sm text-textColor-muted">No attachments.</div>
            ) : (
              <div className="flex flex-wrap gap-4">
                {combinedResources.map((res, index) => (
                  <div key={`${res.download}-${index}`} className="relative h-[160px] w-[160px] flex justify-center bg-surface-secondary rounded-lg overflow-hidden">
                    {isImageUrl(res.display) ? (
                      <a href={res.download} target="_blank" rel="noreferrer" className="block w-full h-full">
                        <img src={res.display} alt="attachment" className="object-cover w-full h-full" />
                      </a>
                    ) : (
                      <a href={res.download} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center h-full w-full gap-2 text-primary-600 hover:underline">
                        <span className="material-symbols-outlined">attach_file</span>
                        <span className="text-xs px-2 text-center break-all">Download</span>
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Selected Files */}
          {selectedFiles.length > 0 && (
            <div className="md:col-span-2">
              <p className="text-sm uppercase font-semibold mb-3">New Files to Upload</p>
              <div className="p-4 border border-dashed border-gray-300 rounded-lg max-h-48 overflow-auto">
                <ul className="space-y-2">
                  {selectedFiles.map((file, idx) => (
                    <li key={`${file.name}-${idx}`} className="text-sm text-textColor-base">
                      {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* Description */}
          <div className="md:col-span-2">
            <TextEditorField
              label="Description"
              name="description"
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              required
              disabled={isSubmitting}
              placeholder="Enter description here..."
            />
          </div>

          {/* Form Actions */}
          <div className="md:col-span-2">
            <FormActions
              onSubmit={handleSubmit}
              onCancel={handleCancel}
              submitText="Update Ticket"
              cancelText="Reset form"
              isSubmitting={isSubmitting}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditTicket;