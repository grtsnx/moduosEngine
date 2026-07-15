import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class HandleResponseDto {
  @ApiProperty({ example: 200 })
  statusCode!: number;

  @ApiProperty({ example: 'OK' })
  statusType!: string;

  @ApiProperty({ example: 'Request completed successfully' })
  message!: string;

  @ApiPropertyOptional()
  data?: unknown;
}

export class AuthErrorResponseDto extends HandleResponseDto {
  @ApiProperty({ example: 400 })
  declare statusCode: number;

  @ApiProperty({ example: 'BAD_REQUEST' })
  declare statusType: string;

  @ApiProperty({ example: 'Invalid email or password' })
  declare message: string;
}
