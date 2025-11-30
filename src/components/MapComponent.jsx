
import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import * as turf from '@turf/turf';

const MapComponent = forwardRef(({ 
    center, 
    participantLocations, 
    mapboxToken, 
    participantDisplayMode = 'dots', 
    theme = 'light',
    isManageZonesMode = false,
    zones = [],
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
    const [mapLoaded, setMapLoaded] = useState(false);

    // --- Map Initialization ---
    useEffect(() => {
        if (!mapContainer.current || !mapboxToken) return;

        const mapStyle = theme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
        const defaultCenter = [106.8456, -6.2088]; // Jakarta
        const initialCenter = center || (initialSelection ? [initialSelection.longitude, initialSelection.latitude] : defaultCenter);

        mapboxgl.accessToken = mapboxToken;
        map.current = new mapboxgl.Map({
            container: mapContainer.current,
            style: mapStyle,
            center: initialCenter,
            zoom: 14,
            pitch: 45, // Add 3D pitch
        });

        map.current.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

        // Initialize Draw with NO controls (we toggle modes manually)
        draw.current = new MapboxDraw({
            displayControlsDefault: false,
            controls: { }, 
            styles: [
                {
                    "id": "gl-draw-polygon-fill-inactive",
                    "type": "fill",
                    "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
                    "paint": { "fill-color": "#3bb2d0", "fill-outline-color": "#3bb2d0", "fill-opacity": 0.1 }
                },
                {
                    "id": "gl-draw-polygon-fill-active",
                    "type": "fill",
                    "filter": ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
                    "paint": { "fill-color": "#fbb03b", "fill-outline-color": "#fbb03b", "fill-opacity": 0.1 }
                },
                {
                    "id": "gl-draw-polygon-stroke-inactive",
                    "type": "line",
                    "filter": ["all", ["==", "active", "false"], ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
                    "layout": { "line-cap": "round", "line-join": "round" },
                    "paint": { "line-color": "#3bb2d0", "line-width": 2 }
                },
                {
                    "id": "gl-draw-polygon-stroke-active",
                    "type": "line",
                    "filter": ["all", ["==", "active", "true"], ["==", "$type", "Polygon"]],
                    "layout": { "line-cap": "round", "line-join": "round" },
                    "paint": { "line-color": "#fbb03b", "line-dasharray": [0.2, 2], "line-width": 2 }
                },
                {
                    "id": "gl-draw-line",
                    "type": "line",
                    "filter": ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
                    "layout": { "line-cap": "round", "line-join": "round" },
                    "paint": { "line-color": "#fbb03b", "line-dasharray": [0.2, 2], "line-width": 2 }
                },
            ]
        });

        map.current.addControl(draw.current);

        map.current.on('load', () => {
            if (!map.current) return;
            setMapLoaded(true);
            
            if (onLocationSelect && initialSelection) {
                 addSelectionMarker(initialSelection.longitude, initialSelection.latitude);
            }

            // Initialize Sources
            map.current.addSource('zones-data', {
                'type': 'geojson',
                'data': { 'type': 'FeatureCollection', 'features': [] }
            });

            // Initialize Layers (Zones first so dots appear on top)
            map.current.addLayer({
                id: 'zones-fill',
                type: 'fill',
                source: 'zones-data',
                paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.2 }
            });
            map.current.addLayer({
                id: 'zones-line',
                type: 'line',
                source: 'zones-data',
                paint: { 'line-color': ['get', 'color'], 'line-width': 2, 'line-dasharray': [2, 2] }
            });
            
            // --- Fix: Zone Labels ---
            map.current.addLayer({
                id: 'zones-labels',
                type: 'symbol',
                source: 'zones-data',
                layout: {
                    'text-field': ['get', 'name'],
                    'text-size': 12,
                    'text-transform': 'uppercase',
                    'text-offset': [0, 0],
                    'text-anchor': 'center'
                },
                paint: {
                    'text-color': '#ffffff',
                    'text-halo-color': '#000000',
                    'text-halo-width': 2
                }
            });

            // Draw Event Listeners
            map.current.on('draw.create', (e) => {
                if (onZoneCreated) {
                    const feature = e.features[0];
                    onZoneCreated(feature);
                    // Immediately remove from draw so it doesn't conflict with the 'zones' prop layer
                    draw.current.delete(feature.id); 
                    // Reset mode to prevent continuous drawing if desired, or keep it
                    // draw.current.changeMode('simple_select');
                    
                    // Reset cursor
                    if(map.current.getCanvas()) map.current.getCanvas().style.cursor = '';
                }
            });
            
            map.current.on('draw.modechange', (e) => {
                if(e.mode === 'draw_polygon') {
                     map.current.getCanvas().style.cursor = 'crosshair';
                } else {
                     map.current.getCanvas().style.cursor = '';
                }
            });

            // Location Picker
            if (onLocationSelect) {
                map.current.on('click', (e) => {
                    // Prevent picker if drawing or clicking existing features
                    if (isManageZonesMode) return;
                    
                    const features = map.current.queryRenderedFeatures(e.point, { layers: ['zones-fill'] });
                    if (features.length === 0) {
                        const { lng, lat } = e.lngLat;
                        addSelectionMarker(lng, lat);
                        onLocationSelect({ longitude: lng, latitude: lat });
                    }
                });
            }
        });

        return () => {
            map.current?.remove();
            map.current = null;
        }
    }, [mapboxToken]); 

    // --- Imperative Methods (FlyTo) ---
    useImperativeHandle(ref, () => ({
        flyTo(lng, lat) {
            if (!map.current) return;
            map.current.flyTo({ center: [lng, lat], zoom: 18, pitch: 60, essential: true });
            
            // Add temporary pulsing marker
            if (incidentMarker.current) incidentMarker.current.remove();
            
            const el = document.createElement('div');
            el.className = 'w-6 h-6 bg-red-500 rounded-full animate-ping opacity-75 absolute';
            const container = document.createElement('div');
            container.appendChild(el);
            const dot = document.createElement('div');
            dot.className = 'w-4 h-4 bg-red-600 rounded-full relative border-2 border-white shadow-lg';
            container.appendChild(dot);

            incidentMarker.current = new mapboxgl.Marker(container)
                .setLngLat([lng, lat])
                .addTo(map.current);
            
            // Auto remove after 10s
            setTimeout(() => { incidentMarker.current?.remove(); incidentMarker.current = null; }, 10000);
        },
        resize() {
            map.current?.resize();
        }
    }));

    // --- Selection Marker Helper ---
    const addSelectionMarker = (lng, lat) => {
        if (!map.current) return;
        if (selectionMarker.current) selectionMarker.current.remove();
        
        const el = document.createElement('div');
        el.className = 'w-8 h-8 text-indigo-500';
        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-8 h-8 drop-shadow-lg"><path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" /></svg>`;

        selectionMarker.current = new mapboxgl.Marker(el, { anchor: 'bottom' })
            .setLngLat([lng, lat])
            .addTo(map.current);
    };

    // --- Zone Mode Toggle ---
    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        
        if (isManageZonesMode) {
            // Activate draw mode
            draw.current.changeMode('draw_polygon');
            map.current.getCanvas().style.cursor = 'crosshair';
        } else {
            // Deactivate draw mode
            draw.current.changeMode('simple_select');
            map.current.getCanvas().style.cursor = '';
        }
    }, [isManageZonesMode, mapLoaded]);

    // --- Zones Data Update ---
    useEffect(() => {
        if (!map.current || !mapLoaded || !zones) return;
        const source = map.current.getSource('zones-data');
        if (source) {
            source.setData({
                type: 'FeatureCollection',
                features: zones.map(zone => ({
                    type: 'Feature',
                    id: zone.id,
                    properties: { color: zone.color || '#888888', name: zone.name },
                    geometry: zone.area.geometry || zone.area
                }))
            });
        }
    }, [zones, mapLoaded]);

    // --- Participant Markers Logic ---
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        // If heatmap mode, remove dots and add heatmap layer
        if (participantDisplayMode === 'heatmap') {
            // Cleanup markers
            Object.values(participantMarkers.current).forEach(marker => marker.remove());
            participantMarkers.current = {};

            if (!map.current.getSource('heatmap-source')) {
                map.current.addSource('heatmap-source', { type: 'geojson', data: { type: 'FeatureCollection', features: [] } });
                map.current.addLayer({
                    id: 'heatmap-layer',
                    type: 'heatmap',
                    source: 'heatmap-source',
                    maxzoom: 15,
                    paint: {
                         'heatmap-weight': 1,
                         'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 1, 15, 3],
                         'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(33,102,172,0)', 0.2, 'rgb(103,169,207)', 0.4, 'rgb(209,229,240)', 0.6, 'rgb(253,219,199)', 0.8, 'rgb(239,138,98)', 1, 'rgb(178,24,43)'],
                         'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 15, 15, 20],
                         'heatmap-opacity': 0.7
                    }
                }, 'waterway-label'); // Place under labels
            }
            
            const features = participantLocations.map(p => ({
                type: 'Feature',
                geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] }
            }));
            map.current.getSource('heatmap-source').setData({ type: 'FeatureCollection', features });
            return;
        }

        // If dots mode, remove heatmap and update markers
        if (map.current.getLayer('heatmap-layer')) {
            map.current.removeLayer('heatmap-layer');
            map.current.removeSource('heatmap-source');
        }

        const activeIds = new Set(participantLocations.map(p => p.userId));

        // Update or Create Markers
        participantLocations.forEach(p => {
            if (participantMarkers.current[p.userId]) {
                // Smooth update
                participantMarkers.current[p.userId].setLngLat([p.longitude, p.latitude]);
            } else {
                const el = document.createElement('div');
                el.className = 'w-3 h-3 bg-indigo-500 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-150 cursor-pointer';
                el.title = p.name || 'User';

                const marker = new mapboxgl.Marker(el)
                    .setLngLat([p.longitude, p.latitude])
                    .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`<div class="text-slate-900 font-bold text-xs p-1">${p.name || 'Participant'}</div>`))
                    .addTo(map.current);
                
                // Show popup on hover
                el.addEventListener('mouseenter', () => marker.togglePopup());
                el.addEventListener('mouseleave', () => marker.togglePopup());

                participantMarkers.current[p.userId] = marker;
            }
        });

        // Remove stale markers
        Object.keys(participantMarkers.current).forEach(id => {
            if (!activeIds.has(id)) {
                participantMarkers.current[id].remove();
                delete participantMarkers.current[id];
            }
        });

    }, [participantLocations, participantDisplayMode, mapLoaded]);

    return <div ref={mapContainer} className="w-full h-full" />;
});

export default MapComponent;
