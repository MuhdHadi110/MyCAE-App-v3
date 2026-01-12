import { AppDataSource } from '../config/database';
import { ExchangeRate } from '../entities/ExchangeRate';

export class CurrencyService {
  /**
   * Get latest exchange rate from database
   */
  static async getExchangeRate(fromCurrency: string, toCurrency: string = 'MYR'): Promise<number> {
    // If same currency, return 1
    if (fromCurrency === toCurrency) {
      return 1.0;
    }

    const exchangeRateRepo = AppDataSource.getRepository(ExchangeRate);

    // Get most recent rate (manual rates take precedence over API rates due to effectiveDate sorting)
    const rate = await exchangeRateRepo
      .createQueryBuilder('rate')
      .where('rate.fromCurrency = :fromCurrency', { fromCurrency })
      .andWhere('rate.toCurrency = :toCurrency', { toCurrency })
      .andWhere('rate.effectiveDate <= :today', { today: new Date() })
      .orderBy('rate.effectiveDate', 'DESC')
      .getOne();

    if (!rate) {
      throw new Error(`No exchange rate found for ${fromCurrency} to ${toCurrency}`);
    }

    return parseFloat(rate.rate.toString());
  }

  /**
   * Convert amount from one currency to another
   */
  static async convertToMYR(amount: number, fromCurrency: string): Promise<{ amountMYR: number; rate: number }> {
    const rate = await this.getExchangeRate(fromCurrency, 'MYR');
    const amountMYR = amount * rate;

    return {
      amountMYR: Math.round(amountMYR * 100) / 100, // Round to 2 decimal places
      rate,
    };
  }

  /**
   * Add or update exchange rate
   */
  static async setExchangeRate(
    fromCurrency: string,
    rate: number,
    effectiveDate: Date,
    source: 'manual' | 'api' = 'manual'
  ): Promise<ExchangeRate> {
    const exchangeRateRepo = AppDataSource.getRepository(ExchangeRate);

    const exchangeRate = exchangeRateRepo.create({
      fromCurrency,
      toCurrency: 'MYR',
      rate,
      effectiveDate,
      source,
    });

    return await exchangeRateRepo.save(exchangeRate);
  }
}
