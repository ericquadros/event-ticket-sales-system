import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private configService: ConfigService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const token = request.headers['x-api-token'];

    console.log('env API_TOKEN: ', this.configService.get('API_TOKEN'));
    console.log('header API_TOKEN: ', token);
    return token === this.configService.get('API_TOKEN');
  }
}
