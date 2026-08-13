import { IsNotEmpty, IsOptional, IsString, IsNumber } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateDecisionDto {
  @ApiProperty({ example: 'Adopt Microservices for Payment Gateway' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiPropertyOptional({ example: 'Evaluation of monolithic vs microservices architecture' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ example: 'project-uuid-here' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiPropertyOptional({ example: 'ArchitectureSynthesizerAgent' })
  @IsString()
  @IsOptional()
  agent?: string;

  @ApiPropertyOptional({ example: 'ARCHITECTURAL_SELECTION' })
  @IsString()
  @IsOptional()
  decisionType?: string;

  @ApiPropertyOptional({ example: 'High throughput requirement (>5000 tps)' })
  @IsString()
  @IsOptional()
  inputContext?: string;

  @ApiPropertyOptional({ example: 'Recommend event-driven NestJS service on K8s' })
  @IsString()
  @IsOptional()
  aiOutput?: string;

  @ApiPropertyOptional({ example: 0.94 })
  @IsNumber()
  @IsOptional()
  confidenceScore?: number;

  @ApiPropertyOptional({ example: 'MEDIUM' })
  @IsString()
  @IsOptional()
  riskLevel?: string;
}
