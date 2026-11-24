import { Controller, Get, Post, Body, Param, ParseIntPipe, NotFoundException } from '@nestjs/common';
import { TicketSuggestionService } from '../services/ticket-suggestion.service';

@Controller('ticket/:ticketId/suggestion')
export class TicketSuggestionController {
  constructor(private readonly TicketSuggestionService: TicketSuggestionService) {}

  @Get('call')
  async callLambda(@Param('ticketId', ParseIntPipe) ticketId: number) {
    const suggestionBody = await this.TicketSuggestionService.generateSuggestionBody(ticketId);
    if (!suggestionBody) {
        throw new NotFoundException(`Ticket suggestion not found`);
    }
    const suggestion = await this.TicketSuggestionService.invokeLambda(suggestionBody);
    return suggestion;
  }

  @Post('chat')
  async chatLambda(
    @Param('ticketId', ParseIntPipe) ticketId: number,
    @Body() body: { userMessage: string; history?: Array<{ sender: 'user' | 'assistant'; message: string }> },
  ) {
    const chatBody = await this.TicketSuggestionService.generateChatBody(ticketId, body.userMessage, body.history);
    if (!chatBody) {
      throw new NotFoundException(`Ticket not found`);
    }
    const response = await this.TicketSuggestionService.invokeLambda(chatBody);
    return response;
  }
}