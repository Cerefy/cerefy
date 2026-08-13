import { IsNotEmpty, IsOptional, IsString, IsArray } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class RunPipelineDto {
  @ApiProperty({ example: 'project-uuid-123' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ example: 'Synthesize architecture and generate user stories for claims processing' })
  @IsString()
  @IsNotEmpty()
  initialTask!: string;

  @ApiPropertyOptional({ example: ['DiscoveryAgent', 'BusinessAnalystAgent', 'SolutionArchitectAgent', 'GovernanceAgent'] })
  @IsArray()
  @IsOptional()
  pipelineSequence?: string[];
}
