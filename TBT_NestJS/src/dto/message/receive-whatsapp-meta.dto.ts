export interface WhatsAppMetaTextMessage {
  body: string;
}

export interface WhatsAppMetaMediaMessage {
  id: string;        // Media ID — must be fetched via Graph API
  mime_type: string;
  sha256?: string;
  caption?: string;
}

export interface WhatsAppMetaMessage {
  from: string;      // Sender's WhatsApp number (wa_id)
  id: string;        // Message ID (wamid.xxx)
  timestamp: string;
  type: 'text' | 'image' | 'document' | 'audio' | 'video' | 'sticker' | 'unknown';
  text?: WhatsAppMetaTextMessage;
  image?: WhatsAppMetaMediaMessage;
  document?: WhatsAppMetaMediaMessage;
  audio?: WhatsAppMetaMediaMessage;
  video?: WhatsAppMetaMediaMessage;
}

export interface WhatsAppMetaContact {
  profile: { name: string };
  wa_id: string;
}

export interface WhatsAppMetaMetadata {
  display_phone_number: string;   // Business phone number (the "To")
  phone_number_id: string;        // Needed to send replies via Graph API
}

export interface WhatsAppMetaValue {
  messaging_product: string;
  metadata: WhatsAppMetaMetadata;
  contacts?: WhatsAppMetaContact[];
  messages?: WhatsAppMetaMessage[];
}

export interface WhatsAppMetaChange {
  value: WhatsAppMetaValue;
  field: string;
}

export interface WhatsAppMetaEntry {
  id: string;
  changes: WhatsAppMetaChange[];
}

export class WhatsAppMetaWebhookDto {
  object: string;
  entry: WhatsAppMetaEntry[];
}
