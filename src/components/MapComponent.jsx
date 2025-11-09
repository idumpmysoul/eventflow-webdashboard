import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';

const MapComponent = forwardRef(({ center, participantLocations, mapboxToken }, ref) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const incidentMarker = useRef(null);

    useEffect(() => {
        if (map.current || !mapContainer.current || !center || !mapboxToken) return;

        mapboxgl.accessToken = mapboxToken;
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: 'mapbox://styles/mapbox/dark-v11',
            center: center,
            zoom: 14,
        });

        map.current.addControl(new mapboxgl.NavigationControl());

        map.current.on('load', () => {
            if (!map.current) return;
            // Add heatmap source and layer when map loads
            map.current.addSource('heatmap-data', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': []
                }
            });

            map.current.addLayer({
                id: 'heatmap-layer',
                type: 'heatmap',
                source: 'heatmap-data',
                paint: {
                    'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 0, 1, 9, 3],
                    'heatmap-color': [
                        'interpolate',
                        ['linear'],
                        ['heatmap-density'],
                        0, 'rgba(33,102,172,0)',
                        0.2, 'rgb(103,169,207)',
                        0.4, 'rgb(209,229,240)',
                        0.6, 'rgb(253,219,199)',
                        0.8, 'rgb(239,138,98)',
                        1, 'rgb(178,24,43)'
                    ],
                    'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 0, 2, 9, 20],
                    'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 7, 1, 9, 0.7]
                }
            }, 'waterway-label');
        });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center, mapboxToken]);

    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded() || !participantLocations.length) return;

        const geojsonData = {
            type: 'FeatureCollection',
            features: participantLocations.map(loc => ({
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'Point',
                    coordinates: [loc.longitude, loc.latitude]
                }
            }))
        };

        const source = map.current.getSource('heatmap-data');
        if (source) {
            source.setData(geojsonData);
        }
    }, [participantLocations]);

    useImperativeHandle(ref, () => ({
        flyTo(lng, lat) {
            if (!map.current) return;

            map.current.flyTo({
                center: [lng, lat],
                zoom: 17,
                essential: true,
            });

            if (incidentMarker.current) {
                incidentMarker.current.remove();
            }

            incidentMarker.current = new mapboxgl.Marker({ color: '#facc15' }) // yellow-400
                .setLngLat([lng, lat])
                .addTo(map.current);

            setTimeout(() => {
                incidentMarker.current?.remove();
                incidentMarker.current = null;
            }, 5000);
        }
    }));

    return <div ref={mapContainer} className="w-full h-full" />;
});

export default MapComponent;
