import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ExecuteAgentDto {
  @ApiProperty({ example: 'DiscoveryAgent', description: 'Name of registered agent' })
  @IsString()
  @IsNotEmpty()
  agentName!: string;

  @ApiProperty({ example: 'project-uuid-123' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ example: 'Extract scope and requirements for financial reporting migration' })
  @IsString()
  @IsNotEmpty()
  task!: string;

  @ApiPropertyOptional()
  @IsOptional()
  context?: any;
}
