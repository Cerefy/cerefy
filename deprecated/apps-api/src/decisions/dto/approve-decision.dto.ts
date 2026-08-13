import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ApproveDecisionDto {
  @ApiProperty({ example: 'APPROVED', description: 'APPROVED or REJECTED' })
  @IsString()
  @IsNotEmpty()
  status!: string;

  @ApiPropertyOptional({ example: 'Approved after security review' })
  @IsString()
  @IsOptional()
  comment?: string;
}
