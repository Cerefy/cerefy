import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateWorkspaceDto {
  @ApiProperty({ example: 'Strategy & Architecture' })
  @IsString()
  @IsNotEmpty()
  name!: string;

  @ApiProperty({ example: 'strategy-arch' })
  @IsString()
  @IsNotEmpty()
  slug!: string;

  @ApiProperty({ example: 'org-uuid-here' })
  @IsString()
  @IsNotEmpty()
  organizationId!: string;
}
