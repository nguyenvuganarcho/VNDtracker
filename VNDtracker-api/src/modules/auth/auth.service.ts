import bcrypt from 'bcrypt';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthRepository } from './auth.repo';
import {
  RegisterRequestDto,
  LoginRequestDto,
  ChangePasswordRequestDto,
  AuthResponseDto,
  UserResponseDto,
  TokenPayload,
  User,
} from './auth.dto';
import { ConflictError, UnauthorizedError } from '../../common/errors';

export class AuthService {
  private repo: AuthRepository;
  private saltRounds = 10;
  private jwtSecret: string;
  private tokenExpiry: SignOptions['expiresIn'];

  constructor() {
    this.repo = new AuthRepository();
    this.jwtSecret = process.env.JWT_SECRET || 'fallback-secret';
    this.tokenExpiry = (process.env.JWT_EXPIRES_IN || '7d') as SignOptions['expiresIn'];
  }

  private toUserResponseDto(user: User): UserResponseDto {
    return {
      userId: user.userId,
      email: user.email,
      name: user.name,
    };
  }

  private generateToken(user: User): string {
    const payload: TokenPayload = {
      userId: user.userId,
      email: user.email,
      name: user.name,
    };

    return jwt.sign(payload, this.jwtSecret, { expiresIn: this.tokenExpiry });
  }

  async register(dto: RegisterRequestDto): Promise<AuthResponseDto> {
    const existing = await this.repo.findByEmail(dto.email);
    if (existing) {
      throw new ConflictError('Email already registered');
    }

    const passwordHash = await bcrypt.hash(dto.password, this.saltRounds);
    const user = await this.repo.create(dto.email, passwordHash, dto.name);

    return {
      accessToken: this.generateToken(user),
      user: this.toUserResponseDto(user),
    };
  }

  async login(dto: LoginRequestDto): Promise<AuthResponseDto> {
    const user = await this.repo.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials');
    }

    return {
      accessToken: this.generateToken(user),
      user: this.toUserResponseDto(user),
    };
  }

  async changePassword(userId: number, dto: ChangePasswordRequestDto): Promise<void> {
    const user = await this.repo.findById(userId);
    if (!user) {
      throw new UnauthorizedError('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!isCurrentPasswordValid) {
      throw new UnauthorizedError('Current password is incorrect');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, this.saltRounds);
    await this.repo.updatePassword(userId, newPasswordHash);
  }
}
