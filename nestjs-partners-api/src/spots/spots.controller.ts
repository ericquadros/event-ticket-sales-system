import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { SpotsService } from './spots.service';
import { CreateSpotDto } from './dto/create-spot.dto';
import { UpdateSpotDto } from './dto/update-spot.dto';

@Controller('events/:eventId/spots')
export class SpotsController {
  constructor(private readonly spotsService: SpotsService) {}

  @Post()
  @UsePipes(new ValidationPipe({ errorHttpStatusCode: 422 }))
  create(
    @Body() createSpotRequest: CreateSpotDto,
    @Param('eventId') eventId: string,
  ) {
    return this.spotsService.create({
      ...createSpotRequest,
      eventId,
    });
  }

  @Get()
  findAll(@Param('eventId') eventId: string) {
    return this.spotsService.findAll(eventId);
  }

  @Get(':spotId')
  findOne(@Param('spotId') spotId: string, @Param('eventId') eventId: string) {
    return this.spotsService.findOne(eventId, spotId);
  }

  @Patch(':spotId')
  update(
    @Param('spotId') spotId: string,
    @Param('eventId') eventId: string,
    @Body() updateSpotRequest: UpdateSpotDto,
  ) {
    return this.spotsService.update(eventId, spotId, updateSpotRequest);
  }

  @Delete(':spotId')
  remove(@Param('spotId') spotId: string, @Param('eventId') eventId: string) {
    return this.spotsService.remove(eventId, spotId);
  }
}
