import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class IngestDocumentDto {
  @ApiProperty({ example: 'doc-uuid-123' })
  @IsString()
  @IsNotEmpty()
  documentId!: string;

  @ApiProperty({ example: 'Raw content of enterprise PRD document containing stakeholders, system dependencies, and SLA rules.' })
  @IsString()
  @IsNotEmpty()
  rawText!: string;
}
