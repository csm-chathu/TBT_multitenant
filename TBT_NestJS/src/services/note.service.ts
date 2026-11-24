import { Injectable, NotFoundException } from '@nestjs/common';
import { NoteRepository } from '../repositories/note.repository';
import { CreateNoteDto, UpdateNoteDto } from '../dto/note/note.dto';

@Injectable()
export class NoteService {
  constructor(private readonly noteRepository: NoteRepository) {}

  async findAll(userId?: number) {
    return await this.noteRepository.findAll(userId);
  }

  async findOne(id: number) {
    const note = await this.noteRepository.findOne(id);
    if (!note) {
      throw new NotFoundException(`Note with ID ${id} not found`);
    }
    return note;
  }

  async create(createNoteDto: CreateNoteDto, userId?: number) {
    if (userId && !createNoteDto.user_id) {
      createNoteDto.user_id = userId;
    }
    return await this.noteRepository.create(createNoteDto);
  }

  async update(id: number, updateNoteDto: UpdateNoteDto, userId?: number) {
    await this.findOne(id);
    return await this.noteRepository.update(id, updateNoteDto);
  }

  async remove(id: number) {
    await this.findOne(id);
    await this.noteRepository.remove(id);
    return { success: true };
  }
}
