import { IsString, IsNotEmpty, Length, IsInt, Min } from 'class-validator';

export class CreateUserDto {
  @IsInt()
  @Min(1)
  id!: number;

  @IsString()
  @IsNotEmpty()
  @Length(1, 100)
  name!: string;
}
