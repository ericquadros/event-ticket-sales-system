import { AuthGuard } from './auth.guard';
import { ConfigService } from '@nestjs/config';

describe('AuthGuard', () => {
  let authGuard: AuthGuard;
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
    jest.spyOn(configService, 'get').mockReturnValue('mocked_api_token');
    authGuard = new AuthGuard(configService);
  });

  it('should be defined', () => {
    expect(authGuard).toBeDefined();
  });

  // Outros testes para AuthGuard
});
