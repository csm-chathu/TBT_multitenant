"use client";

import type React from "react";
import { useState } from "react";
import { Agent } from "@/redux/agent/agentTypes";
import { TeamAgent } from "@/redux/team/teamTypes";
import FormField from "./FormField";
import InputField from "./InputField";
import SelectField from "./SelectField";

interface AgentSelectionProps {
  label: string;
  name: string;
  availableAgents: Agent[];
  selectedAgents: TeamAgent[];
  onAgentsChange: (agents: TeamAgent[]) => void;
  required?: boolean;
  error?: string;
  hint?: string;
  disabled?: boolean;
  className?: string;
}

const AgentSelection: React.FC<AgentSelectionProps> = ({
  label,
  name,
  availableAgents,
  selectedAgents,
  onAgentsChange,
  required = false,
  error,
  hint,
  disabled = false,
  className,
}) => {
  const [expandedAgent, setExpandedAgent] = useState<number | null>(null);

  // Debug logging
  console.log(`AgentSelection [${name}] - availableAgents:`, availableAgents);
  console.log(`AgentSelection [${name}] - selectedAgents:`, selectedAgents);
  console.log(`AgentSelection [${name}] - selectedAgents length:`, selectedAgents?.length || 0);

  const roleOptions = [
    { value: 1, label: "Team Lead" },
    { value: 2, label: "Agent" },
    { value: 3, label: "Developer" },
    { value: 4, label: "Manager" },
    { value: 5, label: "Customer" },
  ];

  const permissionOptions = [
    { value: "read", label: "Read" },
    { value: "write", label: "Write" },
    { value: "admin", label: "Admin" },
    { value: "deploy", label: "Deploy" },
    { value: "manage", label: "Manage" },
  ];

  const getAgentDisplayName = (agent: Agent): string => {
    return (
      `${agent.first_name || ""} ${agent.last_name || ""}`.trim() ||
      agent.nickname ||
      agent.email ||
      "Unknown Agent"
    );
  };

  const getSelectedAgentDetails = (agentId: number): Agent | undefined => {
    return availableAgents.find(agent => agent.id === agentId);
  };

  const handleAgentToggle = (agentId: number) => {
    if (disabled) return;

    const isSelected = selectedAgents.some(agent => agent.agent_id === agentId);
    
    if (isSelected) {
      // Remove agent
      const updatedAgents = selectedAgents.filter(agent => agent.agent_id !== agentId);
      onAgentsChange(updatedAgents);
      if (expandedAgent === agentId) {
        setExpandedAgent(null);
      }
    } else {
      // Add agent with default values
      const newAgent: TeamAgent = {
        agent_id: agentId,
        role_id: 2,
        data: JSON.stringify({
          level: "junior",
          permissions: ["read"]
        }),
        remarks: "Agent"
      };
      onAgentsChange([...selectedAgents, newAgent]);
    }
  };

  const handleAgentUpdate = (agentId: number, field: keyof TeamAgent, value: any) => {
    if (disabled) return;

    const updatedAgents = selectedAgents.map(agent => {
      if (agent.agent_id === agentId) {
        if (field === "data") {
          // Parse existing data, update specific fields, and stringify back
          try {
            const existingData = agent.data ? JSON.parse(agent.data) : {};
            const updatedData = { ...existingData, ...value };
            return { ...agent, [field]: JSON.stringify(updatedData) };
          } catch {
            return { ...agent, [field]: JSON.stringify(value) };
          }
        }
        return { ...agent, [field]: value };
      }
      return agent;
    });
    onAgentsChange(updatedAgents);
  };

  const handlePermissionChange = (agentId: number, permissions: string[]) => {
    handleAgentUpdate(agentId, "data", { permissions });
  };

  const getAgentPermissions = (agent: TeamAgent): string[] => {
    try {
      const data = agent.data ? JSON.parse(agent.data) : {};
      return data.permissions || ["read"];
    } catch {
      return ["read"];
    }
  };

  const getAgentLevel = (agent: TeamAgent): string => {
    try {
      const data = agent.data ? JSON.parse(agent.data) : {};
      return data.level || "junior";
    } catch {
      return "junior";
    }
  };

  return (
    <FormField 
      label={label} 
      required={required} 
      error={error} 
      hint={hint} 
      className={className} 
      htmlFor={name}
    >
      <div className="space-y-4">
        {/* Available Agents List */}
        <div className="max-h-60 overflow-y-auto border border-borderColor-secondary rounded-xl bg-surface-secondary">
          {availableAgents.map((agent) => {
            const isSelected = selectedAgents.some(selected => selected.agent_id === agent.id);
            const isExpanded = expandedAgent === agent.id;
            
            // Debug logging for each agent
            console.log(`Agent ${agent.id} (${getAgentDisplayName(agent)}) - isSelected:`, isSelected);
            
            return (
              <div key={agent.id} className="border-b border-borderColor-secondary last:border-b-0">
                {/* Agent Selection Row */}
                <div className="flex items-center justify-between p-4 hover:bg-surface-primary transition-colors">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id={`agent-${agent.id}`}
                      checked={isSelected}
                      onChange={() => handleAgentToggle(agent.id!)}
                      disabled={disabled}
                      className="w-4 h-4 text-primary-600 bg-surface-secondary border-borderColor-secondary rounded focus:ring-primary-500 focus:ring-2"
                    />
                    <label 
                      htmlFor={`agent-${agent.id}`}
                      className="flex-1 cursor-pointer text-textColor-base font-medium"
                    >
                      {getAgentDisplayName(agent)}
                    </label>
                  </div>
                  
                  {isSelected && (
                    <button
                      type="button"
                      onClick={() => setExpandedAgent(isExpanded ? null : agent.id!)}
                      disabled={disabled}
                      className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                    >
                      {isExpanded ? "Collapse" : "Configure"}
                    </button>
                  )}
                </div>

                {/* Agent Configuration Panel */}
                {isSelected && isExpanded && (
                  <div className="px-4 pb-4 bg-surface-primary border-t border-borderColor-secondary">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                      {/* Role Selection */}
                      <SelectField
                        label="Role"
                        name={`agent-${agent.id}-role`}
                        value={String(selectedAgents.find(a => a.agent_id === agent.id)?.role_id || 2)}
                        onChange={(value) => handleAgentUpdate(agent.id!, "role_id", Number(value))}
                        options={roleOptions.map(r => ({ value: String(r.value), label: r.label }))}
                        disabled={disabled}
                      />

                      {/* Level Selection */}
                      <SelectField
                        label="Level"
                        name={`agent-${agent.id}-level`}
                        value={getAgentLevel(selectedAgents.find(a => a.agent_id === agent.id)!)}
                        onChange={(value) => handleAgentUpdate(agent.id!, "data", { level: value })}
                        options={[
                          { value: "junior", label: "Junior" },
                          { value: "mid", label: "Mid-level" },
                          { value: "senior", label: "Senior" },
                          { value: "lead", label: "Lead" },
                        ]}
                        disabled={disabled}
                      />

                      {/* Permissions */}
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-textColor-base mb-2">
                          Permissions
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {permissionOptions.map((permission) => {
                            const currentPermissions = getAgentPermissions(selectedAgents.find(a => a.agent_id === agent.id)!);
                            const isChecked = currentPermissions.includes(permission.value);
                            
                            return (
                              <label key={permission.value} className="flex items-center space-x-2">
                                <input
                                  type="checkbox"
                                  checked={isChecked}
                                  onChange={(e) => {
                                    const newPermissions = e.target.checked
                                      ? [...currentPermissions, permission.value]
                                      : currentPermissions.filter(p => p !== permission.value);
                                    handlePermissionChange(agent.id!, newPermissions);
                                  }}
                                  disabled={disabled}
                                  className="w-4 h-4 text-primary-600 bg-surface-secondary border-borderColor-secondary rounded focus:ring-primary-500"
                                />
                                <span className="text-sm text-textColor-base">{permission.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>

                      {/* Remarks */}
                      <div className="md:col-span-2">
                        <InputField
                          label="Remarks"
                          name={`agent-${agent.id}-remarks`}
                          value={selectedAgents.find(a => a.agent_id === agent.id)?.remarks || ""}
                          onChange={(value) => handleAgentUpdate(agent.id!, "remarks", value)}
                          placeholder="Additional notes about this agent's role..."
                          disabled={disabled}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Selected Agents Summary */}
        {selectedAgents.length > 0 && (
          <div className="bg-primary-50 border border-primary-200 rounded-xl p-4">
            <h4 className="text-sm font-medium text-primary-800 mb-2">
              Selected Agents ({selectedAgents.length})
            </h4>
            <div className="space-y-1">
              {selectedAgents.map((selectedAgent) => {
                const agentDetails = getSelectedAgentDetails(selectedAgent.agent_id);
                console.log(`Selected agent ${selectedAgent.agent_id} - details:`, agentDetails);
                if (!agentDetails) {
                  console.log(`No details found for agent ${selectedAgent.agent_id}`);
                  return null;
                }
                
                return (
                  <div key={selectedAgent.agent_id} className="flex items-center justify-between text-sm">
                    <span className="text-primary-700">
                      {getAgentDisplayName(agentDetails)}
                    </span>
                    <span className="text-primary-600 font-medium">
                      {roleOptions.find(r => r.value === (selectedAgent.role_id || 2))?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </FormField>
  );
};

export default AgentSelection;

