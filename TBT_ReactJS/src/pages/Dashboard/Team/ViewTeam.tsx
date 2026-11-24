import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { fetchTeamById } from "@/redux/team/teamSlice";
import { getAllTeams } from "@/services/teamService";
import { ENTITY_STATUS } from "@/constants/entityStatus";
import { formatDateTimeLong } from "@/utils/dateFormat";

const ViewTeam = () => {
  const { hash } = useParams<{ hash: any }>();
  const dispatch = useAppDispatch();
  const { selectedTeam, loading, error } = useAppSelector(
    (state) => state.teams
  );

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
  }, [hash, dispatch]);

  if (loading) {
    return (
      <div className="mt-6 p-4 flex items-center justify-center">
        <div className="text-lg">Loading team details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 p-4 flex items-center justify-center">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  if (!selectedTeam) {
    return (
      <div className="mt-6 p-4 flex items-center justify-center">
        <div className="text-lg">Team not found</div>
      </div>
    );
  }

  // Type assertion to handle API response structure
  const team = selectedTeam as any;
  const agents = team?.agents || [];
  const application = team?.Application;
  const leaderName = team?.leader_name;

  // Format address
  const formatAddress = () => {
    const parts = [];
    if (team?.address_line1) parts.push(team.address_line1);
    if (team?.address_line2) parts.push(team.address_line2);
    if (team?.city) parts.push(team.city);
    return parts.length > 0 ? parts.join(", ") : "N/A";
  };

  const teamDetails = [
    { label: "Team Name", value: selectedTeam.name || "N/A" },
    {
      label: "Service Phone Number",
      value: selectedTeam.phone_number || "N/A",
    },
    { label: "Team Email", value: selectedTeam.email || "N/A" },
    { label: "Address", value: formatAddress() },
    { label: "Status", value: selectedTeam.status || "N/A" },
    { label: "Team Lead", value: leaderName || "N/A" },
    {
      label: "Assigned Applications",
      value: application ? [application.name] : [],
    },
    { label: "Description", value: selectedTeam.description || "N/A" },
    { label: "Remarks", value: selectedTeam.remarks || "N/A" },
    {
      label: "Created At",
      value: formatDateTimeLong(selectedTeam.createdAt),
    },
    {
      label: "Updated At",
      value: formatDateTimeLong(selectedTeam.updatedAt),
    },
  ];

  return (
    <div className="mt-6 space-y-6">
      {/* Team Details Section */}
      <div className="mt-6 p-4 space-y-3 bg-surface-primary rounded-lg">
        {teamDetails.map((item, index) => (
          <div key={index} className="flex gap-4">
            <p className="text-base text-textColor-muted w-52">
              {item.label}
            </p>
            {item.label === "Status" ? (
              item.value === ENTITY_STATUS.ACTIVE ? (
                <span className="priority-chip priority-low">Active</span>
              ) : item.value === ENTITY_STATUS.DISABLED ? (
                <span className="priority-chip priority-critical">Disabled</span>
              ) : (
                <p className="font-medium">{item.value}</p>
              )
            ) : item.label === "Assigned Applications" ? (
              <p className="font-medium">
                {Array.isArray(item.value) ? item.value.join(", ") : item.value}
              </p>
            ) : (
              <p className="font-medium md:max-w-60">{item.value}</p>
            )}
          </div>
        ))}
      </div>

      {/* Team Members Section */}
      {agents.length > 0 && (
        <div className="p-4 bg-surface-primary rounded-lg">
          <h3 className="text-lg font-semibold mb-4 text-textColor-primary">
            Team Members ({agents.length})
          </h3>
          <div className="space-y-4">
            {agents.map((agent: any) => {
              const teamAgent = agent.TeamAgent || {};

              return (
                <div
                  key={agent.id}
                  className="p-4 border border-borderColor-primary rounded-lg bg-surface-secondary"
                >
                  <div className="flex flex-wrap gap-y-4 gap-x-8">
                    <div className="space-y-2">
                      <p className="text-xs text-textColor-muted uppercase font-semibold">
                        Name
                      </p>
                      <p className="font-medium">
                        {agent.first_name || ""} {agent.last_name || ""}
                        {agent.nickname && ` (${agent.nickname})`}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-textColor-muted uppercase font-semibold">
                        Email
                      </p>
                      <p className="font-medium">{agent.email || "N/A"}</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-textColor-muted uppercase font-semibold">
                        Mobile
                      </p>
                      <p className="font-medium">
                        {agent.mobile_number || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-textColor-muted uppercase font-semibold">
                        Phone
                      </p>
                      <p className="font-medium">
                        {agent.phone_number || "N/A"}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs text-textColor-muted uppercase font-semibold">
                        Status
                      </p>
                      {agent.status === "Active" ? (
                        <span className="priority-chip priority-low">
                          Active
                        </span>
                      ) : (
                        <span className="priority-chip priority-critical">
                          {agent.status || "N/A"}
                        </span>
                      )}
                    </div>
                    {(teamAgent.remarks || agent.remarks) && (
                      <div className="space-y-2">
                        <p className="text-xs text-textColor-muted uppercase font-semibold">
                          Role Remarks
                        </p>
                        <p className="font-medium">
                          {agent.remarks || teamAgent.remarks}
                        </p>
                      </div>
                    )}
                    {agent.description && (
                      <div className="space-y-2 min-w-[240px] flex-1">
                        <p className="text-xs text-textColor-muted uppercase font-semibold">
                          Description
                        </p>
                        <p className="font-medium">{agent.description}</p>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

export default ViewTeam;
