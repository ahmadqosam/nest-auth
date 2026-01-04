import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { JwtPayload } from './auth/strategy/jwt.strategy';

@Controller()
export class AppController {
  constructor() {}
  @UseGuards(AuthGuard('jwt'))
  @Get('profile')
  getProfile(@Req() req: { user: JwtPayload }) {
    return req.user;
  }
}
