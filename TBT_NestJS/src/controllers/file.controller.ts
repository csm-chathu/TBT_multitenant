import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common'
import { Response } from 'express'
import { join, resolve } from 'path'
import { existsSync, createReadStream } from 'fs'
import { sanitizeFilename } from '../util/helper/upload.helper'

@Controller('files')
export class FileController {
  @Get('download/:name')
  async download(@Param('name') name: string, @Res() res: Response) {
    const filename = sanitizeFilename(name)

    // prefer the hardcoded absolute path /opt-in-doc, otherwise fallback to bundled assets
    const preferred = '/opt-in-doc'
    const candidatePaths = [
      resolve(preferred, filename),
      join(process.cwd(), 'src', 'assets', 'download', filename),
    ]

    let filePath: string | null = null
    for (const p of candidatePaths) {
      if (existsSync(p)) {
        filePath = p
        break
      }
    }

    if (!filePath) {
      throw new NotFoundException('File not found')
    }

    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)

    const stream = createReadStream(filePath)
    stream.pipe(res)
  }
}
