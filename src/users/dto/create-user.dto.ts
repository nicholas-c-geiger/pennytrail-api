import { IsEmail, IsString, IsNotEmpty, Length } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string;

  @IsEmail()
  @IsNotEmpty()
  @Length(5, 255)
  email!: string;
}
