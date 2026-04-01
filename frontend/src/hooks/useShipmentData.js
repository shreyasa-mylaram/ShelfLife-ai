import { useState, useEffect, useCallback } from 'react';
import { containerAPI, shipmentAPI } from '../services/api';

export const useShipmentData = (containerId = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [history, setHistory] = useState([]);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let containers;
      if (containerId) {
        containers = [await containerAPI.getById(containerId)];
      } else {
        const response = await containerAPI.getAll();
        containers = response.data;
      }

      setData(containers);

      // Fetch history for specific container
      if (containerId) {
        const historyResponse = await containerAPI.getHistory(containerId);
        setHistory(historyResponse.data);
      }
    } catch (err) {
      setError(err.message || 'Failed to fetch shipment data');
      console.error('Error fetching shipment data:', err);
    } finally {
      setLoading(false);
    }
  }, [containerId]);

  const updateThreshold = useCallback(async (id, threshold) => {
    try {
      await containerAPI.updateThreshold(id, threshold);
      await fetchData(); // Refresh data
      return true;
    } catch (err) {
      console.error('Error updating threshold:', err);
      return false;
    }
  }, [fetchData]);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    loading,
    error,
    history,
    updateThreshold,
    refresh
  };
};
