import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProjectDto {
  @ApiProperty({ example: 'Enterprise Financial Automation' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiPropertyOptional({ example: 'AI implementation project for finance team' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'workspace-uuid-here' })
  @IsString()
  @IsNotEmpty()
  workspaceId!: string;
}
