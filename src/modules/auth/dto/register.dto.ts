import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MaxLength,
  IsStrongPassword,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class RegisterDto {
  @ApiProperty({ example: 'John Doe', description: 'Full name of the user' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  fullName: string;

  @ApiProperty({
    example: 'user@example.com',
    description: 'Unique email address',
  })
  @IsEmail()
  @Transform(({ value }) => value?.toLowerCase())
  email: string;

  @ApiProperty({
    example: 'StrongP@ssw0rd!',
    description:
      'Password (min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 symbol)',
  })
  @IsString()
  @MaxLength(50)
  @IsStrongPassword()
  password: string;
}
