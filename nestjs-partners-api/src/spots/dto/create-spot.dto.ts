import { IsString, MaxLength } from 'class-validator';

export class CreateSpotDto {
  @IsString()
  @MaxLength(255)
  name: string;
}
