import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
    constructor(config: ConfigService) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: Buffer.from(
                config.getOrThrow<string>('JWT_PUBLIC_KEY'),
                'base64'
            ),
            algorithms: ['RS256'],
        })
    }

    async validate(payload: any) {
        return { userId: payload.sub, email: payload.email, roles: payload.roles };
    }
}