import React from 'react';

const ShipmentMap = ({ route, currentLocation }) => {
  // A simplified placeholder map if mapbox isn't fully configured
  return (
    <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center border border-gray-300 relative overflow-hidden">
      <div className="text-center p-4">
        <p className="text-gray-500 mb-2 font-medium">Shipment Map</p>
        <p className="text-xs text-gray-400">MapBox integration pending mapbox token</p>
        {currentLocation && (
          <div className="mt-4 p-2 bg-white rounded shadow text-sm">
            Current: {currentLocation.locationName} <br/> 
            ({currentLocation.lat}, {currentLocation.lng})
          </div>
        )}
      </div>
    </div>
  );
};

export default ShipmentMap;
