import bcrypt from 'bcrypt';
import crypto from 'crypto';
import jwt, { SignOptions } from 'jsonwebtoken';
import { AuthRepository } from './auth.repo';
import {
  RegisterRequestDto,
  LoginRequestDto,
  ChangePasswordRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
  AuthResponseDto,
  UserResponseDto,
  TokenPayload,
  User,
} from './auth.dto';
import { ConflictError, UnauthorizedError } from '../../common/errors';
import { sendPasswordResetEmail } from '../../config/email';
import { getJwtSecret } from '../../config/jwt';

const RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

export class AuthService {
  private repo: AuthRepository;
  private saltRounds = 10;
  private jwtSecret: string;
  private tokenExpiry: SignOptions['expiresIn'];

  constructor() {
    this.repo = new AuthRepository();
    this.jwtSecret = getJwtSecret();
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

  // Always resolves without revealing whether the email is registered --
  // the response to the client is identical either way (see controller).
  async forgotPassword(dto: ForgotPasswordRequestDto): Promise<void> {
    const user = await this.repo.findByEmail(dto.email);
    if (!user) {
      return;
    }

    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiry = new Date(Date.now() + RESET_TOKEN_TTL_MS);

    await this.repo.setResetToken(user.userId, tokenHash, expiry);

    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetLink = `${frontendUrl}/reset-password?token=${rawToken}`;
    await sendPasswordResetEmail(user.email, resetLink);
  }

  async resetPassword(dto: ResetPasswordRequestDto): Promise<void> {
    const tokenHash = crypto.createHash('sha256').update(dto.token).digest('hex');
    const user = await this.repo.findByValidResetTokenHash(tokenHash);
    if (!user) {
      throw new UnauthorizedError('Invalid or expired reset link');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, this.saltRounds);
    await this.repo.resetPassword(user.userId, newPasswordHash);
  }
}
