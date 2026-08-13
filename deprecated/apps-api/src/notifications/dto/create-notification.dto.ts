import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateNotificationDto {
  @ApiProperty({ example: 'user-uuid-here' })
  @IsString()
  @IsNotEmpty()
  recipientId!: string;

  @ApiProperty({ example: 'DECISION_REQUIRES_APPROVAL' })
  @IsString()
  @IsNotEmpty()
  type!: string;

  @ApiPropertyOptional({ example: { decisionId: 'dec-123', title: 'Architecture Decision' } })
  @IsOptional()
  payload?: any;
}
