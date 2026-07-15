import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsUrl, MinLength } from 'class-validator';

import { HandleResponseDto } from '../../common/handle/response.dto';
import { SAMPLE_USER } from '../../auth/samples';

export class UpdateUserRequestDto {
  @ApiPropertyOptional({ example: 'Alex' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  firstName?: string;

  @ApiPropertyOptional({ example: 'Example' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  lastName?: string;

  @ApiPropertyOptional({ example: 'https://www.gravatar.com/avatar/example' })
  @IsOptional()
  @IsUrl()
  image?: string;
}

export const SAMPLE_UPDATE_USER_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Request completed successfully',
  data: { user: SAMPLE_USER },
} as const;

export class UpdateUserResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_UPDATE_USER_RESPONSE.data })
  declare data: { user: typeof SAMPLE_USER };
}
