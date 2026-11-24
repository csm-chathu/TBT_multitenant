import { Injectable } from '@nestjs/common';
import { LambdaClient, InvokeCommand } from '@aws-sdk/client-lambda';
import { TicketRepository } from '../repositories/ticket.repository';
import { TicketResourceRepository } from '../repositories/ticket-resource.repository';
import { TicketCommentRepository } from '../repositories/ticket-comment.repository';

@Injectable()
export class TicketSuggestionService {
  private lambdaClient: LambdaClient;

  constructor (
    private readonly ticketRepository: TicketRepository,
    private readonly ticketResourceRepository: TicketResourceRepository,
    private readonly ticketCommentRepository: TicketCommentRepository,
  ) {
    this.lambdaClient = new LambdaClient({
      region: process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      },
    });
  }

  private collectResources(ticketResources: any[], comments: any[]) {
    const images: string[] = [];
    const documents: string[] = [];
    const seenPaths = new Set<string>();

    const addFile = (filePath?: string, mimeType?: string) => {
      if (!filePath || seenPaths.has(filePath)) return;
      seenPaths.add(filePath);

      const s3Url = filePath.startsWith('s3://') 
        ? filePath 
        : `s3://${process.env.AWS_BUCKET}/${filePath.replace(/^\//, '')}`;

      const mime = (mimeType || '').toLowerCase();
      const ext = filePath.split('.').pop()?.toLowerCase() || '';

      const isImage = mime.includes('image') || ['png', 'jpg', 'jpeg', 'gif', 'webp', 'bmp'].includes(ext);

      if (isImage) {
        images.push(s3Url);
      } else {
        documents.push(s3Url);
      }
    };

    // 1. Collect primary ticket resources
    if (ticketResources && Array.isArray(ticketResources)) {
      ticketResources.forEach((res) => {
        addFile(res.file_path, res.file_mime_type);
      });
    }

    // 2. Collect resources attached inside ticket comments
    if (comments && Array.isArray(comments)) {
      comments.forEach((c) => {
        if (c.resources) {
          try {
            const parsed = typeof c.resources === 'string' ? JSON.parse(c.resources) : c.resources;
            if (parsed && Array.isArray(parsed.media_files)) {
              parsed.media_files.forEach((media: any) => {
                addFile(media.file_path, media.file_mime_type);
              });
            }
          } catch (e) {
            // Ignore JSON parse errors for comment resources
          }
        }
      });
    }

    return { images, documents };
  }

  async generateSuggestionBody(id: number) {
    const ticket = await this.ticketRepository.findOne(id);
    if (!ticket) return null;
    const resources = await this.ticketResourceRepository.findByTicketId(id);
    const comments = await this.ticketCommentRepository.findByTicketId(id);

    const title = (ticket as any).title || ticket.dataValues?.title || '';
    const body = (ticket as any).body || ticket.dataValues?.body || '';

    let promptText = `Analyze the following support ticket issue, attached files, and comments, and generate a concise, numbered step-by-step resolution guide (maximum 3-4 steps, 1-2 sentences per step). ` +
      `You MUST format the answer with numbered steps (e.g. "### Step 1: [Action]", "### Step 2: [Action]"). Keep each step short, clear, and direct. Do NOT include generic dictionary definitions or theory.\n\n` +
      `Ticket Title: ${title}\n` +
      `Ticket Description: ${body}`;

    if (comments && comments.length > 0) {
      const commentTexts = comments
        .map((c, index) => {
          const text = (c as any).comment || c.comment || (c as any).remarks || '';
          return text.trim() ? `Comment ${index + 1}: ${text.trim()}` : null;
        })
        .filter(Boolean);

      if (commentTexts.length > 0) {
        promptText += `\n\nExisting Ticket Comments / Discussion:\n` + commentTexts.join('\n');
      }
    }

    const { images, documents } = this.collectResources(resources, comments);

    const suggestionObject = {
      "prompt": promptText,
      "image": images,
      "document": documents
    };

    return suggestionObject;
  }

  async generateChatBody(id: number, userMessage: string, history?: Array<{ sender: 'user' | 'assistant', message: string }>) {
    const ticket = await this.ticketRepository.findOne(id);
    if (!ticket) return null;
    const resources = await this.ticketResourceRepository.findByTicketId(id);
    const comments = await this.ticketCommentRepository.findByTicketId(id);

    const title = (ticket as any).title || ticket.dataValues?.title || '';
    const body = (ticket as any).body || ticket.dataValues?.body || '';

    let promptText = `You are an AI support assistant engaged in a conversation with a technician/user about the following ticket.\n` +
      `Analyze the ticket, attached files, and discussion history, and provide concise, structured guidance (3-4 short numbered steps max) in Markdown format.\n\n` +
      `Ticket Title: ${title}\n` +
      `Ticket Description: ${body}`;

    if (comments && comments.length > 0) {
      const commentTexts = comments
        .map((c, index) => {
          const text = (c as any).comment || c.comment || (c as any).remarks || '';
          return text.trim() ? `Comment ${index + 1}: ${text.trim()}` : null;
        })
        .filter(Boolean);

      if (commentTexts.length > 0) {
        promptText += `\n\nExisting Ticket Comments:\n` + commentTexts.join('\n');
      }
    }

    if (history && history.length > 0) {
      promptText += `\n\nPrevious Conversation History:\n` + history.map(h => `${h.sender === 'user' ? 'User' : 'Assistant'}: ${h.message}`).join('\n');
    }

    promptText += `\n\nUser Question/Instruction: ${userMessage}`;

    const { images, documents } = this.collectResources(resources, comments);

    const suggestionObject = {
      "prompt": promptText,
      "image": images,
      "document": documents
    };

    return suggestionObject;
  }

  async invokeLambda(payload: any) {
    const command = new InvokeCommand({
      FunctionName: process.env.LAMBDA_FUNCTION_NAME,
      InvocationType: 'RequestResponse',
      Payload: Buffer.from(JSON.stringify(payload)),
    });

    const response = await this.lambdaClient.send(command);

    return JSON.parse(
      new TextDecoder().decode(response.Payload)
    );
  }
}
