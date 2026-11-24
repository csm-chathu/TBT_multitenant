import { Injectable } from '@nestjs/common';
import { CreateNoteDto, UpdateNoteDto } from '../dto/note/note.dto';
import { Note, User } from '../models';

@Injectable()
export class NoteRepository {
  async findAll(userId?: number) {
    const where: any = {};
    if (userId) {
      where.user_id = userId;
    }

    return await Note.findAll({
      where,
      order: [['updatedAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }

  async findOne(id: number) {
    return await Note.findByPk(id, {
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['id', 'name', 'email'],
        },
      ],
    });
  }

  async create(data: CreateNoteDto) {
    return await Note.create(data);
  }

  async update(id: number, data: UpdateNoteDto) {
    const note = await Note.findByPk(id);
    if (!note) {
      throw new Error('Note not found');
    }
    return await note.update(data);
  }

  async remove(id: number) {
    const note = await Note.findByPk(id);
    if (!note) {
      throw new Error('Note not found');
    }
    return await note.destroy();
  }
}
