import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import * as turf from '@turf/turf';
import { SpotType } from '../types';
import { 
    BuildingStorefrontIcon, 
    ArrowLeftStartOnRectangleIcon, 
    ArrowRightEndOnRectangleIcon,
    MapPinIcon
} from '@heroicons/react/24/solid';

const spotIcons = {
    [SpotType.ENTRY]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clip-rule="evenodd" /></svg>`,
    [SpotType.EXIT]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-2a.75.75 0 011.5 0v2A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25z" clip-rule="evenodd" /><path fill-rule="evenodd" d="M19 10a.75.75 0 00-.75-.75H8.704l1.048-.943a.75.75 0 10-1.004-1.114l-2.5 2.25a.75.75 0 000 1.114l2.5 2.25a.75.75 0 101.004-1.114l-1.048-.943H18.25A.75.75 0 0019 10z" clip-rule="evenodd" /></svg>`,
    [SpotType.CHECKPOINT]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clip-rule="evenodd" /></svg>`,
    [SpotType.OTHER]: `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5"><path d="M10 12.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z" /><path fill-rule="evenodd" d="M.667 10.595A10.02 10.02 0 0110 5.5a10.02 10.02 0 019.333 5.095 1 1 0 00.914-.492 1 1 0 00-.492-.914A12.02 12.02 0 0010 3.5a12.02 12.02 0 00-10.755 6.185 1 1 0 00.418 1.318 1 1 0 001.318-.418zM19.333 10.405a1 1 0 00-1.318.418A10.02 10.02 0 0110 15.5a10.02 10.02 0 01-9.333-5.095 1 1 0 00-.914.492 1 1 0 00.492.914A12.02 12.02 0 0010 17.5a12.02 12.02 0 0010.755-6.185 1 1 0 00-.422-1.318z" clip-rule="evenodd" /></svg>`,
};

