import { Injectable, BadRequestException } from '@nestjs/common';
import { ResponseHelper } from '../common/helpers/response.helper';
import { ApiResponse } from '../common/interfaces/api-response.interface';

export interface Country {
  name: {
    common: string;
    official: string;
  };
  cca2: string; // Country code (e.g., "PK", "US")
  currencies: {
    [key: string]: {
      name: string;
      symbol: string;
    };
  };
}

export interface ExchangeRateResponse {
  rates: {
    [currency: string]: number;
  };
  base: string;
  date: string;
}

export interface ConvertCurrencyDto {
  amount: number;
  from: string;
  to: string;
}

@Injectable()
export class CurrencyService {
  private countriesCache: Country[] | null = null;
  private ratesCache: Map<string, ExchangeRateResponse> = new Map();
  private readonly CACHE_TTL = 3600000; // 1 hour in milliseconds
  private cacheTimestamps: Map<string, number> = new Map();

  private isCacheValid(key: string): boolean {
    const timestamp = this.cacheTimestamps.get(key);
    if (!timestamp) return false;
    return Date.now() - timestamp < this.CACHE_TTL;
  }

  private setCache(key: string, data: any): void {
    this.cacheTimestamps.set(key, Date.now());
    if (key === 'countries') {
      this.countriesCache = data;
    } else {
      this.ratesCache.set(key, data);
    }
  }

  async getCountries(): Promise<ApiResponse<Country[]>> {
    try {
      // Try to get from cache first
      if (this.countriesCache && this.isCacheValid('countries')) {
        return ResponseHelper.success(this.countriesCache, 'Countries retrieved from cache', 'Currency');
      }

      // Fetch from API
      const response = await fetch('https://restcountries.com/v3.1/all?fields=name,cca2,currencies');
      if (!response.ok) {
        throw new Error('Failed to fetch countries');
      }

      const countries: Country[] = await response.json();
      
      // Filter countries that have currencies
      const countriesWithCurrencies = countries.filter(country => 
        country.currencies && Object.keys(country.currencies).length > 0
      );

      // Cache the result
      this.setCache('countries', countriesWithCurrencies);

      return ResponseHelper.success(countriesWithCurrencies, 'Countries retrieved successfully', 'Currency');
    } catch (error) {
      throw new BadRequestException(`Failed to get countries: ${error.message}`);
    }
  }

  async getExchangeRates(baseCurrency: string = 'USD'): Promise<ApiResponse<ExchangeRateResponse>> {
    try {
      const cacheKey = `rates_${baseCurrency}`;
      
      // Try to get from cache first
      const cachedRates = this.ratesCache.get(cacheKey);
      if (cachedRates && this.isCacheValid(cacheKey)) {
        return ResponseHelper.success(cachedRates, 'Exchange rates retrieved from cache', 'Currency');
      }

      // Fetch from API
      const response = await fetch(`https://open.er-api.com/v6/latest/${baseCurrency}`);
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }

      const rates: ExchangeRateResponse = await response.json();

      // Cache the result
      this.setCache(cacheKey, rates);

      return ResponseHelper.success(rates, 'Exchange rates retrieved successfully', 'Currency');
    } catch (error) {
      throw new BadRequestException(`Failed to get exchange rates: ${error.message}`);
    }
  }

  async convertCurrency(convertDto: ConvertCurrencyDto): Promise<ApiResponse<{ amount: number; rate: number }>> {
    try {
      const { amount, from, to } = convertDto;

      if (from === to) {
        return ResponseHelper.success(
          { amount, rate: 1 }, 
          'No conversion needed - same currency', 
          'Currency'
        );
      }

      // Get exchange rates
      const ratesResponse = await this.getExchangeRates(from);
      const rates = ratesResponse.data.rates;

      if (!rates[to]) {
        throw new BadRequestException(`Exchange rate for ${to} not available`);
      }

      const rate = rates[to];
      const convertedAmount = amount * rate;

      return ResponseHelper.success(
        { amount: convertedAmount, rate }, 
        'Currency converted successfully', 
        'Currency'
      );
    } catch (error) {
      throw new BadRequestException(`Failed to convert currency: ${error.message}`);
    }
  }

  getCurrencySymbol(country: Country): string {
    const currencies = Object.values(country.currencies);
    return currencies.length > 0 ? currencies[0].symbol : '';
  }

  getCurrencyCode(country: Country): string {
    return Object.keys(country.currencies)[0] || '';
  }
}
