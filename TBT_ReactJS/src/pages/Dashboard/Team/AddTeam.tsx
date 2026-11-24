import Button from "@/components/Atomic/Button";
import InputField from "@/components/Molecules/InputField";
import PhoneInputField from "@/components/Molecules/PhoneInputField";
import RadioGroup from "@/components/Molecules/RadioGroup";
import SelectField from "@/components/Molecules/SelectField";
import TextEditorField from "@/components/Molecules/TextEditorField";
import AgentSelection from "@/components/Molecules/AgentSelection";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useToast from '@/hooks/useToast'
import * as yup from "yup";
import { getAllAgents } from "@/services/agentService";
import { Agent } from "@/redux/agent/agentTypes";
import { getAllApplications } from "@/services/applicationService";
import { useAppDispatch } from "@/redux/hooks";
import { createNewTeamWithAgents } from "@/redux/team/teamSlice";
import { CreateTeamWithAgentsDto, TeamAgent } from "@/redux/team/teamTypes";
import { ENTITY_STATUS, ENTITY_STATUS_OPTIONS } from "@/constants/entityStatus";
import {
  phoneNumberValidator,
  emailValidator,
  requiredStringValidator,
  idValidator,
  arrayValidator,
  validateForm,
} from "@/lib/validationSchemas";

// Yup validation schema using reusable validators
const teamValidationSchema = yup.object({
  name: requiredStringValidator("Team name", 2, 200),
  email: emailValidator,
  phone_number: phoneNumberValidator,
  application_id: idValidator("Assigned application"),
  agents: arrayValidator("Team members", 1),
});

export const AddTeam = () => {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { success: toastSuccess, error: toastError } = useToast()

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateTeamWithAgentsDto>({
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
    hash: "",
    leader_id: undefined,
    agents: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableAgents, setAvailableAgents] = useState<Agent[]>([]);
  const [selectedAgents, setSelectedAgents] = useState<TeamAgent[]>([]);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: keyof CreateTeamWithAgentsDto, value: any) => {
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

  const handleAgentsChange = (agents: TeamAgent[]) => {
    // Ensure defaults and correct shape
    const normalized = agents.map(a => ({
      agent_id: a.agent_id,
      role_id: a.role_id ?? 2,
      data: a.data ?? JSON.stringify({ level: "junior", permissions: ["read"] }),
      remarks: a.remarks ?? "",
    }));
    setSelectedAgents(normalized);
    setFormData((prev) => {
      const leaderStillPresent = prev.leader_id ? normalized.some(a => a.agent_id === prev.leader_id) : false;
      return {
        ...prev,
        agents: normalized,
        leader_id: leaderStillPresent ? prev.leader_id : undefined,
      };
    });
    // Clear error for agents when user changes selection
    if (errors.agents) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors.agents;
        return newErrors;
      });
    }
  };

  const generateTeamHash = (teamName: string): string => {
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(2, 8);
    return `${teamName.toLowerCase().replace(/\s+/g, '-')}-${timestamp}-${randomSuffix}`;
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    
    // Validate form with reusable helper
    const { isValid, errors: validationErrors } = await validateForm(
      teamValidationSchema,
      formData
    );
    
    if (!isValid) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    setLoading(true);

    try {
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

      // Generate a unique hash for the team and build final payload
      const teamData = {
        ...formData,
        hash: generateTeamHash(formData.name),
        agents: normalizedAgents,
      } as typeof formData;

      const result = await dispatch(createNewTeamWithAgents(teamData));
      if (createNewTeamWithAgents.fulfilled.match(result)) {
        console.log("Team created successfully:", result.payload);
        try { toastSuccess('Team created successfully') } catch {}
        navigate("/dashboard/team");
      } else {
        console.error("Failed to create team:", result.error);
        try { toastError('Failed to create team') } catch {}
      }
      // Optionally, reset form here
    } catch (error) {
      console.error("Submission error:", error);
      try { toastError('Failed to create team') } catch {}
    } finally {
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const [applicationOptions, setApplicationOptions] = useState<
    { value: number; label: string }[]
  >([]);

  useEffect(() => {
    const fetchAgents = async () => {
      try {
        const agents: Agent[] = await getAllAgents();
        setAvailableAgents(agents);
      } catch (error) {
        console.error("Failed to fetch agents:", error);
      }
    };
    fetchAgents();
  }, []);

  //fetchApplications
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const applications = await getAllApplications();
        const options = applications.map((app) => ({
          value: app.id!,
          label: app.name || "Unknown",
        }));
        setApplicationOptions(options);
      } catch (error) {
        console.error("Failed to fetch applications:", error);
      }
    };
    fetchApplications();
  }, []);

  const statusOptions = ENTITY_STATUS_OPTIONS;

  const leaderOptions = availableAgents
    .map(agent => {
      const fullName = [agent.first_name, agent.last_name].filter(Boolean).join(" ");
      const label = fullName || agent.email || `Agent #${agent.id}`;
      return agent.id ? { value: String(agent.id), label } : undefined;
    })
    .filter((o): o is { value: string; label: string } => Boolean(o));

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-textColor-base">
        Create New Team
      </h1>

      <div className="bg-surface-primary rounded-lg shadow-sm border border-primary-100 p-6">
        <form onSubmit={handleSubmit} className="space-y-10" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-8">
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
                hint="Select agents to assign to this team. You can configure roles, permissions, and other details for each agent."
                error={errors.agents}
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
              value={
                formData.application_id ? String(formData.application_id) : ""
              }
              onChange={(value) =>
                handleInputChange("application_id", Number(value))
              }
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
                onChange={(value) =>
                  handleInputChange("status", value as CreateTeamWithAgentsDto["status"])
                }
                options={statusOptions}
                required
                disabled={isSubmitting}
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
