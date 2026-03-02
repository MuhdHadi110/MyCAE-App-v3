"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrencyService = void 0;
const database_1 = require("../config/database");
const ExchangeRate_1 = require("../entities/ExchangeRate");
class CurrencyService {
    /**
     * Get latest exchange rate from database
     */
    static async getExchangeRate(fromCurrency, toCurrency = 'MYR') {
        // If same currency, return 1
        if (fromCurrency === toCurrency) {
            return 1.0;
        }
        const exchangeRateRepo = database_1.AppDataSource.getRepository(ExchangeRate_1.ExchangeRate);
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
    static async convertToMYR(amount, fromCurrency) {
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
    static async setExchangeRate(fromCurrency, rate, effectiveDate, source = 'manual') {
        const exchangeRateRepo = database_1.AppDataSource.getRepository(ExchangeRate_1.ExchangeRate);
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
exports.CurrencyService = CurrencyService;
//# sourceMappingURL=currency.service.js.map