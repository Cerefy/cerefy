import { IsNotEmpty, IsOptional, IsString, IsInt, Min, Max, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Status } from '@prisma/client';

export class CreateRequirementDto {
  @ApiProperty({ example: 'Automated Invoice Matching' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Extract line items from PDFs and match with POs' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'project-uuid-here' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiPropertyOptional({ example: 'PRD-Finance-v1.pdf' })
  @IsString()
  @IsOptional()
  sourceDocument?: string;

  @ApiPropertyOptional({ example: 1, minimum: 1, maximum: 5 })
  @IsInt()
  @Min(1)
  @Max(5)
  @IsOptional()
  priority?: number;

  @ApiPropertyOptional({ enum: Status, default: Status.ACTIVE })
  @IsEnum(Status)
  @IsOptional()
  status?: Status;
}
