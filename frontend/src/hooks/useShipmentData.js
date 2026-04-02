import { useState, useEffect, useCallback } from 'react';

const API = 'http://localhost:8000/api';

// Helper: compute status from temperature
const getStatus = (temp) => {
  if (temp > 4.2) return 'critical';
  if (temp > 3.5) return 'warning';
  return 'normal';
};

// Helper: simple linear forecast for next 6-hours from recent readings
const forecastTemp = (readings) => {
  if (!readings || readings.length < 2) return null;
  const recent = readings.slice(-12);
  const trend = (recent[recent.length - 1].temperature - recent[0].temperature) / recent.length;
  return parseFloat((recent[recent.length - 1].temperature + trend * 6).toFixed(2));
};

// Helper: estimate shelf life remaining from product type
const shelfLifeDays = { pharmaceuticals: 30, vaccines: 30, fresh_produce: 8, seafood: 7, dairy: 5 };

const calcHealth = (productType, readings) => {
  const maxDays = shelfLifeDays[productType?.toLowerCase()] || 15;
  if (!readings?.length) return { health: 100, remaining: maxDays };
  
  // Accumulate temperature abuse (time above threshold)
  const abuse = readings.reduce((acc, r) => {
    if (r.temperature > 4.0) acc += (r.temperature - 4.0) * 0.5;
    return acc;
  }, 0);

  const daysUsed = readings.length / 48; // 48 readings per day (30-min intervals)
  const remaining = Math.max(0, maxDays - daysUsed - abuse / 10);
  const health = Math.round((remaining / maxDays) * 100);
  return { health: Math.max(0, health), remaining: parseFloat(remaining.toFixed(1)) };
};

export const useShipmentData = (containerId = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (containerId) {
        // ── Fetch shipment info ──────────────────────────────────────
        const shipRes = await fetch(`${API}/shipments/${containerId}`);
        if (!shipRes.ok) throw new Error(`Shipment not found: ${containerId}`);
        const shipment = await shipRes.json();

        // ── Fetch sensor history (last 96 readings = 48h) ────────────
        const sensRes = await fetch(`${API}/sensors/${containerId}/history?limit=96`);
        const readings = sensRes.ok ? await sensRes.json() : [];

        // ── Map backend sensor readings to chart-friendly format ──────
        const mappedHistory = readings.map(r => ({
          timestamp: r.timestamp,
          temp: r.temperature,
          humidity: r.humidity,
          cooling: r.cooling_power,
        }));
        setHistory(mappedHistory);

        // ── Derive live stats ─────────────────────────────────────────
        const latest = readings[0] || {};
        const prediction = forecastTemp(readings.slice().reverse());
        const { health, remaining } = calcHealth(shipment.product_type, readings);

        setData({
          id: shipment.container_id,
          cargo: shipment.product_type?.replace('_', ' ')
            .replace(/\b\w/g, c => c.toUpperCase()),
          product_type: shipment.product_type,
          temp: parseFloat((latest.temperature ?? 3.5).toFixed(2)),
          humidity: parseFloat((latest.humidity ?? 55).toFixed(1)),
          battery: parseFloat((latest.cooling_power ?? 85).toFixed(1)),
          vibration: parseFloat((latest.vibration ?? 0).toFixed(3)),
          threshold: 4.0,
          status: getStatus(latest.temperature ?? 3.5),
          prediction,
          health_score: health,
          shelf_life_remaining: remaining,
          location: 'DP World Terminal',
          syncStatus: 'synced',
          journey_days: shipment.journey_days,
        });
      } else {
        // ── Fetch all shipments for dashboard ─────────────────────────
        const res = await fetch(`${API}/shipments/`);
        const shipments = res.ok ? await res.json() : [];
        setData(shipments);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch shipment data');
      console.error('useShipmentData error:', err);
    } finally {
      setLoading(false);
    }
  }, [containerId]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, history, refresh };
};
