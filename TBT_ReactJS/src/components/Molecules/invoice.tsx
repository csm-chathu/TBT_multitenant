'use client';

import { useState, useEffect, useRef } from 'react';
import { Trash2, Plus, X, File, Loader2, AlertCircle } from 'lucide-react';
import Input from '../Atomic/Input';
import TextEditorField from './TextEditorField';
import { ticketInvoiceApi, TicketInvoiceItem } from '../../services/ticketInvoiceService';
import useToast from '@/hooks/useToast';

interface BillingItem extends TicketInvoiceItem {
    id: string; // Internal id for UI list
}

interface Attachment {
    id: string;
    name: string;
    size: string;
    file?: File;
    url?: string;
    key?: string;
    preview?: string;
}

const IMAGE_EXTENSIONS = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i;
const isImageUrl = (url: string) => IMAGE_EXTENSIONS.test(url.split('?')[0]);

interface BillingInvoiceProps {
    ticketId?: number;
    initialInvoice?: any;
}

export default function BillingInvoice({ ticketId, initialInvoice }: BillingInvoiceProps) {
    const { success, error } = useToast();
    const [items, setItems] = useState<BillingItem[]>([]);
    const [notes, setNotes] = useState('');
    const [attachments, setAttachments] = useState<Attachment[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [existingInvoiceId, setExistingInvoiceId] = useState<number | null>(null);
    const [initialStateHash, setInitialStateHash] = useState('');
    const [priceDisplays, setPriceDisplays] = useState<Record<string, string>>({});
    const [qtyDisplays, setQtyDisplays] = useState<Record<string, string>>({});
    const [validationError, setValidationError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const formatPrice = (price: number) =>
        price === 0 ? '' : price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        const newAttachments: Attachment[] = Array.from(files).map((file) => ({
            id: Date.now().toString() + Math.random().toString(36).substring(7),
            name: file.name,
            size: `${file.name.split('.').pop()?.toUpperCase() || 'FILE'}, ${formatFileSize(file.size)}`,
            file: file,
            preview: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        }));

        setAttachments((prev) => [...prev, ...newAttachments]);

        if (fileInputRef.current) fileInputRef.current.value = '';
    };

    useEffect(() => {
        return () => {
            attachments.forEach((att) => {
                if (att.preview && att.file) URL.revokeObjectURL(att.preview);
            });
        };
    }, []);

    useEffect(() => {
        if (!ticketId) return;

        if (initialInvoice) {
            setExistingInvoiceId(initialInvoice.id);
            setNotes(initialInvoice.extra_notes || '');
            
            let parsedItems = [];
            if (typeof initialInvoice.items === 'string') {
                try { parsedItems = JSON.parse(initialInvoice.items); } catch(e){}
            } else if (Array.isArray(initialInvoice.items)) {
                parsedItems = initialInvoice.items;
            }

            if (parsedItems.length > 0) {
                parsedItems = parsedItems.map((item: any, idx: number) => ({
                    ...item,
                    id: Date.now().toString() + idx
                }));
                const displays: Record<string, string> = {};
                const qtyDisps: Record<string, string> = {};
                parsedItems.forEach((item: any) => {
                    displays[item.id] = formatPrice(item.price ?? 0);
                    qtyDisps[item.id] = item.quantity ? String(item.quantity) : '';
                });
                setPriceDisplays(displays);
                setQtyDisplays(qtyDisps);
            }

            let parsedAttachments = [];
            if (typeof initialInvoice.attachments === 'string') {
                try { parsedAttachments = JSON.parse(initialInvoice.attachments); } catch(e){}
            } else if (Array.isArray(initialInvoice.attachments)) {
                parsedAttachments = initialInvoice.attachments;
            }

            if (parsedAttachments.length > 0) {
                parsedAttachments = parsedAttachments.map((att: any, idx: number) => ({
                    id: Date.now().toString() + 'att' + idx,
                    name: att.name || `Attachment ${idx + 1}`,
                    size: att.size || 'Unknown',
                    url: att.url,
                    key: att.key,
                }));
            }

            setItems(parsedItems);
            setAttachments(parsedAttachments);
            setInitialStateHash(JSON.stringify({ items: parsedItems, notes: initialInvoice.extra_notes || '', attachments: parsedAttachments }));
        } else {
            setInitialStateHash(JSON.stringify({ items: [], notes: '', attachments: [] }));
        }
    }, [ticketId, initialInvoice]);

    const hasChanges = JSON.stringify({ items, notes, attachments }) !== initialStateHash;

    const addItem = () => {
        const newId = Date.now().toString();
        const newItem: BillingItem = { id: newId, name: '', quantity: 0, price: 0, total: 0 };
        setItems([...items, newItem]);
        setPriceDisplays((prev) => ({ ...prev, [newId]: '' }));
        setQtyDisplays((prev) => ({ ...prev, [newId]: '' }));
    };

    const updateItem = (id: string, field: keyof BillingItem, value: any) => {
        setValidationError(null);
        setItems(
            items.map((item) => {
                if (item.id === id) {
                    const updated = { ...item, [field]: value };
                    updated.total = updated.quantity * updated.price;
                    return updated;
                }
                return item;
            })
        );
    };

    const deleteItem = (id: string) => {
        setItems(items.filter((item) => item.id !== id));
        setPriceDisplays((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
        setQtyDisplays((prev) => {
            const next = { ...prev };
            delete next[id];
            return next;
        });
    };

    const removeAttachment = (id: string) => {
        setAttachments(attachments.filter((att) => att.id !== id));
    };

    const calculateTotal = (item: BillingItem) => {
        return item.quantity * item.price;
    };

    const subtotal = items.reduce((sum, item) => sum + calculateTotal(item), 0);
    const taxRate = 0;
    const taxAmount = 0;
    const total = subtotal;

    const handleSaveInvoice = async () => {
        if (!ticketId) {
            error("No ticket selected.");
            return;
        }

        if (items.length === 0) {
            setValidationError("Add at least one item before saving.");
            return;
        }

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const num = i + 1;
            if (!item.name.trim()) {
                setValidationError(`Item ${num}: name is required.`);
                return;
            }
            if (!item.quantity || item.quantity <= 0) {
                setValidationError(`Item ${num}: quantity is required.`);
                return;
            }
            if (!item.price || item.price <= 0) {
                setValidationError(`Item ${num}: unit price is required.`);
                return;
            }
        }

        setValidationError(null);

        setIsSaving(true);
        try {
            // First, upload all local files
            const uploadedAttachments = [...attachments];
            for (let i = 0; i < uploadedAttachments.length; i++) {
                if (uploadedAttachments[i].file) {
                    try {
                        const response = await ticketInvoiceApi.uploadAttachment(ticketId, uploadedAttachments[i].file!);
                        // Support returning the URL string directly or inside an object
                        if (response && typeof response === 'object') {
                            uploadedAttachments[i] = { ...uploadedAttachments[i], ...response, file: undefined };
                        } else if (typeof response === 'string') {
                            uploadedAttachments[i] = { ...uploadedAttachments[i], url: response, file: undefined };
                        }
                    } catch (uploadErr) {
                        console.error("Failed to upload attachment", uploadedAttachments[i].name, uploadErr);
                        error(`Failed to upload ${uploadedAttachments[i].name}`);
                        setIsSaving(false);
                        return; // Stop saving if an upload fails
                    }
                }
            }

            // Update state with uploaded URLs so we don't upload them again
            setAttachments(uploadedAttachments);

            const payload = {
                ticket_id: ticketId,
                items: items.map(item => ({
                    name: item.name,
                    quantity: item.quantity,
                    price: item.price,
                    total: calculateTotal(item)
                })),
                extra_notes: notes,
                subtotal,
                tax_rate: taxRate,
                tax_amount: taxAmount,
                total,
                attachments: uploadedAttachments.map(att => {
                    const { id, file, ...rest } = att as any;
                    return rest;
                })
            };

            if (existingInvoiceId) {
                await ticketInvoiceApi.updateInvoice(ticketId, existingInvoiceId, payload);
                success("Invoice updated successfully!");
            } else {
                const newInvoice = await ticketInvoiceApi.createInvoice(ticketId, payload);
                setExistingInvoiceId(newInvoice.id);
                success("Invoice created successfully!");
            }
            setInitialStateHash(JSON.stringify({ items, notes, attachments: uploadedAttachments }));
        } catch (err) {
            console.error("Failed to save invoice:", err);
            error("Failed to save invoice.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="my-10 bg-surface-primary p-4 rounded-lg ">
            {/* Header */}
            <div className="flex justify-between items-center mb-5">
                <h1 className="text-lg ">
                    Billing items and Invoice
                </h1>
                <button 
                    onClick={handleSaveInvoice}
                    disabled={isSaving || !hasChanges}
                    className={`${hasChanges ? 'text-primary-500 hover:text-primary-600' : 'text-textColor-muted'} text-base font-medium flex items-center gap-2 disabled:opacity-50`}
                >
                    {isSaving && <Loader2 className="animate-spin" size={16} />}
                    {existingInvoiceId ? "Update invoice" : "Save invoice"}
                </button>
            </div>
            {/* Validation Alert */}
            {validationError && (
                <div className="flex items-center gap-2 mb-4 px-3 py-2 rounded-md bg-red-50 border border-red-200 text-red-600 text-sm">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    <span>{validationError}</span>
                    <button onClick={() => setValidationError(null)} className="ml-auto text-red-400 hover:text-red-600">
                        <X size={14} />
                    </button>
                </div>
            )}

            {/* Billing Items Table */}
            <div className="space-y-2">
                {items.length > 0 && (
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <div className="w-6/12 text-xs font-semibold text-textColor-muted uppercase tracking-wider">Item Name</div>
                        <div className="w-2/12 text-xs font-semibold text-textColor-muted uppercase tracking-wider">Quantity</div>
                        <div className="w-3/12 text-xs font-semibold text-textColor-muted uppercase tracking-wider">Unit Price</div>
                        <div className="w-3/12 text-xs font-semibold text-textColor-muted uppercase tracking-wider text-right pr-2">Total Price</div>
                        <div className="w-[20px] flex-shrink-0"></div>
                    </div>
                )}
                {items.map((item, index) => (
                    <div
                        key={item.id}
                        className="flex items-center gap-2"
                    >
                        {/* Item Name */}
                        <Input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                                updateItem(item.id, 'name', e.target.value)
                            }
                            placeholder={index === items.length - 1 ? 'Item name' : ''}
                            className='w-6/12'
                        />


                        {/* Quantity - 12% */}
                        <Input
                            type="text"
                            value={qtyDisplays[item.id] ?? (item.quantity === 0 ? '' : String(item.quantity))}
                            onChange={(e) => {
                                const raw = e.target.value;
                                if (raw !== '' && !/^\d*$/.test(raw)) return;
                                const stripped = raw.replace(/^0+(?=\d)/, '');
                                setQtyDisplays((prev) => ({ ...prev, [item.id]: stripped }));
                                updateItem(item.id, 'quantity', parseInt(stripped) || 0);
                            }}
                            onFocus={() =>
                                setQtyDisplays((prev) => ({
                                    ...prev,
                                    [item.id]: item.quantity === 0 ? '' : String(item.quantity),
                                }))
                            }
                            onBlur={() =>
                                setQtyDisplays((prev) => ({
                                    ...prev,
                                    [item.id]: item.quantity === 0 ? '' : String(item.quantity),
                                }))
                            }
                            placeholder="0"
                            className='w-2/12'
                        />

                        {/* Unit Price  */}
                        <Input
                            type="text"
                            value={priceDisplays[item.id] ?? formatPrice(item.price)}
                            onChange={(e) => {
                                const raw = e.target.value.replace(/,/g, '');
                                if (raw !== '' && !/^\d*\.?\d*$/.test(raw)) return;
                                const stripped = raw.replace(/^0+(?=\d)/, '');
                                setPriceDisplays((prev) => ({ ...prev, [item.id]: stripped }));
                                updateItem(item.id, 'price', parseFloat(stripped) || 0);
                            }}
                            onFocus={() =>
                                setPriceDisplays((prev) => ({
                                    ...prev,
                                    [item.id]: item.price === 0 ? '' : String(item.price),
                                }))
                            }
                            onBlur={() =>
                                setPriceDisplays((prev) => ({
                                    ...prev,
                                    [item.id]: formatPrice(item.price),
                                }))
                            }
                            placeholder="0"
                            className='w-3/12'
                        />

                        {/* Total Price*/}
                        <div className="w-3/12 pr-2">
                            <p className="font-medium text-base text-right">
                                ${calculateTotal(item).toFixed(2)}
                                <span className='text-textColor-muted'> USD</span>
                            </p>
                        </div>

                        {/* Delete Button */}
                        <button
                            onClick={() => deleteItem(item.id)}
                            className="text-red-500 hover:text-red-400 flex-shrink-0"
                        >
                            <Trash2 size={20} />
                        </button>
                    </div>
                ))}
            </div>
            {/* Add More Item Button */}
            <button
                onClick={addItem}
                className="flex items-center justify-center w-full gap-2 text-textColor-muted hover:text-primary-500 hover:bg-primary-100 text-base my-4 py-2 border border-dashed border-primary-100 rounded-md"
            >
                <Plus size={20} />
                <span>Add more item</span>
            </button>


            <div className='flex justify-between gap-6'>
                <div className="w-8/12 space-y-6 mt-4 ">
                    {/* Extra Notes Section */}
                    <TextEditorField
                        label={'EXTRA NOTES'}
                        name={'note'}
                        value={notes}
                        onChange={setNotes}
                        placeholder='Any note for your customer?'
                    />
                    {/* Attachment Section */}
                    <div className="space-y-4 mt-12">
                        <div className="flex justify-between items-center">
                            <h3 className="font-semibold text-xs tracking-wide">
                                ATTACHMENT
                            </h3>
                            <input 
                                type="file" 
                                ref={fileInputRef} 
                                className="hidden" 
                                multiple 
                                onChange={handleFileChange} 
                            />
                            <button 
                                onClick={() => fileInputRef.current?.click()}
                                className="text-primary-500  text-sm font-medium flex items-center gap-1"
                            >
                                <Plus size={16} />
                                Add
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {attachments.map((attachment) => {
                                const imgSrc = attachment.preview ?? (attachment.url && isImageUrl(attachment.url) ? attachment.url : undefined);
                                return (
                                    <div
                                        key={attachment.id}
                                        className="bg-surface-secondary border border-borderColor-secondary rounded-md overflow-hidden hover:border-slate-700 transition"
                                    >
                                        {imgSrc && (
                                            <a href={imgSrc} target="_blank" rel="noopener noreferrer" className="block">
                                                <img
                                                    src={imgSrc}
                                                    alt={attachment.name}
                                                    className="w-full h-32 object-cover"
                                                />
                                            </a>
                                        )}
                                        <div className="px-3 py-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2 min-w-0">
                                                {!imgSrc && (
                                                    <div className="bg-red-500 rounded p-1.5 flex-shrink-0">
                                                        <File size={16} color="#fff" />
                                                    </div>
                                                )}
                                                <div className="min-w-0">
                                                    {attachment.url ? (
                                                        <a href={attachment.url} target="_blank" rel="noopener noreferrer" className="font-medium text-primary-500 hover:underline text-sm truncate block">
                                                            {attachment.name}
                                                        </a>
                                                    ) : (
                                                        <p className="font-medium text-sm truncate">{attachment.name}</p>
                                                    )}
                                                    <p className="text-textColor-muted text-xs">{attachment.size}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => removeAttachment(attachment.id)}
                                                className="text-textColor-muted hover:text-textColor-base flex-shrink-0 ml-2"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Summary Section */}
                <div className="w-4/12 space-y-6">
                    <div className="rounded-lg pt-4 px-2 space-y-4">

                        <div className="border-t border-borderColor-secondary pt-4 flex justify-between items-center">
                            <span className="text-textColor">Total</span>
                            <span className="text-textColor text-lg font-semibold">
                                ${total.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
