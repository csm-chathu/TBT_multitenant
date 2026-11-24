import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { fetchCustomerById, removeCustomer, updateExistingCustomer } from '@/redux/customer/customerSlice';
import { getAllCustomers } from '@/services/customerService';
import { formatDateTimeLong } from '@/utils/dateFormat';
import { formatPhone } from '@/utils/textUtils';
import UserAvatar from '@/components/Molecules/ui/UserAvatar';
import Button from '@/components/Atomic/Button';
import PopupModal from '@/components/Molecules/ui/PopupModal';
import useToast from '@/hooks/useToast';
import TicketHistory from './TicketHistory';
import CustomerTagBadge from '@/components/Molecules/ui/CustomerTagBadge';

const ViewCustomers = () => {
  const { hash } = useParams<{ hash: any }>();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const { success: showSuccess, error: showError } = useToast();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteReason, setDeleteReason] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  
  // Tag modal states
  const [isTagModalOpen, setIsTagModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [customTagInput, setCustomTagInput] = useState<string>('');
  const [isSavingTag, setIsSavingTag] = useState(false);

  const { selectedCustomer, loading, error } = useAppSelector((state) => state.customers);

  useEffect(() => {
    const loadCustomer = async () => {
      if (!hash) return;
      
      try {
        // Check if hash is numeric (legacy ID)
        const numericId = parseInt(hash);
        if (!isNaN(numericId) && String(numericId) === hash) {
          dispatch(fetchCustomerById(numericId));
          return;
        }
        
        // Find customer by hash
        const result = await getAllCustomers();
        const list = Array.isArray(result) ? result : (result as any).data ?? [];
        const foundCustomer = list.find((c: any) => {
          const customerHash = c.hash || (c as any).hash;
          return customerHash === hash || customerHash?.endsWith(hash);
        });
        
        if (foundCustomer?.id) {
          dispatch(fetchCustomerById(foundCustomer.id));
        }
      } catch (error) {
        console.error("Failed to load customer by hash:", error);
      }
    };
    
    loadCustomer();
  }, [hash, dispatch]);

  if (loading) {
    return (
      <div className="mt-6 p-4 flex items-center justify-center">
        <div className="text-lg">Loading customer details...</div>
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

  if (!selectedCustomer) {
    return (
      <div className="mt-6 p-4 flex items-center justify-center">
        <div className="text-lg">Customer not found</div>
      </div>
    );
  }

  const handleDeleteCustomer = async () => {
    if (!deleteReason.trim()) {
      setDeleteError('Reason is required to delete a customer');
      throw new Error('Reason is required');
    }
    setDeleteError('');
    setIsDeleting(true);
    try {
      await dispatch(removeCustomer({ id: selectedCustomer!.id!, reason: deleteReason })).unwrap();
      showSuccess('Customer deleted successfully');
      navigate(-1);
    } catch (err) {
      showError(err);
    } finally {
      setIsDeleting(false);
    }
  };

  const normalizeStatus = (status: string | undefined | null) => {
    if (!status) return "N/A";
    const normalized = status.toLowerCase();
    if (normalized === "active") return "Active";
    if (normalized === "disabled" || normalized === "disable") return "Disable";
    return status;
  };

  const handleOpenTagModal = () => {
    const currentTag = selectedCustomer?.tag || '';
    const isPreset = ['', 'Annoying / Difficult', 'VIP Customer', 'Frequent Caller', 'High Risk', 'New Customer', 'Regular Customer'].includes(currentTag);
    if (isPreset) {
      setSelectedTag(currentTag);
      setCustomTagInput('');
    } else {
      setSelectedTag('CUSTOM');
      setCustomTagInput(currentTag);
    }
    setIsTagModalOpen(true);
  };

  const handleSaveTag = async (overrideTag?: any) => {
    if (!selectedCustomer?.id) return;
    setIsSavingTag(true);
    try {
      const finalTag = typeof overrideTag === 'string'
        ? overrideTag
        : (selectedTag === 'CUSTOM' ? customTagInput.trim() : selectedTag);
          
      await dispatch(
        updateExistingCustomer({
          id: selectedCustomer.id,
          data: {
            ...selectedCustomer,
            tag: finalTag || '',
          },
        })
      ).unwrap();
      
      await dispatch(fetchCustomerById(selectedCustomer.id)).unwrap();
      showSuccess(finalTag ? 'Customer tag updated successfully' : 'Customer tag removed successfully');
      setIsTagModalOpen(false);
    } catch (err: any) {
      showError(err?.message || 'Failed to update tag');
    } finally {
      setIsSavingTag(false);
    }
  };

  const customerDetails = [
    { label: 'Name', value: (() => { const n = `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim(); return n ? (/^\+?[\d\s\-().]{7,}$/.test(n) ? formatPhone(n) : n) : 'N/A' })() },
    { label: 'Email', value: selectedCustomer.email || 'N/A' },
    { label: 'Date of Birth', value: selectedCustomer.dob || 'N/A' },
    { label: 'Status', value: normalizeStatus(selectedCustomer.status) },
    { label: 'Customer Tag', value: selectedCustomer.tag || 'N/A' },
    { label: 'Phone Number', value: selectedCustomer.phone_number ? formatPhone(selectedCustomer.phone_number) : 'N/A' },
    { label: 'Mobile Number', value: selectedCustomer.mobile_number ? formatPhone(selectedCustomer.mobile_number) : 'N/A' },
    { label: 'Address', value: selectedCustomer.address_line1 || 'N/A' },
    { label: 'Country', value: selectedCustomer.country?.name || selectedCustomer.Country?.name || 'N/A' },
    { label: 'State', value: selectedCustomer.state?.name || selectedCustomer.State?.name || 'N/A' },
    { label: 'Created At', value: formatDateTimeLong(selectedCustomer.createdAt) },
    { label: 'Updated At', value: formatDateTimeLong(selectedCustomer.updatedAt) },
    // { label: 'City', value: selectedCustomer.city || 'N/A' },
    { label: 'Agent Description', value: selectedCustomer.description || 'N/A' },
    { label: 'Remarks', value: selectedCustomer.remarks || 'N/A' },
  ];

  const callViaRingCentral = (phoneNumber?: string | null) => {
    if (!phoneNumber) return
    const frame = document.querySelector('#rc-widget-adapter-frame') as HTMLIFrameElement | null
    if (!frame?.contentWindow) return
    // Expand the widget first if it is collapsed, then dial
    frame.contentWindow.postMessage({ type: 'rc-adapter-toggle-minimized', minimized: false }, '*')
    setTimeout(() => {
      frame.contentWindow?.postMessage({ type: 'rc-adapter-new-call', phoneNumber, toCall: true }, '*')
    }, 300)
  }

  const getCustomerCode = () => {
    if (selectedCustomer?.customer_code) return selectedCustomer.customer_code;
    const custId = selectedCustomer?.id;
    if (!custId) return 'N/A';
    const custPadded = String(custId).padStart(4, '0');
    const tktId = selectedCustomer?.first_ticket_id;
    const tktPadded = tktId ? String(tktId).padStart(5, '0') : '00000';
    return `CUST-${custPadded}${tktPadded}`;
  };

  return (
    <div className='space-y-6'>
      <div className="p-4 space-y-3 bg-surface-primary rounded-lg">
          <div className='flex items-center justify-between gap-4 pt-4 pb-10'>
            <div className='flex items-center gap-3'>
              <Button icon='arrow_back' text='Back' style='Text' onClick={() => navigate(-1)} />
              <UserAvatar className='h-12 w-12' name={selectedCustomer.first_name} background="#FFA15D" small />
              <div>
                <div className='flex items-center gap-2.5 flex-wrap'>
                  <p className='text-lg font-bold text-textColor-base'>{(() => { const n = `${selectedCustomer.first_name || ''} ${selectedCustomer.last_name || ''}`.trim(); return n ? (/^\+?[\d\s\-().]{7,}$/.test(n) ? formatPhone(n) : n) : 'N/A' })()}</p>
                  {selectedCustomer.tag ? (
                    <div className="flex items-center gap-1.5">
                      <CustomerTagBadge tag={selectedCustomer.tag} />
                      <button
                        type="button"
                        onClick={handleOpenTagModal}
                        className="text-xs text-primary-500 hover:text-primary-600 hover:underline inline-flex items-center gap-0.5 ml-1 transition-all cursor-pointer font-medium"
                        title="Edit Customer Tag"
                      >
                        Edit Tag
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleOpenTagModal}
                      className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold border border-dashed border-primary-300 text-primary-600 rounded-full hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-all cursor-pointer"
                      title="Add tag to this customer"
                    >
                      + Add Tag
                    </button>
                  )}
                </div>
                <p className='text-xs text-textColor-muted mt-0.5'>Customer ID: {getCustomerCode()}</p>
              </div>
            </div>
            <div className='flex items-center gap-3'>
              <Button icon='Edit' text='Edit Customer' style='Tertiary' onClick={() => navigate(`/dashboard/customers/edit/${selectedCustomer.hash}`)}/>
              <Button icon='Delete' text='Delete Customer' style='Danger' onClick={() => { setDeleteReason(''); setDeleteError(''); setIsModalOpen(true); }}/>
            </div>
          </div>
          <div className='grid g sm:grid-cols-2 md:grid-cols-5 gap-4 gap-y-10 pt-10 pb-4 border-t border-borderColor-secondary'>
            {customerDetails.filter(item => item.value && item.value !== 'N/A').map((item, index) => (
              <div key={index} className='space-y-2'>
                <p className='text-sm text-textColor-muted'>{item.label}</p>
                {item.label === 'Status' ? (
                    item.value === 'Active' ? (
                      <span className="priority-chip priority-low">Active</span>
                    ) : item.value === 'Disable' ? (
                      <span className="priority-chip priority-critical">Disable</span>
                    ) : (
                      <p className="font-medium">{item.value}</p>
                    )
                  ) : item.label === 'Customer Tag' ? (
                    selectedCustomer.tag ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <CustomerTagBadge tag={selectedCustomer.tag} />
                        <button
                          type="button"
                          onClick={handleOpenTagModal}
                          className="text-xs text-primary-500 hover:underline cursor-pointer font-medium"
                        >
                          Edit
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <span className="text-textColor-muted text-sm">None</span>
                        <button
                          type="button"
                          onClick={handleOpenTagModal}
                          className="text-xs text-primary-500 hover:underline font-medium cursor-pointer"
                        >
                          + Add Tag
                        </button>
                      </div>
                    )
                  ) : (item.label === 'Phone Number' || item.label === 'Mobile Number') ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium">{item.value}</p>
                      <button
                        type="button"
                        onClick={() => callViaRingCentral(
                          item.label === 'Phone Number'
                            ? selectedCustomer.phone_number
                            : selectedCustomer.mobile_number
                        )}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xs font-semibold shadow-sm transition-colors"
                        title="Call via RingCentral"
                      >
                        <span className="material-symbols-outlined text-sm leading-none">call</span>
                        Call
                      </button>
                    </div>
                  ) : (
                    <p className="font-medium md:max-w-60">{item.value}</p>
                  )}
              </div>
            ))}
          </div>
      </div>
      <div className='p-4 space-y-3 bg-surface-primary rounded-lg'>
        <TicketHistory customerId={selectedCustomer.id!}/>
      </div>

      <PopupModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleDeleteCustomer}
        title="Confirm Delete"
      >
        <p className="mb-4">
          Are you sure you want to delete <strong>{selectedCustomer.first_name} {selectedCustomer.last_name}</strong>?
        </p>
        <label className="block text-sm font-medium mb-1">Reason (required)</label>
        <textarea
          value={deleteReason}
          onChange={(e) => { setDeleteReason(e.target.value); setDeleteError(''); }}
          className="w-full min-h-[80px] border rounded p-2 bg-white text-black"
          placeholder="Provide a reason for deletion"
          disabled={isDeleting}
        />
        {deleteError && <p className="text-red-500 text-sm mt-1">{deleteError}</p>}
      </PopupModal>

      {/* Quick Tag Edit/Add Modal */}
      <PopupModal
        open={isTagModalOpen}
        onClose={() => setIsTagModalOpen(false)}
        title={selectedCustomer?.tag ? "Edit Customer Tag" : "Add Customer Tag"}
        customFooter={
          <div className="flex items-center justify-between w-full">
            {selectedCustomer?.tag ? (
              <Button
                style="Danger"
                text="Remove Tag"
                onClick={() => handleSaveTag('')}
                disabled={isSavingTag}
              />
            ) : <div />}
            <div className="flex gap-2">
              <Button style="Tertiary" text="Cancel" onClick={() => setIsTagModalOpen(false)} />
              <Button text="Save Tag" onClick={() => handleSaveTag()} loading={isSavingTag} />
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-textColor-muted">
            Select or customize a badge for <strong>{selectedCustomer?.first_name} {selectedCustomer?.last_name}</strong>:
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setSelectedTag('')}
              className={`p-2.5 rounded-lg border text-left text-sm flex items-center gap-2 transition-all cursor-pointer ${
                !selectedTag ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 font-semibold' : 'border-primary-100 hover:bg-surface-secondary'
              }`}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-gray-400" />
              None (No Tag)
            </button>

            {[
              { value: 'Annoying / Difficult', label: '🔴 Annoying / Difficult Customer' },
              { value: 'VIP Customer', label: '🟡 VIP Customer' },
              { value: 'Frequent Caller', label: '🟣 Frequent Caller' },
              { value: 'High Risk', label: '🟠 High Risk' },
              { value: 'New Customer', label: '🔵 New Customer' },
              { value: 'Regular Customer', label: '🟢 Regular Customer' },
            ].map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setSelectedTag(opt.value)}
                className={`p-2.5 rounded-lg border text-left text-sm flex items-center gap-2 transition-all cursor-pointer ${
                  selectedTag === opt.value
                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 font-semibold text-primary-600'
                    : 'border-primary-100 hover:bg-surface-secondary'
                }`}
              >
                {opt.label}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSelectedTag('CUSTOM')}
              className={`p-2.5 rounded-lg border text-left text-sm flex items-center gap-2 transition-all cursor-pointer ${
                selectedTag === 'CUSTOM'
                  ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/30 font-semibold text-primary-600'
                  : 'border-primary-100 hover:bg-surface-secondary'
              }`}
            >
              ✏️ Custom Tag...
            </button>
          </div>

          {selectedTag === 'CUSTOM' && (
            <div className="pt-2">
              <label className="block text-sm font-medium mb-1">Custom Badge Text</label>
              <input
                type="text"
                value={customTagInput}
                onChange={(e) => setCustomTagInput(e.target.value)}
                placeholder="e.g. VIP Member, Escalated Support"
                className="w-full border rounded-lg p-2.5 bg-surface-primary text-textColor-base border-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
            </div>
          )}
        </div>
      </PopupModal>
    </div>
  );
};

export default ViewCustomers;