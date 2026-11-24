import { Injectable } from "@nestjs/common"
import { CannedReplyRepository } from "../repositories/canned-reply.repository"
import { CreateCannedReplyDto, UpdateCannedReplyDto } from "../dto/canned-reply/canned-reply.dto"

@Injectable()
export class CannedReplyService {
  constructor(private readonly repo: CannedReplyRepository) {}

  findAll(applicationId?: number) {
    return this.repo.findAll(applicationId)
  }

  findAllForManagement(applicationId?: number) {
    return this.repo.findAllForManagement(applicationId)
  }

  verify(cannedReplyId: number, userId: number) {
    return this.repo.verify(cannedReplyId, userId)
  }

  findOne(id: number) {
    return this.repo.findOne(id)
  }

  create(dto: CreateCannedReplyDto) {
    return this.repo.create(dto)
  }

  update(id: number, dto: UpdateCannedReplyDto) {
    return this.repo.update(id, dto)
  }

  remove(id: number) {
    return this.repo.remove(id)
  }
}
