import Button from '@/components/Atomic/Button'
import InputField from '@/components/Molecules/InputField'
import PhoneInputField from '@/components/Molecules/PhoneInputField'
import RadioGroup from '@/components/Molecules/RadioGroup'
import SelectField from '@/components/Molecules/SelectField'
import TextEditorField from '@/components/Molecules/TextEditorField'
import AgentSelection from '@/components/Molecules/AgentSelection'
import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import useToast from '@/hooks/useToast'
import * as yup from 'yup'
import { useAppDispatch, useAppSelector } from '@/redux/hooks'
import { fetchTeamById, updateExistingTeam } from '@/redux/team/teamSlice'
import { Team, TeamAgent } from '@/redux/team/teamTypes'
import { getAllAgents } from '@/services/agentService'
import { Agent } from '@/redux/agent/agentTypes'
import { getAllApplications } from '@/services/applicationService'
import { getAllTeams } from '@/services/teamService'
import { ENTITY_STATUS, ENTITY_STATUS_OPTIONS } from '@/constants/entityStatus'
import {
  arrayValidator,
  emailValidator,
  idValidator,
  oneOfValidator,
  phoneNumberValidator,
  requiredStringValidator,
  validateForm,
} from '@/lib/validationSchemas'

const teamValidationSchema = yup.object({
  name: requiredStringValidator('Team name', 2, 200),
  email: emailValidator,
  phone_number: phoneNumberValidator,
  application_id: idValidator('Application'),
  agents: arrayValidator('Team members', 1),
  status: oneOfValidator('Status', Object.values(ENTITY_STATUS) as string[]),
})