const MapComponent = forwardRef(({ 
    center, 
    participantLocations, 
    mapboxToken, 
    participantDisplayMode = 'dots', 
    theme = 'light',
    isManageZonesMode = false,
    isManageSpotsMode = false,
    isAddingSpotMode = false,
    zones = [],
    spots = [],
    onZoneCreated,
    onLocationSelect,
    initialSelection 
}, ref) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const draw = useRef(null);
    const incidentMarker = useRef(null);
    const selectionMarker = useRef(null);
    const participantMarkers = useRef({});
    const spotMarkers = useRef({});
    const [mapLoaded, setMapLoaded] = useState(false);

        useEffect(() => {
            if (!mapContainer.current || !mapboxToken || map.current) return;
            const mapStyle = 'mapbox://styles/mapbox/streets-v12';
            const defaultCenter = [106.8456, -6.2088];
            let initialCenter = defaultCenter;
            if (
                center &&
                typeof center[0] === 'number' &&
                typeof center[1] === 'number'
            ) {
                initialCenter = center;
            } else if (
                initialSelection &&
                typeof initialSelection.longitude === 'number' &&
                typeof initialSelection.latitude === 'number'
            ) {
                initialCenter = [initialSelection.longitude, initialSelection.latitude];
            }
            try {
                mapboxgl.accessToken = mapboxToken;
                map.current = new mapboxgl.Map({ 
                    container: mapContainer.current, 
                    style: mapStyle, 
                    center: initialCenter, 
                    zoom: 14, 
                    pitch: 45 
                });
                map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');
                draw.current = new MapboxDraw({ displayControlsDefault: false, controls: {} });
                map.current.addControl(draw.current);
                map.current.on('load', () => {
                    if (!map.current) return;
                    setTimeout(() => {
                        if (map.current) {
                            map.current.resize();
                            setMapLoaded(true);
                        }
                    }, 100);
                    if (
                        onLocationSelect &&
                        initialSelection &&
                        typeof initialSelection.longitude === 'number' &&
                        typeof initialSelection.latitude === 'number'
                    ) {
                        addSelectionMarker(initialSelection.longitude, initialSelection.latitude);
                    }
                    // Add zones source if not present
                    if (!map.current.getSource('zones-data')) {
                        map.current.addSource('zones-data', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
                    }
                    // Add fill layer for zones if not present
                    if (!map.current.getLayer('zones-fill')) {
                        map.current.addLayer({
                            id: 'zones-fill',
                            type: 'fill',
                            source: 'zones-data',
                            layout: {},
                            paint: {
                                'fill-color': ['get', 'color'],
                                'fill-opacity': 0.3
                            }
                        });
                    }
                    // Add line layer for zone borders if not present
                    if (!map.current.getLayer('zones-line')) {
                        map.current.addLayer({
                            id: 'zones-line',
                            type: 'line',
                            source: 'zones-data',
                            layout: {},
                            paint: {
                                'line-color': ['get', 'color'],
                                'line-width': 2
                            }
                        });
                    }
                });
                map.current.on('error', (e) => {
                    console.error('Mapbox error:', e);
                });
            } catch (error) {
                console.error('Failed to initialize map:', error);
            }
            return () => { 
                if (map.current) {
                    map.current.remove(); 
                    map.current = null; 
                }
            }
        }, [mapboxToken, center, initialSelection]);

    useImperativeHandle(ref, () => ({
        flyTo(lng, lat) { /* ... implementation ... */ },
        resize() { map.current?.resize(); }
    }));

    const addSelectionMarker = (lng, lat) => {
        if (!map.current) return;
        if (selectionMarker.current) selectionMarker.current.remove();
        const el = document.createElement('div');
        el.className = 'w-8 h-8 text-indigo-600';
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>`;
        selectionMarker.current = new mapboxgl.Marker(el, { anchor: 'bottom' }).setLngLat([lng, lat]).addTo(map.current);
    };

    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        draw.current.changeMode(isManageZonesMode ? 'draw_polygon' : 'simple_select');
        if(map.current.getCanvas()) map.current.getCanvas().style.cursor = isManageZonesMode ? 'crosshair' : '';
    }, [isManageZonesMode, mapLoaded]);

    useEffect(() => {
        if (!map.current || !mapLoaded || !zones) return;
        // Backend: zone.area is GeoJSON Polygon, zone.color is string
        const features = zones
            .filter(zone => zone.area && zone.area.type === 'Polygon' && Array.isArray(zone.area.coordinates))
            .map(zone => ({
                type: 'Feature',
                id: zone.id,
                properties: {
                    color: zone.color || '#888888',
                    name: zone.name
                },
                geometry: zone.area
            }));
        const source = map.current.getSource('zones-data');
        if (source) {
            source.setData({ type: 'FeatureCollection', features });
        }
    }, [zones, mapLoaded]);

    // Spot adding mode
    useEffect(() => {
        if(!map.current || !mapLoaded) return;
        if(map.current.getCanvas()) map.current.getCanvas().style.cursor = isAddingSpotMode ? 'crosshair' : '';
        
        const clickHandler = (e) => {
            if (isAddingSpotMode && onLocationSelect) {
                const { lng, lat } = e.lngLat;
                onLocationSelect({ longitude: lng, latitude: lat });
            }
        };

        if (isAddingSpotMode) {
            map.current.on('click', clickHandler);
        }

        return () => {
            if (map.current) {
                map.current.off('click', clickHandler);
            }
        };
    }, [isAddingSpotMode, mapLoaded, onLocationSelect]);


    // Spot Markers Logic
    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        
        const activeSpotIds = new Set(spots.map(s => s.id));

        // Update or create spot markers
        spots.forEach(spot => {
            if (spotMarkers.current[spot.id]) {
                spotMarkers.current[spot.id].setLngLat([spot.longitude, spot.latitude]);
            } else {
                const el = document.createElement('div');
                el.className = 'w-7 h-7 bg-green-600 border-2 border-white rounded-full flex items-center justify-center text-white shadow-lg';
                el.innerHTML = spotIcons[spot.type] || spotIcons.OTHER;
                
                const marker = new mapboxgl.Marker(el)
                    .setLngLat([spot.longitude, spot.latitude])
                    .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`<div class="p-1 text-slate-900"><div class="font-bold text-xs">${spot.name}</div><div class="text-xs text-slate-600">${spot.type}</div></div>`))
                    .addTo(map.current);
                
                spotMarkers.current[spot.id] = marker;
            }
        });

        // Remove stale spot markers
        Object.keys(spotMarkers.current).forEach(id => {
            if (!activeSpotIds.has(id)) {
                spotMarkers.current[id].remove();
                delete spotMarkers.current[id];
            }
        });

    }, [spots, mapLoaded]);


    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        const safeParticipantLocations = Array.isArray(participantLocations) ? participantLocations : [];

        if (participantDisplayMode === 'heatmap') {
            // Remove previous heatmap layer/source if exists
            if (map.current.getLayer('heatmap-layer')) {
                map.current.removeLayer('heatmap-layer');
            }
            if (map.current.getSource('heatmap-data')) {
                map.current.removeSource('heatmap-data');
            }
            // Add heatmap source
            map.current.addSource('heatmap-data', {
                type: 'geojson',
                data: {
                    type: 'FeatureCollection',
                    features: safeParticipantLocations.map(p => ({
                        type: 'Feature',
                        properties: {},
                        geometry: {
                            type: 'Point',
                            coordinates: [p.longitude, p.latitude]
                        }
                    }))
                }
            });
            // Add heatmap layer
            map.current.addLayer({
                id: 'heatmap-layer',
                type: 'heatmap',
                source: 'heatmap-data',
                maxzoom: 18,
                paint: {
                    'heatmap-weight': [
                        'interpolate',
                        ['linear'],
                        ['get', 'point_count'],
                        0, 0,
                        6, 1
                    ],
                    'heatmap-intensity': [
                        'interpolate', ['linear'], ['zoom'], 0, 1, 18, 3
                    ],
                    'heatmap-color': [
                        'interpolate', ['linear'], ['heatmap-density'],
                        0, 'rgba(33,102,172,0)',
                        0.2, 'rgb(103,169,207)',
                        0.4, 'rgb(209,229,240)',
                        0.6, 'rgb(253,219,199)',
                        0.8, 'rgb(239,138,98)',
                        1, 'rgb(178,24,43)'
                    ],
                    'heatmap-radius': [
                        'interpolate', ['linear'], ['zoom'], 0, 10, 18, 40
                    ],
                    'heatmap-opacity': [
                        'interpolate', ['linear'], ['zoom'], 7, 1, 18, 0.6
                    ]
                }
            });
            return;
        }
        // Remove heatmap if switching back to dots
        if (map.current.getLayer('heatmap-layer')) {
            map.current.removeLayer('heatmap-layer');
        }
        if (map.current.getSource('heatmap-data')) {
            map.current.removeSource('heatmap-data');
        }
        // Dots logic
        const activeIds = new Set(safeParticipantLocations.map(p => p.userId));
        safeParticipantLocations.forEach(p => {
            if (participantMarkers.current[p.userId]) {
                participantMarkers.current[p.userId].setLngLat([p.longitude, p.latitude]);
            } else {
                const el = document.createElement('div');
                el.className = 'w-3 h-3 bg-blue-600 rounded-full border-2 border-white shadow-md transition-transform hover:scale-150 cursor-pointer';
                el.title = p.name || 'User';
                const marker = new mapboxgl.Marker(el).setLngLat([p.longitude, p.latitude]).setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`<div class="text-slate-900 font-bold text-xs p-1">${p.name || 'Participant'}</div>`)).addTo(map.current);
                el.addEventListener('mouseenter', () => marker.togglePopup());
                el.addEventListener('mouseleave', () => marker.togglePopup());
                participantMarkers.current[p.userId] = marker;
            }
        });
        Object.keys(participantMarkers.current).forEach(id => {
            if (!activeIds.has(id)) {
                participantMarkers.current[id].remove();
                delete participantMarkers.current[id];
            }
        });
    }, [participantLocations, participantDisplayMode, mapLoaded]);

        return (
            <div
                ref={mapContainer}
                className="w-full h-full min-h-[400px] bg-slate-800 rounded-xl border border-slate-700"
                style={{ minHeight: 400, background: '#232946', borderRadius: '0.75rem', border: '1px solid #334155' }}
            />
        );
});

export default MapComponent;