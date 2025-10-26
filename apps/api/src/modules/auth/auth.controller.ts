import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';

export class LoginDto {
  email: string;
  password: string;
}

export class RegisterDto {
  email: string;
  password: string;
  name?: string;
}

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto) {
    // Простая проверка без сложной логики
    if (loginDto.email === 'admin@algoritmika.demo' && loginDto.password === 'admin123') {
      return {
        success: true,
        access_token: 'demo-token-' + Date.now(),
        user: {
          id: '1',
          email: 'admin@algoritmika.demo',
          tenantId: 'demo-tenant',
          role: 'ADMIN',
        },
      };
    }
    
    return {
      success: false,
      message: 'Invalid credentials',
    };
  }

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() registerDto: RegisterDto) {
    // Простая регистрация для демо
    return {
      success: true,
      message: 'Registration endpoint (demo mode)',
      user: {
        id: 'new-user-' + Date.now(),
        email: registerDto.email,
        tenantId: 'demo-tenant',
        role: 'USER',
      },
    };
  }
}