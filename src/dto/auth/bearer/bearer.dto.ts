import { ApiProperty } from '@nestjs/swagger';

import { HandleResponseDto } from '../../common/handle/response.dto';
import { SAMPLE_BEARER_TOKEN } from '../samples';

export const SAMPLE_BEARER_TOKEN_RESPONSE = {
  statusCode: 200,
  statusType: 'OK',
  message: 'Request completed successfully',
  data: { token: SAMPLE_BEARER_TOKEN },
} as const;

export class BearerTokenResponseDto extends HandleResponseDto {
  @ApiProperty({ example: SAMPLE_BEARER_TOKEN_RESPONSE.data })
  declare data: { token: string };
}
