import { IsNotEmpty, IsString, IsUrl } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateDocumentDto {
  @ApiProperty({ example: 'Architecture Blueprint v2' })
  @IsString()
  @IsNotEmpty()
  title!: string;

  @ApiProperty({ example: 'project-uuid-here' })
  @IsString()
  @IsNotEmpty()
  projectId!: string;

  @ApiProperty({ example: 'https://storage.enterprise.com/docs/blueprint-v2.pdf' })
  @IsUrl()
  @IsNotEmpty()
  url!: string;
}
