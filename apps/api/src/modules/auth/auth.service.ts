import { Injectable } from '@nestjs/common';

@Injectable()
export class AuthService {
  async validateUser(email: string, password: string) {
    try {
      // Простая проверка для демо
      if (email === 'admin@algoritmika.demo' && password === 'admin123') {
        return {
          id: '1',
          email: 'admin@algoritmika.demo',
          tenantId: 'demo-tenant',
          role: 'ADMIN',
        };
      }
      return null;
    } catch (error) {
      console.error('validateUser error:', error);
      return null;
    }
  }

  async login(user: any) {
    try {
      // Простой JWT токен для демо
      const payload = {
        sub: user.id,
        email: user.email,
        tenantId: user.tenantId,
        role: user.role,
      };

      // В реальном проекте здесь будет JWT.sign()
      return {
        access_token: 'demo-token-' + Date.now(),
        user: {
          id: user.id,
          email: user.email,
          tenantId: user.tenantId,
          role: user.role,
        },
      };
    } catch (error) {
      console.error('login error:', error);
      throw error;
    }
  }
}