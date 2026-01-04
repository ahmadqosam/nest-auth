import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { createPublicKey } from 'crypto';

@ApiTags('Discovery')
@Controller('.well-known')
export class JwksController {
  constructor(private config: ConfigService) {}

  @Get('jwks.json')
  @ApiOperation({ summary: 'Get JSON Web Key Set' })
  getJwks() {
    const publicKeyPem = Buffer.from(
      this.config.getOrThrow<string>('JWT_PUBLIC_KEY'),
      'base64',
    );

    const publicKey = createPublicKey(publicKeyPem);
    const jwk = publicKey.export({ format: 'jwk' });

    return {
      keys: [
        {
          ...jwk,
          use: 'sig',
          alg: 'RS256',
          kid: 'main-key',
        },
      ],
    };
  }
}
