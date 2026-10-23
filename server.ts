process.env.DISABLE_HMR = 'true';

import express from 'express';
import type { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import http from 'http';
import {
  initializeLtaService,
  searchLtaData,
  getNearestBusStops,
  getLiveBusArrivals,
  getBusStopByCode,
  getAllBusStops,
  getLtaSyncStatus,
  ingestLtaData
} from './server/ltaService.ts';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

const DEFAULT_LTA_KEY = process.env.LTA_DATAMALL_API_KEY || 'LQcDSpOhQGyKlvfSVGEg9Q==';

/**
 * 1. Search bus stops and services dynamically from ingested LTA Master Data
 * Supports queries for stop code (e.g. "75541"), service number (e.g. "298"), road, or description
 */
app.get('/api/lta/search', async (req: Request, res: Response) => {
  try {
    const q = (req.query.q as string) || '';
    const limit = parseInt(req.query.limit as string) || 30;
    const apiKey = (req.headers['x-lta-account-key'] as string) || DEFAULT_LTA_KEY;

    const data = await searchLtaData(q, limit, apiKey);
    return res.json({
      status: 'ok',
      ...data,
      _source: 'lta_datamall_ingested'
    });
  } catch (err: any) {
    console.error('LTA search endpoint error:', err);
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 2. Get bus stops (either nearest based on lat/lng or master list)
 */
app.get('/api/lta/bus-stops', (req: Request, res: Response) => {
  try {
    const lat = req.query.lat ? parseFloat(req.query.lat as string) : undefined;
    const lng = req.query.lng ? parseFloat(req.query.lng as string) : undefined;
    const limit = parseInt(req.query.limit as string) || 30;

    if (lat !== undefined && lng !== undefined && !isNaN(lat) && !isNaN(lng)) {
      const nearest = getNearestBusStops(lat, lng, limit);
      return res.json({ status: 'ok', stops: nearest });
    }

    const stops = getAllBusStops(limit);
    return res.json({ status: 'ok', stops });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 3. Get single bus stop by code
 */
app.get('/api/lta/bus-stops/:code', async (req: Request, res: Response) => {
  try {
    const code = req.params.code;
    const apiKey = (req.headers['x-lta-account-key'] as string) || DEFAULT_LTA_KEY;
    const stop = await getBusStopByCode(code, apiKey);

    if (!stop) {
      return res.status(404).json({ status: 'error', message: `Bus stop ${code} not found` });
    }

    return res.json({ status: 'ok', stop });
  } catch (err: any) {
    return res.status(500).json({ status: 'error', message: err.message });
  }
});

/**
 * 4. Real-time Bus Arrival estimates (LTA DataMall official endpoint /v3/BusArrival)
 */
app.get('/api/lta/bus-arrival', async (req: Request, res: Response) => {
  const busStopCode = (req.query.busStopCode as string) || '08057';
  const serviceNo = req.query.serviceNo as string | undefined;
  const apiKey = (req.headers['x-lta-account-key'] as string) || DEFAULT_LTA_KEY;

  try {
    const data = await getLiveBusArrivals(busStopCode, serviceNo, apiKey);
    return res.json(data);
  } catch (err: any) {
    console.error('Bus arrival error:', err);
    return res.json({
      BusStopCode: busStopCode,
      Services: [],
      _source: 'live_engine'
    });
  }
});

/**
 * 5. LTA Master Ingestion Status & Health
 */
app.get('/api/lta/status', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    sync: getLtaSyncStatus()
  });
});

/**
 * 6. Trigger manual background sync with official LTA DataMall API
 */
app.post('/api/lta/sync', (req: Request, res: Response) => {
  const apiKey = (req.headers['x-lta-account-key'] as string) || DEFAULT_LTA_KEY;
  ingestLtaData(apiKey).catch(console.error);
  return res.json({
    status: 'started',
    message: 'LTA DataMall dynamic master sync running in background'
  });
});

/**
 * 7. Weather endpoint for Singapore locations
 */
app.get('/api/weather', async (req: Request, res: Response) => {
  try {
    const govUrl = 'https://api.data.gov.sg/v1/environment/2-hour-weather-forecast';
    const govRes = await fetch(govUrl).catch(() => null);

    if (govRes && govRes.ok) {
      const data = await govRes.json();
      return res.json({ status: 'ok', data, _source: 'data.gov.sg' });
    }
  } catch (e) {
    // Graceful fallback
  }

  return res.json({ status: 'fallback', message: 'Local forecast active' });
});

async function main() {
  // Initialize master bus stops and services dataset
  await initializeLtaService();

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Can Catch Not? running on http://localhost:${PORT}`);
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const httpServer = http.createServer(app);

    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
        watch: null
      },
      appType: 'spa'
    });

    app.use(vite.middlewares);

    httpServer.listen(PORT, '0.0.0.0', () => {
      console.log(`Can Catch Not? running on http://localhost:${PORT}`);
    });
  }
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
