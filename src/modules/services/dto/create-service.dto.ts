import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsPositive,
  IsNumber,
  IsOptional,
  MinLength,
  MaxLength,
  IsBoolean,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateServiceDto {
  @ApiProperty({
    example: 'Deep Tissue Massage',
    description: 'Title of the service',
  })
  @IsString()
  @IsNotEmpty()
  @MinLength(3)
  @MaxLength(100)
  title: string;

  @ApiPropertyOptional({
    example: 'A relaxing deep tissue massage.',
    description: 'Detailed description',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiProperty({ example: 60, description: 'Duration in minutes' })
  @IsInt()
  @IsPositive()
  duration: number;

  @ApiProperty({ example: 89.99, description: 'Price of the service in USD' })
  @IsNumber({ maxDecimalPlaces: 2 })
  @IsPositive()
  price: number;

  @ApiPropertyOptional({
    example: true,
    description: 'Whether the service is active and bookable',
  })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
