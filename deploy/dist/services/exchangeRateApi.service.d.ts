export declare class ExchangeRateApiService {
    private static BASE_URL;
    /**
     * Fetch latest rates from Frankfurter API (Free, no API key needed)
     * Documentation: https://www.frankfurter.app/docs/
     */
    static fetchLatestRates(): Promise<Record<string, number>>;
    /**
     * Import rates into database from API
     */
    static importRates(): Promise<void>;
}
//# sourceMappingURL=exchangeRateApi.service.d.ts.map