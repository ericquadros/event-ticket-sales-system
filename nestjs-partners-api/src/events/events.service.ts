import { BadRequestException, Injectable } from '@nestjs/common';
import { CreateEventDto } from './dto/create-event.dto';
import { UpdateEventDto } from './dto/update-event.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { ReserveSpotDto } from './dto/reserve-spot.dto';
import { Prisma, SpotStatus, TicketStatus } from '@prisma/client';

@Injectable()
export class EventsService {
  constructor(private prismaService: PrismaService) {}

  create(createEventDto: CreateEventDto) {
    return this.prismaService.event.create({
      data: {
        ...createEventDto,
        date: new Date(createEventDto.date),
      },
    });
  }

  findAll() {
    return this.prismaService.event.findMany();
  }

  findOne(id: string) {
    return this.prismaService.event.findUnique({
      where: { id },
    });
  }

  update(id: string, updateEventDto: UpdateEventDto) {
    return this.prismaService.event.update({
      data: {
        ...updateEventDto,
        date: new Date(updateEventDto.date),
      },
      where: { id },
    });
  }

  remove(id: string) {
    return this.prismaService.event.delete({
      where: { id },
    });
  }

  async reserveSpot(dto: ReserveSpotDto & { eventId: string }) {
    const { eventId, spots, ticket_kind, email } = dto;

    // Verifica se todos os spots são válidos
    const foundSpots = await this.prismaService.spot.findMany({
      where: {
        eventId,
        name: {
          in: spots,
        },
      },
    });

    if (foundSpots.length !== spots.length) {
      const foundSpotNames = foundSpots.map((spot) => spot.name);
      const invalidSpots = spots.filter(
        (spot) => !foundSpotNames.includes(spot),
      );
      throw new BadRequestException(
        `Spots ${invalidSpots.join(', ')} not found`,
      );
    }

    // Verifica se ticket_kind é 'full' ou 'half'
    if (!['full', 'half'].includes(ticket_kind)) {
      throw new BadRequestException(
        `Invalid ticket_kind. Must be 'full' or 'half'.`,
      );
    }

    try {
      const reservedTickets = await this.prismaService.$transaction(
        async (prisma) => {
          // Cria histórico de reserva para cada spot encontrado
          await prisma.reservationHistory.createMany({
            data: foundSpots.map((spot) => ({
              spotId: spot.id,
              ticketKind: ticket_kind,
              email,
              status: TicketStatus.reserved,
            })),
          });

          // Atualiza status dos spots para 'reserved'
          await prisma.spot.updateMany({
            where: {
              id: {
                in: foundSpots.map((spot) => spot.id),
              },
            },
            data: {
              status: SpotStatus.reserved,
            },
          });

          // Cria os tickets individuais
          const createdTickets = await Promise.all(
            foundSpots.map((spot) =>
              prisma.ticket.create({
                data: {
                  spotId: spot.id,
                  ticketKind: ticket_kind,
                  email,
                },
              }),
            ),
          );

          return createdTickets;
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted },
      );

      return reservedTickets;
    } catch (error) {
      // Captura erros específicos do Prisma
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        switch (error.code) {
          case 'P2002': // violação de constraint única
          case 'P2034': // conflito de transação
            throw new BadRequestException('Some spots are already reserved');
          default:
            throw new Error(error.message);
        }
      }

      throw new Error(error.message);
    }
  }
}
