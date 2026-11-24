import { Injectable, BadRequestException, ConflictException } from "@nestjs/common"
import { CannedReply } from "../models/canned_reply"
import { CannedReplyVerification } from "../models/canned_reply_verification"
import { CreateCannedReplyDto, UpdateCannedReplyDto } from "../dto/canned-reply/canned-reply.dto"

const REQUIRED_VERIFICATIONS = 2

@Injectable()
export class CannedReplyRepository {
  findAll(applicationId?: number, all = false) {
    const where: any = {}
    if (applicationId) where.application_id = applicationId
    if (!all) where.status = 'approved'
    return CannedReply.findAll({ where })
  }

  findAllForManagement(applicationId?: number) {
    const where: any = {}
    if (applicationId) where.application_id = applicationId
    return CannedReply.findAll({ where })
  }

  findOne(id: number) {
    return CannedReply.findByPk(id)
  }

  create(dto: CreateCannedReplyDto) {
    return CannedReply.create({ ...(dto as any), status: 'pending', verification_count: 0 })
  }

  async update(id: number, dto: UpdateCannedReplyDto) {
    const item = await CannedReply.findByPk(id)
    if (!item) return null
    return item.update(dto)
  }

  async remove(id: number) {
    const item = await CannedReply.findByPk(id)
    if (!item) return null
    return item.destroy()
  }

  async verify(cannedReplyId: number, userId: number) {
    const reply = await CannedReply.findByPk(cannedReplyId)
    if (!reply) throw new BadRequestException('Canned reply not found')
    if (reply.status === 'approved') throw new BadRequestException('Already approved')

    const existing = await CannedReplyVerification.findOne({
      where: { canned_reply_id: cannedReplyId, user_id: userId },
    })
    if (existing) throw new ConflictException('You have already verified this canned reply')

    await CannedReplyVerification.create({ canned_reply_id: cannedReplyId, user_id: userId })

    const newCount = reply.verification_count + 1
    const newStatus = newCount >= REQUIRED_VERIFICATIONS ? 'approved' : 'pending'
    return reply.update({ verification_count: newCount, status: newStatus })
  }
}
