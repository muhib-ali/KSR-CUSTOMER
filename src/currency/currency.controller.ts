import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { CurrencyService, ConvertCurrencyDto } from './currency.service';

@ApiTags('Currency')
@Controller('currency')
export class CurrencyController {
  constructor(private readonly currencyService: CurrencyService) {}

  @Get('countries')
  @ApiOperation({ summary: 'Get all countries with their currencies' })
  @ApiResponse({
    status: 200,
    description: 'Countries retrieved successfully',
  })
  async getCountries() {
    return this.currencyService.getCountries();
  }

  @Get('rates/:baseCurrency')
  @ApiOperation({ summary: 'Get exchange rates for a base currency' })
  @ApiParam({ name: 'baseCurrency', description: 'Base currency code (e.g., USD, EUR)', type: String })
  @ApiResponse({
    status: 200,
    description: 'Exchange rates retrieved successfully',
  })
  async getExchangeRates(@Param('baseCurrency') baseCurrency: string) {
    return this.currencyService.getExchangeRates(baseCurrency.toUpperCase());
  }

  @Post('convert')
  @ApiOperation({ summary: 'Convert amount from one currency to another' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['amount', 'from', 'to'],
      properties: {
        amount: { type: 'number', example: 100 },
        from: { type: 'string', example: 'USD' },
        to: { type: 'string', example: 'PKR' },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Currency converted successfully',
    schema: {
      example: {
        statusCode: 200,
        status: true,
        message: 'Currency converted successfully',
        heading: 'Currency',
        data: {
          amount: 28000,
          rate: 280,
        },
      },
    },
  })
  async convertCurrency(@Body(ValidationPipe) convertDto: ConvertCurrencyDto) {
    return this.currencyService.convertCurrency({
      ...convertDto,
      from: convertDto.from.toUpperCase(),
      to: convertDto.to.toUpperCase(),
    });
  }
}
