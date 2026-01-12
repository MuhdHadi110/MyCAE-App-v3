import { Router, Response } from 'express';
import { AppDataSource } from '../config/database';
import { ExchangeRate } from '../entities/ExchangeRate';
import { authenticate, AuthRequest, authorize } from '../middleware/auth';
import { UserRole } from '../entities/User';
import { CurrencyService } from '../services/currency.service';
import { ExchangeRateApiService } from '../services/exchangeRateApi.service';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/exchange-rates
 * Get all exchange rates (latest for each currency)
 */
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const exchangeRateRepo = AppDataSource.getRepository(ExchangeRate);

    // Get latest rate for each currency
    const rates = await exchangeRateRepo
      .createQueryBuilder('rate')
      .where('rate.effectiveDate <= :today', { today: new Date() })
      .orderBy('rate.fromCurrency', 'ASC')
      .addOrderBy('rate.effectiveDate', 'DESC')
      .addOrderBy('rate.source', 'ASC') // 'api' comes before 'manual', so we need to handle this below
      .getMany();

    // Group by currency and get only the most recent for each
    // Prioritize: 1) Latest date, 2) Manual over API for same date
    const latestRates: Record<string, ExchangeRate> = {};
    rates.forEach(rate => {
      if (!latestRates[rate.fromCurrency]) {
        latestRates[rate.fromCurrency] = rate;
      } else {
        const existing = latestRates[rate.fromCurrency];
        // Convert dates to strings for comparison (YYYY-MM-DD)
        const rateDate = new Date(rate.effectiveDate).toISOString().split('T')[0];
        const existingDate = new Date(existing.effectiveDate).toISOString().split('T')[0];

        // If same date but current is manual and existing is api, replace
        if (
          rateDate === existingDate &&
          rate.source === 'manual' &&
          existing.source === 'api'
        ) {
          latestRates[rate.fromCurrency] = rate;
        }
      }
    });

    res.json(Object.values(latestRates));
  } catch (error: any) {
    console.error('Error fetching exchange rates:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rates' });
  }
});

/**
 * POST /api/exchange-rates
 * Add new exchange rate manually (Senior Engineer+ only)
 */
router.post(
  '/',
  authorize(UserRole.SENIOR_ENGINEER, UserRole.PRINCIPAL_ENGINEER, UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    try {
      const { fromCurrency, rate, effectiveDate } = req.body;

      if (!fromCurrency || !rate || !effectiveDate) {
        return res.status(400).json({ error: 'Missing required fields: fromCurrency, rate, effectiveDate' });
      }

      const exchangeRate = await CurrencyService.setExchangeRate(
        fromCurrency.toUpperCase(),
        parseFloat(rate),
        new Date(effectiveDate),
        'manual'
      );

      res.status(201).json(exchangeRate);
    } catch (error: any) {
      console.error('Error creating exchange rate:', error);
      res.status(500).json({ error: 'Failed to create exchange rate' });
    }
  }
);

/**
 * POST /api/exchange-rates/import
 * Fetch and import latest rates from API (Senior Engineer+ only)
 */
router.post(
  '/import',
  authorize(UserRole.SENIOR_ENGINEER, UserRole.PRINCIPAL_ENGINEER, UserRole.MANAGER, UserRole.MANAGING_DIRECTOR, UserRole.ADMIN),
  async (req: AuthRequest, res: Response) => {
    try {
      await ExchangeRateApiService.importRates();
      res.json({ message: 'Exchange rates imported successfully from API' });
    } catch (error: any) {
      console.error('Error importing exchange rates:', error);
      res.status(500).json({ error: error.message || 'Failed to import exchange rates' });
    }
  }
);

/**
 * GET /api/exchange-rates/single
 * Get a single exchange rate for a specific currency and optional date
 */
router.get('/single', async (req: AuthRequest, res: Response) => {
  try {
    const { fromCurrency, date } = req.query;

    if (!fromCurrency) {
      return res.status(400).json({ error: 'fromCurrency is required' });
    }

    const exchangeRateRepo = AppDataSource.getRepository(ExchangeRate);
    const queryDate = date ? new Date(date as string) : new Date();

    // Get the most recent rate for this currency on or before the given date
    const rate = await exchangeRateRepo
      .createQueryBuilder('rate')
      .where('rate.fromCurrency = :currency', { currency: (fromCurrency as string).toUpperCase() })
      .andWhere('rate.effectiveDate <= :date', { date: queryDate })
      .orderBy('rate.effectiveDate', 'DESC')
      .addOrderBy('rate.source', 'DESC') // 'manual' comes after 'api', prefer manual
      .getOne();

    if (!rate) {
      return res.status(404).json({ error: `No exchange rate found for ${fromCurrency}` });
    }

    res.json({ rate: Number(rate.rate), source: rate.source });
  } catch (error: any) {
    console.error('Error fetching single exchange rate:', error);
    res.status(500).json({ error: 'Failed to fetch exchange rate' });
  }
});

/**
 * GET /api/exchange-rates/convert
 * Convert amount from one currency to MYR
 */
router.get('/convert', async (req: AuthRequest, res: Response) => {
  try {
    const { amount, fromCurrency } = req.query;

    if (!amount || !fromCurrency) {
      return res.status(400).json({ error: 'Missing amount or fromCurrency' });
    }

    const result = await CurrencyService.convertToMYR(
      parseFloat(amount as string),
      (fromCurrency as string).toUpperCase()
    );

    res.json(result);
  } catch (error: any) {
    console.error('Error converting currency:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
