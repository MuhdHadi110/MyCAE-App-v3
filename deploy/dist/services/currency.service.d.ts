import { ExchangeRate } from '../entities/ExchangeRate';
export declare class CurrencyService {
    /**
     * Get latest exchange rate from database
     */
    static getExchangeRate(fromCurrency: string, toCurrency?: string): Promise<number>;
    /**
     * Convert amount from one currency to another
     */
    static convertToMYR(amount: number, fromCurrency: string): Promise<{
        amountMYR: number;
        rate: number;
    }>;
    /**
     * Add or update exchange rate
     */
    static setExchangeRate(fromCurrency: string, rate: number, effectiveDate: Date, source?: 'manual' | 'api'): Promise<ExchangeRate>;
}
//# sourceMappingURL=currency.service.d.ts.map