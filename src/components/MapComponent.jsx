import React, { useRef, useEffect, useImperativeHandle, forwardRef } from 'react';
import mapboxgl from 'mapbox-gl';

const MapComponent = forwardRef(({ center, participantLocations, mapboxToken, participantDisplayMode = 'dots', theme = 'light' }, ref) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const incidentMarker = useRef(null);

    // This effect handles map creation, and re-creates the map when the theme changes.
    useEffect(() => {
        if (!mapContainer.current || !center || !mapboxToken) return;

        const mapStyle = theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';

        mapboxgl.accessToken = mapboxToken;
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center: center,
            zoom: 14,
        });

        map.current.addControl(new mapboxgl.NavigationControl());

        map.current.on('load', () => {
            if (!map.current) return;
            // Add participant data source
            map.current.addSource('participants-data', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': []
                }
            });

            // Conditionally add layer based on display mode
            if (participantDisplayMode === 'heatmap') {
                map.current.addLayer({
                    id: 'heatmap-layer',
                    type: 'heatmap',
                    source: 'participants-data',
                    maxzoom: 15,
                    paint: {
                         'heatmap-weight': 1,
                         'heatmap-intensity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            11, 1,
                            15, 3
                         ],
                        'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(33,102,172,0)', 0.2, 'rgb(103,169,207)', 0.4, 'rgb(209,229,240)', 0.6, 'rgb(253,219,199)', 0.8, 'rgb(239,138,98)', 1, 'rgb(178,24,43)'],
                        'heatmap-radius': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            11, 15,
                            15, 20
                        ],
                        'heatmap-opacity': [
                            'interpolate',
                            ['linear'],
                            ['zoom'],
                            14, 1,
                            15, 0
                        ]
                    }
                }, 'waterway-label');
            } else { // 'dots' mode
                 map.current.addLayer({
                    id: 'dots-layer',
                    type: 'circle',
                    source: 'participants-data',
                    paint: {
                        'circle-radius': 3,
                        'circle-color': '#14B4D6', // Use primary brand color
                        'circle-opacity': 0.5,
                        'circle-stroke-width': 0.5,
                        'circle-stroke-color': theme === 'dark' ? '#000000' : '#ffffff'
                    }
                });
            }
        });

        // Cleanup function to remove map instance on component unmount or re-render
        return () => {
            map.current?.remove();
            map.current = null;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center, mapboxToken, participantDisplayMode, theme]);

    // Update data when participantLocations prop changes
    useEffect(() => {
        if (!map.current || !map.current.isStyleLoaded() || !participantLocations || !participantLocations.length) return;

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

        const source = map.current.getSource('participants-data');
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