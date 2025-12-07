import React, { useRef, useEffect, useImperativeHandle, forwardRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import MapboxDraw from '@mapbox/mapbox-gl-draw';
import 'mapbox-gl/dist/mapbox-gl.css';
import '@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css';
import * as turf from '@turf/turf';
import { SpotType } from '../types';

// Icon dan color mapping untuk setiap tipe spot (sesuai Prisma enum SpotType)
const spotConfig = {
    [SpotType.ENTRY_GATE]: {
        icon: '<path fill-rule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm10.72 4.72a.75.75 0 011.06 0l3 3a.75.75 0 010 1.06l-3 3a.75.75 0 11-1.06-1.06l1.72-1.72H9a.75.75 0 010-1.5h10.94l-1.72-1.72a.75.75 0 010-1.06z" clip-rule="evenodd" />',
        color: 'bg-green-600',
        label: 'Pintu Masuk'
    },
    [SpotType.EXIT_GATE]: {
        icon: '<path fill-rule="evenodd" d="M7.5 3.75A1.5 1.5 0 006 5.25v13.5a1.5 1.5 0 001.5 1.5h6a1.5 1.5 0 001.5-1.5V15a.75.75 0 011.5 0v3.75a3 3 0 01-3 3h-6a3 3 0 01-3-3V5.25a3 3 0 013-3h6a3 3 0 013 3V9A.75.75 0 0115 9V5.25a1.5 1.5 0 00-1.5-1.5h-6zm5.03 4.72a.75.75 0 010 1.06l-1.72 1.72h10.94a.75.75 0 010 1.5H10.81l1.72 1.72a.75.75 0 11-1.06 1.06l-3-3a.75.75 0 010-1.06l3-3a.75.75 0 011.06 0z" clip-rule="evenodd" />',
        color: 'bg-red-600',
        label: 'Pintu Keluar'
    },
    [SpotType.CHECKPOINT]: {
        icon: '<path fill-rule="evenodd" d="M8.603 3.799A4.49 4.49 0 0112 2.25c1.357 0 2.573.6 3.397 1.549a4.49 4.49 0 013.498 1.307 4.491 4.491 0 011.307 3.497A4.49 4.49 0 0121.75 12a4.49 4.49 0 01-1.549 3.397 4.491 4.491 0 01-1.307 3.497 4.491 4.491 0 01-3.497 1.307A4.49 4.49 0 0112 21.75a4.49 4.49 0 01-3.397-1.549 4.49 4.49 0 01-3.498-1.306 4.491 4.491 0 01-1.307-3.498A4.49 4.49 0 012.25 12c0-1.357.6-2.573 1.549-3.397a4.49 4.49 0 011.307-3.497 4.49 4.49 0 013.497-1.307zm7.007 6.387a.75.75 0 10-1.22-.872l-3.236 4.53L9.53 12.22a.75.75 0 00-1.06 1.06l2.25 2.25a.75.75 0 001.14-.094l3.75-5.25z" clip-rule="evenodd" />',
        color: 'bg-blue-600',
        label: 'Checkpoint'
    },
    [SpotType.SHELTER]: {
        icon: '<path d="M11.47 3.84a.75.75 0 011.06 0l8.69 8.69a.75.75 0 101.06-1.06l-8.689-8.69a2.25 2.25 0 00-3.182 0l-8.69 8.69a.75.75 0 001.061 1.06l8.69-8.69z" /><path d="M12 5.432l8.159 8.159c.03.03.06.058.091.086v6.198c0 1.035-.84 1.875-1.875 1.875H15a.75.75 0 01-.75-.75v-4.5a.75.75 0 00-.75-.75h-3a.75.75 0 00-.75.75V21a.75.75 0 01-.75.75H5.625a1.875 1.875 0 01-1.875-1.875v-6.198a2.29 2.29 0 00.091-.086L12 5.43z" />',
        color: 'bg-orange-600',
        label: 'Tempat Perlindungan'
    },
    [SpotType.INFO_CENTER]: {
        icon: '<path fill-rule="evenodd" d="M2.25 12c0-5.385 4.365-9.75 9.75-9.75s9.75 4.365 9.75 9.75-4.365 9.75-9.75 9.75S2.25 17.385 2.25 12zm8.706-1.442c1.146-.573 2.437.463 2.126 1.706l-.709 2.836.042-.02a.75.75 0 01.67 1.34l-.04.022c-1.147.573-2.438-.463-2.127-1.706l.71-2.836-.042.02a.75.75 0 11-.671-1.34l.041-.022zM12 9a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />',
        color: 'bg-cyan-600',
        label: 'Pusat Informasi'
    },
    [SpotType.STAGE]: {
        icon: '<path fill-rule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" clip-rule="evenodd" />',
        color: 'bg-purple-600',
        label: 'Panggung'
    },
    [SpotType.REST_AREA]: {
        icon: '<path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" />',
        color: 'bg-pink-600',
        label: 'Area Istirahat'
    },
    [SpotType.VIEW_POINT]: {
        icon: '<path d="M12 15a3 3 0 100-6 3 3 0 000 6z" /><path fill-rule="evenodd" d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.471-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z" clip-rule="evenodd" />',
        color: 'bg-teal-600',
        label: 'Titik Pandang'
    },
    [SpotType.DANGER_ZONE]: {
        icon: '<path fill-rule="evenodd" d="M9.401 3.003c1.155-2 4.043-2 5.197 0l7.355 12.748c1.154 2-.29 4.5-2.599 4.5H4.645c-2.309 0-3.752-2.5-2.598-4.5L9.4 3.003zM12 8.25a.75.75 0 01.75.75v3.75a.75.75 0 01-1.5 0V9a.75.75 0 01.75-.75zm0 8.25a.75.75 0 100-1.5.75.75 0 000 1.5z" clip-rule="evenodd" />',
        color: 'bg-red-700',
        label: 'Zona Bahaya'
    },
    [SpotType.MEETING_POINT]: {
        icon: '<path d="M4.5 6.375a4.125 4.125 0 118.25 0 4.125 4.125 0 01-8.25 0zM14.25 8.625a3.375 3.375 0 116.75 0 3.375 3.375 0 01-6.75 0zM1.5 19.125a7.125 7.125 0 0114.25 0v.003l-.001.119a.75.75 0 01-.363.63 13.067 13.067 0 01-6.761 1.873c-2.472 0-4.786-.684-6.76-1.873a.75.75 0 01-.364-.63l-.001-.122zM17.25 19.128l-.001.144a2.25 2.25 0 01-.233.96 10.088 10.088 0 005.06-1.01.75.75 0 00.42-.643 4.875 4.875 0 00-6.957-4.611 8.586 8.586 0 011.71 5.157v.003z" />',
        color: 'bg-indigo-600',
        label: 'Titik Kumpul'
    },
    [SpotType.HOSPITAL]: {
        icon: '<path fill-rule="evenodd" d="M8.161 2.58a1.875 1.875 0 011.678 0l4.993 2.498c.106.052.23.052.336 0l3.869-1.935A1.875 1.875 0 0121.75 4.82v12.485c0 .71-.401 1.36-1.037 1.677l-4.875 2.437a1.875 1.875 0 01-1.676 0l-4.994-2.497a.375.375 0 00-.336 0l-3.868 1.935A1.875 1.875 0 012.25 19.18V6.695c0-.71.401-1.36 1.036-1.677l4.875-2.437zM9 6a.75.75 0 01.75.75V9h2.25a.75.75 0 010 1.5H9.75v2.25a.75.75 0 01-1.5 0v-2.25H6a.75.75 0 010-1.5h2.25V6.75A.75.75 0 019 6z" clip-rule="evenodd" />',
        color: 'bg-rose-600',
        label: 'Rumah Sakit/Medis'
    },
    [SpotType.OTHER]: {
        icon: '<path fill-rule="evenodd" d="M11.54 22.351l.07.04.028.016a.76.76 0 00.723 0l.028-.015.071-.041a16.975 16.975 0 001.144-.742 19.58 19.58 0 002.683-2.282c1.944-1.99 3.963-4.98 3.963-8.827a8.25 8.25 0 00-16.5 0c0 3.846 2.02 6.837 3.963 8.827a19.58 19.58 0 002.682 2.282 16.975 16.975 0 001.145.742zM12 13.5a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd" />',
        color: 'bg-gray-600',
        label: 'Lainnya'
    }
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

        // Listen for polygon creation only in manage zones mode
        const handleDrawCreate = (e) => {
            if (!isManageZonesMode || !e.features || !e.features.length) return;
            const feature = e.features[0];
            if (feature.geometry.type === 'Polygon' && typeof onZoneCreated === 'function') {
                onZoneCreated(feature);
            }
        };
        if (isManageZonesMode) {
            map.current.on('draw.create', handleDrawCreate);
        }
        return () => {
            if (map.current) {
                map.current.off('draw.create', handleDrawCreate);
            }
        };
    }, [isManageZonesMode, mapLoaded, onZoneCreated]);

    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        
        console.log('🔴 [MapComponent ZONES useEffect] TRIGGERED');
        console.log('🔴 [MapComponent] Zones prop changed:', zones);
        console.log('🔴 [MapComponent] Zones length:', zones?.length);
        
        // ✅ CLEANUP: REMOVE existing layers and source
        if (map.current.getLayer('zones-fill')) {
            map.current.removeLayer('zones-fill');
            console.log('[MapComponent] ✓ Removed zones-fill layer');
        }
        if (map.current.getLayer('zones-line')) {
            map.current.removeLayer('zones-line');
            console.log('[MapComponent] ✓ Removed zones-line layer');
        }
        if (map.current.getSource('zones-data')) {
            map.current.removeSource('zones-data');
            console.log('[MapComponent] ✓ Removed zones-data source');
        }
        
        // Ensure zones is always an array
        const safeZones = Array.isArray(zones) ? zones : [];
        console.log('[MapComponent] Safe zones count:', safeZones.length);
        
        // ✅ EARLY RETURN: Jika tidak ada zones, stop disini (setelah cleanup)
        if (safeZones.length === 0) {
            console.log('[MapComponent] ⚠️ No zones to display - cleanup done');
            return;
        }
        
        // Prepare GeoJSON features
        const features = safeZones
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
        
        console.log('[MapComponent] Zone features prepared:', features.length);
        
        // ✅ RE-ADD source and layers (same strategy as spots)
        const addZonesSourceAndLayers = () => {
            // Add source
            map.current.addSource('zones-data', { 
                type: 'geojson', 
                data: { type: 'FeatureCollection', features } 
            });
            console.log('[MapComponent] ✅ Added zones-data source');
            
            // Add fill layer
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
            console.log('[MapComponent] ✅ Added zones-fill layer');
            
            // Add line layer
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
            console.log('[MapComponent] ✅ Added zones-line layer');
        };
        
        // Wait for style to be loaded before adding
        if (map.current.isStyleLoaded()) {
            addZonesSourceAndLayers();
        } else {
            console.log('[MapComponent] ⏳ Waiting for style to load...');
            const onStyleData = () => {
                if (map.current.isStyleLoaded()) {
                    addZonesSourceAndLayers();
                    map.current.off('styledata', onStyleData);
                }
            };
            map.current.on('styledata', onStyleData);
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
        
        console.log('🟢 [MapComponent SPOTS useEffect] TRIGGERED');
        console.log('🟢 [MapComponent] Spots prop changed:', spots);
        console.log('🟢 [MapComponent] Spots length:', spots?.length);
        
        // ✅ CLEANUP: Remove all spot markers before re-adding
        Object.keys(spotMarkers.current).forEach(id => {
            spotMarkers.current[id].remove();
            delete spotMarkers.current[id];
        });
        console.log('[MapComponent] ✓ Cleaned up', Object.keys(spotMarkers.current).length, 'spot markers');
        
        // Ensure spots is always an array
        const safeSpots = Array.isArray(spots) ? spots : [];
        console.log('[MapComponent] Safe spots count:', safeSpots.length);
        
        // ✅ EARLY RETURN: Jika tidak ada spots, stop disini (setelah cleanup)
        if (safeSpots.length === 0) {
            console.log('[MapComponent] ⚠️ No spots to display - cleanup done');
            return;
        }
        
        // ✅ RE-ADD: Tambahkan spots baru
        safeSpots.forEach(spot => {
            const config = spotConfig[spot.type] || spotConfig[SpotType.OTHER];
            
            const el = document.createElement('div');
            el.className = `w-7 h-7 ${config.color} border-2 border-white rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform cursor-pointer`;
            el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">${config.icon}</svg>`;

            // Label untuk popup
            let typeLabel = config.label;
            if (spot.type === SpotType.OTHER && spot.customType) {
                typeLabel = spot.customType;
            }

            const marker = new mapboxgl.Marker(el)
                .setLngLat([spot.longitude, spot.latitude])
                .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
                    <div class="p-1" style="color:#fff;">
                        <div class="font-bold text-xs" style="color:#fff;">${spot.name}</div>
                        <div class="text-xs" style="color:#a7f3d0;">${typeLabel}</div>
                    </div>
                `))
                .addTo(map.current);

            spotMarkers.current[spot.id] = marker;
        });
    }, [spots, mapLoaded]);


    useEffect(() => {
        if (!map.current || !mapLoaded) return;
        
        console.log('🗺️ [MapComponent] useEffect triggered - updating markers');
        console.log('🗺️ [MapComponent] Participant locations:', participantLocations?.length || 0);
        console.log('🗺️ [MapComponent] Current spot markers:', Object.keys(spotMarkers.current).length);
        console.log('🗺️ [MapComponent] Map has zones-fill layer:', !!map.current.getLayer('zones-fill'));
        
        // 🔧 FIX: Re-add zones if they're missing
        const hasZonesLayer = !!map.current.getLayer('zones-fill');
        const hasZonesSource = !!map.current.getSource('zones-data');
        const shouldHaveZones = Array.isArray(zones) && zones.length > 0;
        
        if (shouldHaveZones && (!hasZonesLayer || !hasZonesSource)) {
            console.log('🔧 [MapComponent] Auto-recovering zones...');
            
            const reAddZones = () => {
                try {
                    // Remove existing if any
                    if (map.current.getLayer('zones-fill')) {
                        map.current.removeLayer('zones-fill');
                    }
                    if (map.current.getLayer('zones-line')) {
                        map.current.removeLayer('zones-line');
                    }
                    if (map.current.getSource('zones-data')) {
                        map.current.removeSource('zones-data');
                    }
                    
                    // Prepare features
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
                    
                    // Re-add source
                    map.current.addSource('zones-data', { 
                        type: 'geojson', 
                        data: { type: 'FeatureCollection', features } 
                    });
                    
                    // Re-add fill layer
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
                    
                    // Re-add line layer
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
                    
                    console.log('✅ [MapComponent] Zones re-added successfully');
                } catch (err) {
                    console.error('❌ [MapComponent] Failed to re-add zones:', err);
                }
            };
            
            // Wait for style to be loaded before re-adding
            if (map.current.isStyleLoaded()) {
                reAddZones();
            } else {
                console.log('⏳ [MapComponent] Waiting for map style...');
                const onStyleData = () => {
                    if (map.current.isStyleLoaded()) {
                        reAddZones();
                        map.current.off('styledata', onStyleData);
                    }
                };
                map.current.on('styledata', onStyleData);
            }
        }
        
        // 🔧 FIX: Re-add spots if they're missing
        const currentSpotMarkersCount = Object.keys(spotMarkers.current).length;
        const shouldHaveSpots = Array.isArray(spots) && spots.length > 0;
        
        if (shouldHaveSpots && currentSpotMarkersCount === 0) {
            console.warn('⚠️ [MapComponent] Spots missing! Should have:', spots.length, 'spots but have:', currentSpotMarkersCount);
            console.warn('⚠️ [MapComponent] Re-adding spots...');
            
            const reAddSpots = () => {
                try {
                    spots.forEach(spot => {
                        const config = spotConfig[spot.type] || spotConfig[SpotType.OTHER];
                        
                        const el = document.createElement('div');
                        el.className = `w-7 h-7 ${config.color} border-2 border-white rounded-full flex items-center justify-center text-white shadow-lg hover:scale-110 transition-transform cursor-pointer`;
                        el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="w-5 h-5">${config.icon}</svg>`;

                        let typeLabel = config.label;
                        if (spot.type === SpotType.OTHER && spot.customType) {
                            typeLabel = spot.customType;
                        }

                        const marker = new mapboxgl.Marker(el)
                            .setLngLat([spot.longitude, spot.latitude])
                            .setPopup(new mapboxgl.Popup({ offset: 25, closeButton: false }).setHTML(`
                                <div class="p-1" style="color:#fff;">
                                    <div class="font-bold text-xs" style="color:#fff;">${spot.name}</div>
                                    <div class="text-xs" style="color:#a7f3d0;">${typeLabel}</div>
                                </div>
                            `))
                            .addTo(map.current);

                        spotMarkers.current[spot.id] = marker;
                    });
                    
                    console.log('✅ [MapComponent] Spots re-added successfully. Total:', Object.keys(spotMarkers.current).length);
                } catch (err) {
                    console.error('❌ [MapComponent] Failed to re-add spots:', err);
                }
            };
            
            // Spots are markers (not layers), so no need to wait for style
            reAddSpots();
        } else if (shouldHaveSpots && currentSpotMarkersCount > 0) {
            // Spots exist in memory, but might be detached from map - re-attach them
            console.log('🔧 [MapComponent] Re-attaching spots...');
            try {
                spots.forEach(spot => {
                    if (spotMarkers.current[spot.id]) {
                        // Re-add existing marker to map
                        spotMarkers.current[spot.id].addTo(map.current);
                    }
                });
                console.log('✅ [MapComponent] Spots re-attached');
            } catch (err) {
                console.error('❌ [MapComponent] Failed to re-attach spots:', err);
            }
        }
        
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
        // Dots logic with color classification
        const activeIds = new Set(safeParticipantLocations.map(p => p.userId));
        
        // Helper function to find which zone a participant is in
        const findParticipantZone = (participant) => {
            if (participant.lastGeofenceStatus !== 'INSIDE') return null;
            
            const safeZones = Array.isArray(zones) ? zones : [];
            for (const zone of safeZones) {
                if (!zone.area || !zone.area.coordinates) continue;
                
                try {
                    const point = turf.point([participant.longitude, participant.latitude]);
                    const polygon = turf.polygon(zone.area.coordinates);
                    
                    if (turf.booleanPointInPolygon(point, polygon)) {
                        return zone;
                    }
                } catch (err) {
                    console.error('Error checking zone:', err);
                }
            }
            return null;
        };
        
        // Helper function to determine marker color and status
        const getMarkerStyle = (participant) => {
            const isInside = participant.lastGeofenceStatus === 'INSIDE';
            const lastUpdate = participant.lastUpdatedAt ? new Date(participant.lastUpdatedAt) : null;
            const now = new Date();
            const minutesSinceUpdate = lastUpdate ? (now - lastUpdate) / 1000 / 60 : 999;
            
            // Find zone if inside
            const currentZone = isInside ? findParticipantZone(participant) : null;
            
            // Classification:
            // 1. Green: Inside area & active (updated < 5 min)
            // 2. Yellow: Inside area but stale (updated 5-15 min ago)
            // 3. Orange: Inside area but very stale (updated > 15 min)
            // 4. Red: Outside area & active
            // 5. Gray: Outside area & stale/inactive
            
            if (isInside) {
                if (minutesSinceUpdate < 5) {
                    return {
                        color: 'bg-green-500',
                        ringColor: 'ring-green-300',
                        statusText: currentZone ? `Di zona: ${currentZone.name}` : 'Di dalam area',
                        statusColor: 'text-green-600',
                        bgColor: 'bg-green-100 dark:bg-green-900',
                        label: 'Aktif',
                        zoneName: currentZone?.name || null,
                        zoneColor: currentZone?.color || null
                    };
                } else if (minutesSinceUpdate < 15) {
                    return {
                        color: 'bg-yellow-500',
                        ringColor: 'ring-yellow-300',
                        statusText: currentZone ? `Di zona: ${currentZone.name}` : 'Di dalam area',
                        statusColor: 'text-yellow-600',
                        bgColor: 'bg-yellow-100 dark:bg-yellow-900',
                        label: 'Update lambat',
                        zoneName: currentZone?.name || null,
                        zoneColor: currentZone?.color || null
                    };
                } else {
                    return {
                        color: 'bg-orange-500',
                        ringColor: 'ring-orange-300',
                        statusText: currentZone ? `Di zona: ${currentZone.name}` : 'Di dalam area',
                        statusColor: 'text-orange-600',
                        bgColor: 'bg-orange-100 dark:bg-orange-900',
                        label: 'Tidak aktif',
                        zoneName: currentZone?.name || null,
                        zoneColor: currentZone?.color || null
                    };
                }
            } else {
                if (minutesSinceUpdate < 5) {
                    return {
                        color: 'bg-red-500',
                        ringColor: 'ring-red-300',
                        statusText: 'Di luar area',
                        statusColor: 'text-red-600',
                        bgColor: 'bg-red-100 dark:bg-red-900',
                        label: 'Keluar zona!',
                        zoneName: null,
                        zoneColor: null
                    };
                } else {
                    return {
                        color: 'bg-gray-500',
                        ringColor: 'ring-gray-300',
                        statusText: 'Di luar area',
                        statusColor: 'text-gray-600',
                        bgColor: 'bg-gray-100 dark:bg-gray-900',
                        label: 'Offline',
                        zoneName: null,
                        zoneColor: null
                    };
                }
            }
        };
        
        safeParticipantLocations.forEach(p => {
            const style = getMarkerStyle(p);
            
            console.log('🗺️ [MapComponent] Processing participant:', {
                userId: p.userId,
                name: p.user?.name || p.name,
                lat: p.latitude?.toFixed(4),
                lng: p.longitude?.toFixed(4),
                status: p.lastGeofenceStatus,
                hasMarker: !!participantMarkers.current[p.userId]
            });
            
            if (participantMarkers.current[p.userId]) {
                // Update existing marker position
                const oldLngLat = participantMarkers.current[p.userId].getLngLat();
                console.log('[MapComponent] Updating marker position from:', 
                    `${oldLngLat.lat.toFixed(4)}, ${oldLngLat.lng.toFixed(4)}`,
                    'to:',
                    `${p.latitude.toFixed(4)}, ${p.longitude.toFixed(4)}`
                );
                
                // 🔧 FIX: Re-attach marker to map if detached
                participantMarkers.current[p.userId].addTo(map.current);
                
                participantMarkers.current[p.userId].setLngLat([p.longitude, p.latitude]);
                
                // Update marker color based on classification
                const markerEl = participantMarkers.current[p.userId].getElement();
                markerEl.className = `w-4 h-4 ${style.color} rounded-full border-2 border-white shadow-lg transition-all hover:scale-150 cursor-pointer ${style.color.includes('green') || style.color.includes('red') ? 'animate-pulse' : ''} hover:ring-2 ${style.ringColor}`;
                
                // Update popup content with latest info
                const popup = participantMarkers.current[p.userId].getPopup();
                const lastUpdate = p.lastUpdatedAt ? new Date(p.lastUpdatedAt) : null;
                const minutesAgo = lastUpdate ? Math.floor((new Date() - lastUpdate) / 1000 / 60) : null;
                const attendanceStatus = p.attendanceStatus || 'PENDING';
                const attendanceBadge = {
                    'PENDING': '<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold">PENDING</span>',
                    'PRESENT': '<span class="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold">✓ PRESENT</span>',
                    'ABSENT': '<span class="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold">✗ ABSENT</span>'
                }[attendanceStatus];
                
                const avatarUrl = p.user?.avatarUrl || null;
                const avatarHTML = avatarUrl 
                    ? `<img src="${avatarUrl}" alt="${p.user?.name || p.name || 'User'}" class="w-6 h-6 rounded-full object-cover border border-gray-300 dark:border-gray-600" />` 
                    : `<div class="w-6 h-6 rounded-full ${style.bgColor} flex items-center justify-center">
                        <svg class="w-4 h-4 ${style.statusColor} dark:${style.statusColor.replace('text-', 'text-')}" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                        </svg>
                    </div>`;
                
                popup.setHTML(`
                    <div class="text-slate-900 dark:text-white p-2 min-w-[220px]">
                        <div class="font-bold text-sm mb-2 flex items-center gap-2">
                            ${avatarHTML}
                            <span>${p.user?.name || p.name || 'Participant'}</span>
                        </div>
                        <div class="text-xs space-y-1.5 text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-2">
                            <div class="flex items-center justify-between gap-2">
                                <div class="flex items-center gap-2">
                                    <svg class="w-3.5 h-3.5 ${style.statusColor} flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span class="font-medium">${style.statusText}</span>
                                </div>
                                <span class="text-[10px] px-1.5 py-0.5 rounded ${style.bgColor} ${style.statusColor} font-semibold">${style.label}</span>
                            </div>
                            <div class="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                                <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400">Attendance:</span>
                                ${attendanceBadge}
                            </div>
                            <div class="flex items-center gap-2 text-[10px] opacity-75">
                                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                <span>${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}</span>
                            </div>
                            ${p.lastUpdatedAt ? `
                                <div class="flex items-center gap-2 text-[10px] opacity-75">
                                    <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span>${new Date(p.lastUpdatedAt).toLocaleTimeString('id-ID')}${minutesAgo !== null ? ` (${minutesAgo} menit lalu)` : ''}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `);
            } else {
                // Create new marker
                const el = document.createElement('div');
                el.className = `w-4 h-4 ${style.color} rounded-full border-2 border-white shadow-lg transition-all hover:scale-150 cursor-pointer ${style.color.includes('green') || style.color.includes('red') ? 'animate-pulse' : ''} hover:ring-2 ${style.ringColor}`;
                
                const lastUpdate = p.lastUpdatedAt ? new Date(p.lastUpdatedAt) : null;
                const minutesAgo = lastUpdate ? Math.floor((new Date() - lastUpdate) / 1000 / 60) : null;
                const attendanceStatus = p.attendanceStatus || 'PENDING';
                const attendanceBadge = {
                    'PENDING': '<span class="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 font-semibold">PENDING</span>',
                    'PRESENT': '<span class="text-[10px] px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 font-semibold">✓ PRESENT</span>',
                    'ABSENT': '<span class="text-[10px] px-1.5 py-0.5 rounded bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 font-semibold">✗ ABSENT</span>'
                }[attendanceStatus];
                
                const avatarUrl = p.user?.avatarUrl || null;
                const avatarHTML = avatarUrl 
                    ? `<img src="${avatarUrl}" alt="${p.user?.name || p.name || 'User'}" class="w-6 h-6 rounded-full object-cover border border-gray-300 dark:border-gray-600" />` 
                    : `<div class="w-6 h-6 rounded-full ${style.bgColor} flex items-center justify-center">
                        <svg class="w-4 h-4 ${style.statusColor} dark:${style.statusColor.replace('text-', 'text-')}" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"/>
                        </svg>
                    </div>`;
                
                const popupHTML = `
                    <div class="text-slate-900 dark:text-white p-2 min-w-[220px]">
                        <div class="font-bold text-sm mb-2 flex items-center gap-2">
                            ${avatarHTML}
                            <span>${p.user?.name || p.name || 'Participant'}</span>
                        </div>
                        <div class="text-xs space-y-1.5 text-gray-600 dark:text-gray-300 border-t border-gray-200 dark:border-gray-700 pt-2">
                            <div class="flex items-center justify-between gap-2">
                                <div class="flex items-center gap-2">
                                    <svg class="w-3.5 h-3.5 ${style.statusColor} flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span class="font-medium">${style.statusText}</span>
                                </div>
                                <span class="text-[10px] px-1.5 py-0.5 rounded ${style.bgColor} ${style.statusColor} font-semibold">${style.label}</span>
                            </div>
                            <div class="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
                                <span class="text-[10px] font-medium text-gray-500 dark:text-gray-400">Attendance:</span>
                                ${attendanceBadge}
                            </div>
                            <div class="flex items-center gap-2 text-[10px] opacity-75">
                                <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                                </svg>
                                <span>${p.latitude.toFixed(6)}, ${p.longitude.toFixed(6)}</span>
                            </div>
                            ${p.lastUpdatedAt ? `
                                <div class="flex items-center gap-2 text-[10px] opacity-75">
                                    <svg class="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                                    </svg>
                                    <span>${new Date(p.lastUpdatedAt).toLocaleTimeString('id-ID')}${minutesAgo !== null ? ` (${minutesAgo} menit lalu)` : ''}</span>
                                </div>
                            ` : ''}
                        </div>
                    </div>
                `;
                
                const marker = new mapboxgl.Marker(el)
                    .setLngLat([p.longitude, p.latitude])
                    .setPopup(
                        new mapboxgl.Popup({ 
                            offset: 25, 
                            closeButton: false,
                            className: 'participant-popup'
                        }).setHTML(popupHTML)
                    )
                    .addTo(map.current);
                
                // Toggle popup on hover
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
                className="w-full h-full min-h-[400px] bg-white dark:bg-slate-800 rounded-xl border border-gray-200 dark:border-slate-700"
                style={{ minHeight: 400, borderRadius: '0.75rem' }}
            />
        );
});

export default MapComponent;