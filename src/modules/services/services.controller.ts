import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Request, Query, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { ServicesService } from './services.service';
import { CreateServiceDto } from './dto/create-service.dto';
import { UpdateServiceDto } from './dto/update-service.dto';
import { QueryServiceDto } from './dto/query-service.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('services')
@Controller('services')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ServicesController {
  constructor(private readonly servicesService: ServicesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new service' })
  @ApiResponse({ status: 201, description: 'Service created successfully' })
  @ApiResponse({ status: 400, description: 'Validation Error' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async create(@Body() createServiceDto: CreateServiceDto, @Request() req: any) {
    return this.servicesService.create(req.user.userId, createServiceDto);
  }

  @Get()
  @ApiOperation({ summary: 'List services with pagination, filtering, and sorting' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved services' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async findAll(@Query() query: QueryServiceDto) {
    return this.servicesService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific service by ID' })
  @ApiResponse({ status: 200, description: 'Successfully retrieved service' })
  @ApiResponse({ status: 400, description: 'Invalid UUID' })
  @ApiResponse({ status: 404, description: 'Service Not Found' })
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.servicesService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an existing service' })
  @ApiResponse({ status: 200, description: 'Service updated successfully' })
  @ApiResponse({ status: 400, description: 'Validation Error' })
  @ApiResponse({ status: 403, description: 'Forbidden: You can only update your own services' })
  @ApiResponse({ status: 404, description: 'Service Not Found' })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateServiceDto: UpdateServiceDto,
    @Request() req: any,
  ) {
    return this.servicesService.update(id, req.user.userId, updateServiceDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a service' })
  @ApiResponse({ status: 200, description: 'Service deleted successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden: You can only delete your own services' })
  @ApiResponse({ status: 404, description: 'Service Not Found' })
  @ApiResponse({ status: 409, description: 'Conflict: Service has existing bookings' })
  async remove(@Param('id', ParseUUIDPipe) id: string, @Request() req: any) {
    await this.servicesService.remove(id, req.user.userId);
    return { deleted: true };
  }
}
