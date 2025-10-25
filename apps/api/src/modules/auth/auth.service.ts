import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { prisma } from '@algor/db';
import { SignupDto, LoginDto } from './dto';

@Injectable()
export class AuthService {
  constructor(private jwtService: JwtService) {}

  async signup(dto: SignupDto) {
    // 1. Создать тенант
    const tenant = await prisma.tenant.create({
      data: {
        name: dto.tenantName,
      },
    });

    // 2. Создать пользователя-владельца
    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const user = await prisma.user.create({
      data: {
        tenantId: tenant.id,
        email: dto.email,
        password: hashedPassword,
        role: 'OWNER',
      },
    });

    const tokens = this.generateTokens(user.id, user.tenantId, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenant.id,
        tenantName: tenant.name,
      },
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    // Найти пользователя
    const user = await prisma.user.findFirst({
      where: { email: dto.email },
      include: { tenant: true },
    });

    if (!user) {
      throw new UnauthorizedException('Неверные учетные данные');
    }

    // Проверить пароль
    const passwordValid = await bcrypt.compare(dto.password, user.password);
    if (!passwordValid) {
      throw new UnauthorizedException('Неверные учетные данные');
    }

    // Проверить статус тенанта
    if (user.tenant.status !== 'ACTIVE') {
      throw new UnauthorizedException('Аккаунт заблокирован');
    }

    const tokens = this.generateTokens(user.id, user.tenantId, user.role);

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: user.tenantId,
        tenantName: user.tenant.name,
      },
      ...tokens,
    };
  }

  private generateTokens(userId: string, tenantId: string, role: string) {
    const payload = { sub: userId, tenantId, role };

    return {
      accessToken: this.jwtService.sign(payload),
      refreshToken: this.jwtService.sign(payload, {
        expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
      }),
    };
  }

  async validateUser(userId: string) {
    return prisma.user.findUnique({
      where: { id: userId },
      include: { tenant: true },
    });
  }
}

