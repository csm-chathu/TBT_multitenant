import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Req,
  ParseIntPipe,
  UsePipes,
  ValidationPipe,
  UseGuards,
} from '@nestjs/common';
import { NoteService } from '../services/note.service';
import { CreateNoteDto, UpdateNoteDto } from '../dto/note/note.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('notes')
export class NoteController {
  constructor(private readonly noteService: NoteService) {}

  @Get()
  async findAll(@Req() req: any, @Query('user_id') queryUserId?: string) {
    const authUserId = req.user?.userId ? Number(req.user.userId) : undefined;
    const filterUserId = queryUserId ? Number(queryUserId) : authUserId;
    return this.noteService.findAll(filterUserId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.noteService.findOne(id);
  }

  @Post()
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async create(@Req() req: any, @Body() createNoteDto: CreateNoteDto) {
    const authUserId = req.user?.userId ? Number(req.user.userId) : undefined;
    return this.noteService.create(createNoteDto, authUserId);
  }

  @Put(':id')
  @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body() updateNoteDto: UpdateNoteDto,
  ) {
    const authUserId = req.user?.userId ? Number(req.user.userId) : undefined;
    return this.noteService.update(id, updateNoteDto, authUserId);
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    return this.noteService.remove(id);
  }
}
