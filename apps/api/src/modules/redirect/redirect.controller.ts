import { Controller, Get, Param, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiExcludeEndpoint } from '@nestjs/swagger';
import { FastifyReply } from 'fastify';
import { RedirectService } from './redirect.service';

@ApiTags('redirect')
@Controller('r')
export class RedirectController {
  constructor(private redirectService: RedirectService) {}

  @Get(':messageId/:slug')
  @ApiExcludeEndpoint()
  async redirect(
    @Param('messageId') messageId: string,
    @Param('slug') slug: string,
    @Res() reply: FastifyReply,
  ) {
    const targetUrl = await this.redirectService.trackAndRedirect(messageId, slug);
    
    if (targetUrl) {
      reply.code(302).redirect(targetUrl);
    } else {
      reply.code(404).send({ error: 'Link not found' });
    }
  }
}

