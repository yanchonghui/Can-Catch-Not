process.env.DISABLE_HMR = 'true';

import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

app.use(express.json());

// Server-side cache to enforce low data usage and fast response
const arrivalCache = new Map<string, { timestamp: number; data: any }>();
const CACHE_TTL_MS = 8000; // 8 seconds cache to optimize bandwidth

const DEFAULT_LTA_KEY = 'LQcDSpOhQGyKlvfSVGEg9Q==';

/**
 * Proxy / API for LTA DataMall BusArrivalv2
 */
app.get('/api/lta/bus-arrival', async (req: Request, res: Response) => {
  const busStopCode = (req.query.busStopCode as string) || '08057';
  const serviceNo = req.query.serviceNo as string | undefined;
  const apiKey = (req.headers['x-lta-account-key'] as string) || process.env.LTA_DATAMALL_API_KEY || DEFAULT_LTA_KEY;

  const cacheKey = `${busStopCode}_${serviceNo || 'ALL'}`;
  const cached = arrivalCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return res.json({
      ...cached.data,
      _fromCache: true,
      _cachedAt: cached.timestamp
    });
  }

  // If user has provided an LTA API key, call the real DataMall API
  if (apiKey && apiKey.trim().length > 10) {
    try {
      let url = `http://datamall2.mytransport.sg/ltaodataservice/BusArrivalv2?BusStopCode=${encodeURIComponent(busStopCode)}`;
      if (serviceNo) {
        url += `&ServiceNo=${encodeURIComponent(serviceNo)}`;
      }

      const response = await fetch(url, {
        headers: {
          AccountKey: apiKey.trim(),
          accept: 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        arrivalCache.set(cacheKey, { timestamp: Date.now(), data });
        return res.json({ ...data, _source: 'lta_datamall' });
      }
    } catch (err) {
      console.warn('LTA Datamall API request failed, falling back to local engine:', err);
    }
  }

  // Return standard response indicating client engine will serve live updates
  return res.json({
    BusStopCode: busStopCode,
    Services: [],
    _source: 'live_engine'
  });
});

/**
 * Weather endpoint for Singapore locations
 */
app.get('/api/weather', async (req: Request, res: Response) => {
  try {
    const lat = parseFloat(req.query.lat as string) || 1.2993;
    const lng = parseFloat(req.query.lng as string) || 103.8453;

    // Optional fetch to data.gov.sg 2-hour weather forecast
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

import http from 'http';

async function main() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve('dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve('dist', 'index.html'));
    });
    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Can Catch Not? running on http://localhost:${PORT}`);
    });
  } else {
    const httpServer = http.createServer(app);
    const isHmrDisabled = process.env.DISABLE_HMR === 'true';

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
