import { fetchApplicationById } from "@/redux/applications/applicationSlice";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { useEffect } from "react";
import { useParams } from "react-router-dom";
import { getAllApplications } from "@/services/applicationService";
import { ENTITY_STATUS } from "@/constants/entityStatus";
import { formatDateTimeLong } from "@/utils/dateFormat";

const ViewApplications = () => {
  const { hash } = useParams<{ hash: any }>();
  const dispatch = useAppDispatch();

  // Get application data from Redux state
  const { selectedApplicaton, loading, error } = useAppSelector(
    (state) => state.applications
  );

  useEffect(() => {
    const loadApplication = async () => {
      if (!hash) return;
      
      try {
        // Check if hash is numeric (legacy ID)
        const numericId = parseInt(hash);
        if (!isNaN(numericId) && String(numericId) === hash) {
          dispatch(fetchApplicationById(numericId));
          return;
        }
        
        // Find application by hash
        const allApplications = await getAllApplications();
        const foundApp = allApplications.find((a: any) => {
          const appHash = a.hash || (a as any).hash;
          return appHash === hash || appHash?.endsWith(hash);
        });
        
        if (foundApp?.id) {
          dispatch(fetchApplicationById(foundApp.id));
        }
      } catch (error) {
        console.error("Failed to load application by hash:", error);
      }
    };
    
    loadApplication();
  }, [hash, dispatch]);

  // Show loading state
  if (loading) {
    return (
      <div className="mt-6 p-4 flex items-center justify-center">
        <div className="text-lg">Loading application details...</div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="mt-6 p-4 flex items-center justify-center">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    );
  }

  // Show message if no application found
  if (!selectedApplicaton) {
    return (
      <div className="mt-6 p-4 flex items-center justify-center">
        <div className="text-lg">Application not found</div>
      </div>
    );
  }

  // Prepare application details from fetched data
  const applicationDetails = [
    { label: "Application Name", value: selectedApplicaton.name || "N/A" },
    {
      label: "Service Phone Number",
      value: selectedApplicaton.service_phone_number || "N/A",
    },
    {
      label: "Service Email",
      value: selectedApplicaton.service_email || "N/A",
    },
    { label: "Status", value: selectedApplicaton.status || "N/A" },
    {
      label: "Application Description",
      value: selectedApplicaton.description || "N/A",
    },
    { label: "Remarks", value: selectedApplicaton.remarks || "N/A" },
    {
      label: "Organization",
      value: selectedApplicaton.organization?.name || selectedApplicaton.organization_id?.toString() || "N/A",
    },
    {
      label: "Created At",
      value: formatDateTimeLong(selectedApplicaton.createdAt),
    },
    {
      label: "Updated At",
      value: formatDateTimeLong(selectedApplicaton.updatedAt),
    },
  ];

  return (
    <div className="mt-6 p-4 space-y-3 bg-surface-primary rounded-lg">
      {applicationDetails.map((item, index) => (
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
          ) : item.label === "teams" && Array.isArray(item.value) ? (
            item.value.map((teamItem, teamIndex) => (
              <div key={teamIndex} className="inline-flex mr-2">
                <span className="chip">{teamItem}</span>
              </div>
            ))
          ) : (
            <p className="font-medium md:max-w-60">{item.value}</p>
          )}
        </div>
      ))}
    </div>
  );
};

export default ViewApplications;
