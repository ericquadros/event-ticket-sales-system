import { IsArray, IsString, IsIn, IsEmail } from 'class-validator';
import { TicketKind } from '@prisma/client';

export class ReserveSpotDto {
  @IsArray()
  @IsString({ each: true })
  spots: string[];

  @IsString()
  @IsIn([TicketKind.full, TicketKind.half])
  ticket_kind: TicketKind;

  @IsEmail()
  email: string;
}
