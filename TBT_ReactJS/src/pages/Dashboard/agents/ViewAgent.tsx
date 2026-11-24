import { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchAgentById } from '@/redux/agent/agentSlice';
import { getAllAgents } from '@/services/agentService';
import { fetchCountries } from '@/redux/country/countrySlice';
import { fetchStatesByCountry } from '@/redux/state/stateSlice';
import Button from '@/components/Atomic/Button';
import { formatDateTimeLong } from '@/utils/dateFormat';

const ViewAgent = () => {
  const { hash } = useParams<{ hash: any }>();
  const dispatch = useAppDispatch();
  const { selectedAgent, loading, error } = useAppSelector((state) => state.agents);
  const countries = useAppSelector((state) => state.countries.list);
  const states = useAppSelector((state) => state.states.list);

  useEffect(() => {
    dispatch(fetchCountries());
  }, [dispatch]);

  useEffect(() => {
    if (selectedAgent?.country_id) {
      dispatch(fetchStatesByCountry(selectedAgent.country_id));
    }
  }, [dispatch, selectedAgent?.country_id]);

  useEffect(() => {
    const loadAgent = async () => {
      if (!hash) return;
      
      try {
        // Check if hash is numeric (legacy ID)
        const numericId = parseInt(hash);
        if (!isNaN(numericId) && String(numericId) === hash) {
          dispatch(fetchAgentById(numericId));
          return;
        }
        
        // Find agent by hash
        const allAgents = await getAllAgents();
        const foundAgent = allAgents.find((a: any) => {
          const agentHash = a.hash || (a as any).hash;
          return agentHash === hash || agentHash?.endsWith(hash);
        });
        
        if (foundAgent?.id) {
          dispatch(fetchAgentById(foundAgent.id));
        }
      } catch (error) {
        console.error("Failed to load agent by hash:", error);
      }
    };
    
    loadAgent();
  }, [hash, dispatch]);

  if (loading) {
    return (
      <div className="mt-6 p-4 flex items-center justify-center">
        <div className="text-lg">Loading agent details...</div>
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

  if (!selectedAgent) {
    return (
      <div className="mt-6 p-4 flex items-center justify-center">
        <div className="text-lg">Agent not found</div>
      </div>
    );
  }

  // Format address: address_line1 (+ address_line2) + state + country
  const formatAddress = () => {
    const addressParts = [];
    
    // Add address_line1
    if (selectedAgent.address_line1) {
      addressParts.push(selectedAgent.address_line1);
    }
    
    // Add address_line2 if exists
    if (selectedAgent.address_line2) {
      addressParts.push(selectedAgent.address_line2);
    }
    
    // Add state name (from nested object or lookup)
    const stateName = selectedAgent.State?.name || 
      (selectedAgent.state_id && states.find(s => s.id === selectedAgent.state_id)?.name);
    if (stateName) {
      addressParts.push(stateName);
    }
    
    // Add country name (from nested object or lookup)
    const countryName = selectedAgent.Country?.name || 
      (selectedAgent.country_id && countries.find(c => c.id === selectedAgent.country_id)?.name);
    if (countryName) {
      addressParts.push(countryName);
    }
    
    if (addressParts.length === 0) {
      return 'N/A';
    }
    
    return addressParts.join(", ");
  };

  const agentDetails = [
    { label: 'Name', value: `${selectedAgent.first_name || ''} ${selectedAgent.last_name || ''}`.trim() || 'N/A' },
    { label: 'Email', value: selectedAgent.email || 'N/A' },
    { label: 'Phone Number', value: selectedAgent.phone_number || 'N/A' },
    { label: 'Date Of Birth', value: selectedAgent.dob || 'N/A' },
    { label: 'Gender', value: selectedAgent.sex || 'N/A' },
    { label: 'Status', value: selectedAgent.status || 'N/A' },
    { label: 'Address', value: formatAddress() },
    { label: 'Agent Description', value: selectedAgent.description || 'N/A' },
    { label: 'Remarks', value: selectedAgent.remarks || 'N/A' },
    { label: 'Created At', value: formatDateTimeLong(selectedAgent.createdAt) },
    { label: 'Updated At', value: formatDateTimeLong(selectedAgent.updatedAt) },
  ];

  const agentName = `${selectedAgent.first_name || ''} ${selectedAgent.last_name || ''}`.trim() || 'N/A';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start gap-2 mb-4">
        <div className="flex items-center gap-2">
          <Button 
            style="Secondary" 
            icon="edit" 
            text="Edit Agent" 
            href={`/dashboard/agents/edit/${hash}`}
          />
        </div>
      </div>

      {/* Agent Details */}
      <div className="p-4 pt-6 bg-surface-primary border border-borderColor-secondary rounded-lg">
        {/* Title Section */}
        <div className="space-y-2 mb-6">
          <h2 className="text-2xl font-semibold">
            {agentName}
          </h2>
          {selectedAgent.email && (
            <p className="text-sm text-textColor-muted">
              {selectedAgent.email}
            </p>
          )}
        </div>

        {/* Details Grid */}
        <div className="mt-6 p-4 space-y-3 bg-surface-primary rounded-lg">
          {agentDetails.map((item, index) => (
            <div key={index} className="flex gap-4">
              <p className="text-base text-textColor-muted w-52">
                {item.label}
              </p>

              {item.label === 'Status' ? (
                item.value === 'Active' ? (
                  <span className="priority-chip priority-low">Active</span>
                ) : item.value === 'Disable' ? (
                  <span className="priority-chip priority-critical">Disable</span>
                ) : (
                  <p className="font-medium">{item.value}</p>
                )
              ) : (
                <p className="font-medium md:max-w-60">{item.value}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ViewAgent;
