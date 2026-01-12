import axios from 'axios';
import { CurrencyService } from './currency.service';

export class ExchangeRateApiService {
  // Using Frankfurter API - Free, no API key required, maintained by European Central Bank
  private static BASE_URL = 'https://api.frankfurter.app';

  /**
   * Fetch latest rates from Frankfurter API (Free, no API key needed)
   * Documentation: https://www.frankfurter.app/docs/
   */
  static async fetchLatestRates(): Promise<Record<string, number>> {
    try {
      // Currencies we want to track (ASEAN + Major Asian + Global)
      const currencies = [
        // ASEAN
        'SGD', 'THB', 'IDR', 'PHP', 'VND', 'BND',
        // Asian
        'INR', 'CNY', 'JPY', 'KRW', 'HKD', 'TWD',
        // Global
        'USD', 'EUR', 'GBP', 'AUD', 'NZD', 'CAD'
      ];

      // Fetch rates with MYR as base currency
      const response = await axios.get(`${this.BASE_URL}/latest`, {
        params: {
          from: 'MYR',
          to: currencies.join(','),
        },
      });

      if (!response.data || !response.data.rates) {
        throw new Error('Invalid response from exchange rate API');
      }

      const rates = response.data.rates;

      // Invert rates (API gives MYR→X, we need X→MYR)
      const invertedRates: Record<string, number> = {};

      Object.keys(rates).forEach(currency => {
        if (rates[currency]) {
          // Round to 6 decimal places for precision
          invertedRates[currency] = Math.round((1 / rates[currency]) * 1000000) / 1000000;
        }
      });

      return invertedRates;
    } catch (error: any) {
      console.error('Error fetching exchange rates from Frankfurter API:', error.message);
      throw new Error(`Failed to fetch exchange rates: ${error.message}`);
    }
  }

  /**
   * Import rates into database from API
   */
  static async importRates(): Promise<void> {
    const rates = await this.fetchLatestRates();
    const today = new Date();

    for (const [currency, rate] of Object.entries(rates)) {
      await CurrencyService.setExchangeRate(
        currency,
        rate,
        today,
        'api' // Source is API
      );
    }
  }
}
