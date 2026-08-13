import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RefreshTokenDto {
  @ApiProperty({ description: 'Valid JWT refresh token' })
  @IsString()
  @IsNotEmpty()
  refreshToken!: string;
}