export const EditTeam = () => {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const { success: toastSuccess, error: toastError } = useToast()
  const { hash } = useParams<{ hash: string }>()
  const selectedTeam = useAppSelector((state) => state.teams.selectedTeam)
  const [loading, setLoading] = useState(false)

  const [formData, setFormData] = useState<Team>({
    id: 0,
    name: "",
    email: "",
    phone_number: "",
    address_line1: "",
    address_line2: "",
    city: "",
    status: ENTITY_STATUS.ACTIVE,
    description: "",
    remarks: "",
    application_id: undefined,
    agent_id: undefined,
    leader_id: undefined,
    hash: "",
    agents: [],
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([])
  const [selectedAgents, setSelectedAgents] = useState<TeamAgent[]>([])
  const [applicationOptions, setApplicationOptions] = useState<{ value: number; label: string }[]>([])
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const loadTeam = async () => {
      if (!hash) return;
      
      try {
        // Check if hash is numeric (legacy ID)
        const numericId = parseInt(hash);
        if (!isNaN(numericId) && String(numericId) === hash) {
          dispatch(fetchTeamById(numericId));
          return;
        }
        
        // Find team by hash
        const allTeams = await getAllTeams();
        const foundTeam = allTeams.find((t: any) => {
          const teamHash = t.hash || (t as any).hash;
          return teamHash === hash || teamHash?.endsWith(hash);
        });
        
        if (foundTeam?.id) {
          dispatch(fetchTeamById(foundTeam.id));
        }
      } catch (error) {
        console.error("Failed to load team by hash:", error);
      }
    };
    
    loadTeam();
  }, [hash, dispatch])

  useEffect(() => {
    if (selectedTeam) {
      console.log("Selected team data:", selectedTeam)
      console.log("Team agents:", selectedTeam.agents)
      console.log("Team agents_details:", selectedTeam.agents_details)
      
      // Try to get agents from either agents or agents_details
      let teamAgents: TeamAgent[] = []
      
      if (selectedTeam.agents && selectedTeam.agents.length > 0) {
        // Normalize agents coming from API to ensure numeric IDs and defaults.
        // Some endpoints return an array of Agent objects (with `id` and nested `TeamAgent`),
        // while others return TeamAgent objects (with `agent_id`). Handle both shapes.
        teamAgents = selectedTeam.agents
          .map((a: any) => {
            const rawId = a.agent_id ?? a.id ?? a.TeamAgent?.agent_id;
            const agentId = rawId != null ? Number(rawId) : undefined;
            const roleId = a.role_id ?? a.TeamAgent?.role_id ?? 2;
            const data = a.data ?? a.TeamAgent?.data ?? JSON.stringify({ level: "junior", permissions: ["read"] });
            const remarks = a.remarks ?? a.TeamAgent?.remarks ?? "";
            return {
              agent_id: agentId,
              role_id: roleId,
              data,
              remarks,
            } as TeamAgent;
          })
          .filter((ta: TeamAgent) => ta.agent_id !== undefined && !Number.isNaN(ta.agent_id));
      } else if (selectedTeam.agents_details && selectedTeam.agents_details.length > 0) {
        // Convert agents_details to TeamAgent format
        teamAgents = selectedTeam.agents_details.map(agent => ({
          agent_id: agent.id,
          role_id: agent.TeamAgent?.role_id || 2,
          data: agent.TeamAgent?.data || JSON.stringify({ level: "junior", permissions: ["read"] }),
          remarks: agent.TeamAgent?.remarks || "",
        }))
      }
      
      console.log("Processed team agents:", teamAgents)
      console.log("Team leader_id:", selectedTeam.leader_id)
      
      setFormData({
        id: selectedTeam.id,
        name: selectedTeam.name || "",
        email: selectedTeam.email || "",
        phone_number: selectedTeam.phone_number || "",
        address_line1: selectedTeam.address_line1 || "",
        address_line2: selectedTeam.address_line2 || "",
        city: selectedTeam.city || "",
        status: selectedTeam.status || ENTITY_STATUS.ACTIVE,
        description: selectedTeam.description || "",
        remarks: selectedTeam.remarks || "",
        // Some responses include `Application` object but not `application_id` field
        application_id: selectedTeam.application_id ?? selectedTeam.Application?.id,
        agent_id: selectedTeam.agent_id,
        leader_id: selectedTeam.leader_id,
        hash: selectedTeam.hash || "",
        agents: teamAgents,
      })
      setSelectedAgents(teamAgents)
    }
  }, [selectedTeam])

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agents: Agent[] = await getAllAgents()
        setAvailableAgents(agents)
      } catch (error) {
        console.error("Failed to fetch agents:", error)
      }
    }
    fetchAgents()
  }, [])

  // Ensure selectedAgents are properly set when both team data and available agents are loaded
  useEffect(() => {
    if (selectedTeam && availableAgents.length > 0) {
      console.log("Re-processing team agents with available agents loaded")
      
      // Try to get agents from either agents or agents_details
      let teamAgents: TeamAgent[] = []
      
      if (selectedTeam.agents && selectedTeam.agents.length > 0) {
        // Normalize agents coming from API to ensure numeric IDs and defaults.
        teamAgents = selectedTeam.agents
          .map((a: any) => {
            const rawId = a.agent_id ?? a.id ?? a.TeamAgent?.agent_id;
            const agentId = rawId != null ? Number(rawId) : undefined;
            const roleId = a.role_id ?? a.TeamAgent?.role_id ?? 2;
            const data = a.data ?? a.TeamAgent?.data ?? JSON.stringify({ level: "junior", permissions: ["read"] });
            const remarks = a.remarks ?? a.TeamAgent?.remarks ?? "";
            return {
              agent_id: agentId,
              role_id: roleId,
              data,
              remarks,
            } as TeamAgent;
          })
          .filter((ta: TeamAgent) => ta.agent_id !== undefined && !Number.isNaN(ta.agent_id));
      } else if (selectedTeam.agents_details && selectedTeam.agents_details.length > 0) {
        // Convert agents_details to TeamAgent format
        teamAgents = selectedTeam.agents_details.map(agent => ({
          agent_id: agent.id,
          role_id: agent.TeamAgent?.role_id || 2,
          data: agent.TeamAgent?.data || JSON.stringify({ level: "junior", permissions: ["read"] }),
          remarks: agent.TeamAgent?.remarks || "",
        }))
      }
      
      console.log("Re-processed team agents:", teamAgents)
      setSelectedAgents(teamAgents)
      setFormData(prev => ({ ...prev, agents: teamAgents }))
    }
  }, [selectedTeam, availableAgents])

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const applications = await getAllApplications()
        const options = applications.map((app) => ({
          value: app.id!,
          label: app.name || "Unknown",
        }))
        setApplicationOptions(options)
      } catch (error) {
        console.error("Failed to fetch applications:", error)
      }
    }
    fetchApplications()
  }, [])

  const statusOptions = ENTITY_STATUS_OPTIONS

  const handleInputChange = (field: keyof Team, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[field]
        return next
      })
    }
  }

  const handleAgentsChange = (agents: TeamAgent[]) => {
    // Ensure defaults and correct shape
    const normalized = agents.map(a => ({
      agent_id: a.agent_id,
      role_id: a.role_id ?? 2,
      data: a.data ?? JSON.stringify({ level: "junior", permissions: ["read"] }),
      remarks: a.remarks ?? "",
    }));
    if (errors.agents) {
      setErrors(prev => {
        const next = { ...prev }
        delete next.agents
        return next
      })
    }
    setSelectedAgents(normalized);
    setFormData((prev) => {
      const leaderStillPresent = prev.leader_id ? normalized.some(a => a.agent_id === prev.leader_id) : false;
      return {
        ...prev,
        agents: normalized,
        leader_id: leaderStillPresent ? prev.leader_id : undefined,
      };
    });
  }

  const leaderOptions = availableAgents
    .map((agent) => {
      // Prefer full name when available; fall back to email or an id-based label
      const fullName = [agent.first_name, agent.last_name].filter(Boolean).join(" ");
      const label = fullName || agent.email || `Agent #${agent.id}`;
      return agent.id ? { value: String(agent.id), label } : undefined;
    })
    .filter((o): o is { value: string; label: string } => Boolean(o));

  // Debug logging
  console.log("Available agents:", availableAgents)
  console.log("Leader options:", leaderOptions)
  console.log("Current leader_id in formData:", formData.leader_id)
  console.log("Selected agents:", selectedAgents)

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const { isValid, errors: validationErrors } = await validateForm(
      teamValidationSchema,
      formData
    )

    if (!isValid) {
      setErrors(validationErrors)
      return
    }

    setIsSubmitting(true)
    setLoading(true)
    try {
      if (!formData.id) {
        console.error("Team ID is missing")
        return
      }

      // Normalize agents: leader gets role_id=1, others role_id=2
      const leaderId = formData.leader_id;
      const currentAgents = (formData.agents || []).map(a => ({
        agent_id: a.agent_id,
        role_id: leaderId && a.agent_id === leaderId ? 1 : 2,
        data: a.data,
        remarks: a.remarks,
      }));

      // Ensure leader is included if chosen but not in list
      const hasLeader = leaderId ? currentAgents.some(a => a.agent_id === leaderId) : false;
      const normalizedAgents = leaderId && !hasLeader
        ? [{ agent_id: leaderId, role_id: 1, data: JSON.stringify({ level: "senior" }), remarks: "Team leader" }, ...currentAgents]
        : currentAgents;

      // Build final payload with normalized agents
      const teamData = {
        ...formData,
        agents: normalizedAgents,
      };

      await dispatch(
        updateExistingTeam({
          id: formData.id,
          data: teamData,
        })
      ).unwrap()
      try { toastSuccess('Team updated successfully') } catch {}
      navigate("/dashboard/team")
    } catch (error) {
      console.error("Submission error:", error)
      try { toastError('Failed to update team') } catch {}
    } finally {
      setIsSubmitting(false)
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textColor-base">Edit Team</h1>
      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-6" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <InputField
              label="Team Name"
              name="name"
              value={formData.name}
              onChange={(value) => handleInputChange("name", value)}
              placeholder="Enter Team Name"
              required
              disabled={isSubmitting}
              error={errors.name}
            />
            <InputField
              label="Team Email"
              name="email"
              value={formData.email}
              onChange={(value) => handleInputChange("email", value)}
              placeholder="Enter Team Email"
              required
              disabled={isSubmitting}
              error={errors.email}
            />
            <PhoneInputField
              label="Phone Number"
              name="phone_number"
              value={formData.phone_number}
              onChange={(value) => handleInputChange("phone_number", value)}
              placeholder="Enter Phone Number"
              required
              disabled={isSubmitting}
              error={errors.phone_number}
            />
            <div className="col-span-2">
              <AgentSelection
                label="Select Team Members"
                name="agents"
                availableAgents={availableAgents}
                selectedAgents={selectedAgents}
                onAgentsChange={handleAgentsChange}
                required
              disabled={isSubmitting}
              error={errors.agents}
                hint="Select agents to assign to this team. You can configure roles, permissions, and other details for each agent."
              />
            </div>
            <SelectField
              label="Team Leader"
              name="leader_id"
              value={formData.leader_id ? String(formData.leader_id) : ""}
              onChange={(value) => handleInputChange("leader_id", Number(value))}
              options={leaderOptions}
              placeholder={selectedAgents.length ? "Select a leader" : "Add members first"}
              disabled={isSubmitting || selectedAgents.length === 0}
            />
            <SelectField
              label="Assigned Application"
              name="application_id"
              value={formData.application_id ? String(formData.application_id) : ""}
              onChange={(value) => handleInputChange("application_id", Number(value))}
              options={applicationOptions.map((app) => ({
                value: String(app.value),
                label: app.label,
              }))}
              required
              disabled={isSubmitting}
              error={errors.application_id}
            />
            <InputField
              label="Address Line 1"
              name="address_line1"
              value={formData.address_line1}
              onChange={(value) => handleInputChange("address_line1", value)}
              placeholder="Enter Address Line 1"
              disabled={isSubmitting}
            />
            <InputField
              label="Address Line 2"
              name="address_line2"
              value={formData.address_line2}
              onChange={(value) => handleInputChange("address_line2", value)}
              placeholder="Enter Address Line 2"
              disabled={isSubmitting}
            />
            <InputField
              label="City"
              name="city"
              value={formData.city}
              onChange={(value) => handleInputChange("city", value)}
              placeholder="Enter City"
              disabled={isSubmitting}
            />
            <div className="col-span-2">
              <RadioGroup
                label="Select Status"
                name="status"
                value={formData.status}
                onChange={(value) => handleInputChange("status", value as Team["status"])}
                options={statusOptions}
                required
              disabled={isSubmitting}
              error={errors.status}
              />
            </div>
            <TextEditorField
              label="Team Description"
              name="description"
              value={formData.description}
              onChange={(value) => handleInputChange("description", value)}
              disabled={isSubmitting}
              placeholder="Enter team description here..."
            />
            <TextEditorField
              label="Remarks"
              name="remarks"
              value={formData.remarks}
              onChange={(value) => handleInputChange("remarks", value)}
              disabled={isSubmitting}
              placeholder="Enter remarks here..."
            />
          </div>
          <div className="flex justify-end space-x-4">
            <Button style="Tertiary" text="Cancel" onClick={() => navigate(-1)} />
            <Button type="submit" text="Submit" loading={loading} />
          </div>
        </form>
      </div>
    </div>
  )
}