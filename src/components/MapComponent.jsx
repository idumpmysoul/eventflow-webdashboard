
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
    onZoneDeleted
}, ref) => {
    const mapContainer = useRef(null);
    const map = useRef(null);
    const draw = useRef(null);
    const incidentMarker = useRef(null);
    const [mapLoaded, setMapLoaded] = useState(false);

    // --- Map Initialization ---
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

        // Initialize Mapbox Draw
        draw.current = new MapboxDraw({
            displayControlsDefault: false,
            controls: {
                polygon: true,
                trash: true
            },
            // Styles for the draw tool to make it visible in both themes
            styles: [
                // ACTIVE (being drawn)
                // line stroke
                {
                    "id": "gl-draw-line",
                    "type": "line",
                    "filter": ["all", ["==", "$type", "LineString"], ["!=", "mode", "static"]],
                    "layout": {
                        "line-cap": "round",
                        "line-join": "round"
                    },
                    "paint": {
                        "line-color": "#fbb03b",
                        "line-dasharray": [0.2, 2],
                        "line-width": 2
                    }
                },
                // polygon fill
                {
                    "id": "gl-draw-polygon-fill-active",
                    "type": "fill",
                    "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
                    "paint": {
                        "fill-color": "#fbb03b",
                        "fill-outline-color": "#fbb03b",
                        "fill-opacity": 0.1
                    }
                },
                // polygon mid points
                {
                    "id": "gl-draw-polygon-midpoint",
                    "type": "circle",
                    "filter": ["all", ["==", "$type", "Point"], ["==", "meta", "midpoint"]],
                    "paint": {
                        "circle-radius": 3,
                        "circle-color": "#fbb03b"
                    }
                },
                // polygon outline stroke
                {
                    "id": "gl-draw-polygon-stroke-active",
                    "type": "line",
                    "filter": ["all", ["==", "$type", "Polygon"], ["!=", "mode", "static"]],
                    "layout": {
                        "line-cap": "round",
                        "line-join": "round"
                    },
                    "paint": {
                        "line-color": "#fbb03b",
                        "line-dasharray": [0.2, 2],
                        "line-width": 2
                    }
                },
                // vertex point halos
                {
                    "id": "gl-draw-polygon-and-line-vertex-halo-active",
                    "type": "circle",
                    "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
                    "paint": {
                        "circle-radius": 5,
                        "circle-color": "#FFF"
                    }
                },
                // vertex points
                {
                    "id": "gl-draw-polygon-and-line-vertex-active",
                    "type": "circle",
                    "filter": ["all", ["==", "meta", "vertex"], ["==", "$type", "Point"], ["!=", "mode", "static"]],
                    "paint": {
                        "circle-radius": 3,
                        "circle-color": "#fbb03b"
                    }
                },
            ]
        });

        map.current.on('load', () => {
            if (!map.current) return;
            setMapLoaded(true);

            // Add participant data source
            map.current.addSource('participants-data', {
                'type': 'geojson',
                'data': {
                    'type': 'FeatureCollection',
                    'features': []
                }
            });

            // Add Zones sources
            map.current.addSource('zones-data', {
                'type': 'geojson',
                'data': { 'type': 'FeatureCollection', 'features': [] }
            });
            map.current.addSource('zones-labels', {
                'type': 'geojson',
                'data': { 'type': 'FeatureCollection', 'features': [] }
            });

            // --- ZONES LAYERS (Add these FIRST so they are below participants) ---
            // 1. Fill Layer
            map.current.addLayer({
                id: 'zones-fill',
                type: 'fill',
                source: 'zones-data',
                paint: {
                    'fill-color': ['get', 'color'],
                    'fill-opacity': 0.3
                }
            });

            // 2. Line Layer (Border)
            map.current.addLayer({
                id: 'zones-line',
                type: 'line',
                source: 'zones-data',
                paint: {
                    'line-color': ['get', 'color'],
                    'line-width': 2
                }
            });

            // 3. Symbol Layer (Labels & Counts)
            map.current.addLayer({
                id: 'zones-symbol',
                type: 'symbol',
                source: 'zones-labels',
                layout: {
                    'text-field': ['get', 'label'],
                    'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
                    'text-size': 14,
                    'text-anchor': 'center',
                    'text-offset': [0, 0]
                },
                paint: {
                    'text-color': theme === 'dark' ? '#ffffff' : '#000000',
                    'text-halo-color': theme === 'dark' ? '#000000' : '#ffffff',
                    'text-halo-width': 2
                }
            });

            // --- PARTICIPANT LAYERS (Add these SECOND so they are on top) ---
            if (participantDisplayMode === 'heatmap') {
                map.current.addLayer({
                    id: 'heatmap-layer',
                    type: 'heatmap',
                    source: 'participants-data',
                    maxzoom: 15,
                    paint: {
                         'heatmap-weight': 1,
                         'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 11, 1, 15, 3],
                        'heatmap-color': ['interpolate', ['linear'], ['heatmap-density'], 0, 'rgba(33,102,172,0)', 0.2, 'rgb(103,169,207)', 0.4, 'rgb(209,229,240)', 0.6, 'rgb(253,219,199)', 0.8, 'rgb(239,138,98)', 1, 'rgb(178,24,43)'],
                        'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 11, 15, 15, 20],
                        'heatmap-opacity': ['interpolate', ['linear'], ['zoom'], 14, 1, 15, 0]
                    }
                }, 'waterway-label');
            } else { // 'dots' mode
                 map.current.addLayer({
                    id: 'dots-layer',
                    type: 'circle',
                    source: 'participants-data',
                    paint: {
                        'circle-radius': 6, // Increased for visibility
                        'circle-color': '#14B4D6', 
                        'circle-opacity': 1, // Opaque to stand out
                        'circle-stroke-width': 2, // White border
                        'circle-stroke-color': '#ffffff'
                    }
                });

                // Popup handler
                map.current.on('click', 'dots-layer', (e) => {
                    if (e.features && e.features.length > 0) {
                        const feature = e.features[0];
                        const coordinates = feature.geometry.coordinates.slice();
                        const participantName = feature.properties.name || 'Participant';
                        const description = `Lat: ${coordinates[1].toFixed(4)}, Lng: ${coordinates[0].toFixed(4)}`;

                        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
                            coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
                        }

                        new mapboxgl.Popup()
                            .setLngLat(coordinates)
                            .setHTML(`<strong>${participantName}</strong><br>${description}`)
                            .addTo(map.current);
                    }
                });

                map.current.on('mouseenter', 'dots-layer', () => {
                    if (map.current) map.current.getCanvas().style.cursor = 'pointer';
                });
                map.current.on('mouseleave', 'dots-layer', () => {
                    if (map.current) map.current.getCanvas().style.cursor = '';
                });
            }

            // --- DRAW EVENTS ---
            map.current.on('draw.create', (e) => {
                if (onZoneCreated) {
                    const feature = e.features[0];
                    onZoneCreated(feature);
                    // Remove from draw immediately so it doesn't duplicate visually with our managed layer.
                    // We'll re-add it properly via props.
                    draw.current.delete(feature.id);
                }
            });
        });

        return () => {
            map.current?.remove();
            map.current = null;
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [center, mapboxToken, participantDisplayMode, theme]);

    // --- Manage Drawing Control Visibility ---
    useEffect(() => {
        if (!map.current || !mapLoaded) return;

        if (isManageZonesMode) {
            if (!map.current.hasControl(draw.current)) {
                map.current.addControl(draw.current, 'top-right');
                
                // Re-order layers to ensure participants are visible above draw controls/layers
                // Draw layers usually sit on top when added, so we move our custom dots layer to top.
                if (map.current.getLayer('dots-layer')) {
                    map.current.moveLayer('dots-layer');
                }
                if (map.current.getLayer('heatmap-layer')) {
                    map.current.moveLayer('heatmap-layer');
                }
            }
        } else {
            if (map.current.hasControl(draw.current)) {
                map.current.removeControl(draw.current);
            }
        }
    }, [isManageZonesMode, mapLoaded]);

    // --- Update Participant Data ---
    useEffect(() => {
        if (!map.current || !mapLoaded || !participantLocations) return;

        const geojsonData = {
            type: 'FeatureCollection',
            features: participantLocations.map(loc => ({
                type: 'Feature',
                properties: {
                    name: loc.name || 'Unknown Participant',
                },
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
    }, [participantLocations, mapLoaded]);

    // --- Update Zones & Calculate Density ---
    useEffect(() => {
        if (!map.current || !mapLoaded || !zones) return;

        // 1. Prepare Zone GeoJSON for display
        const zonesGeoJSON = {
            type: 'FeatureCollection',
            features: zones.map(zone => ({
                type: 'Feature',
                id: zone.id,
                properties: {
                    color: zone.color || '#888888',
                    name: zone.name
                },
                geometry: zone.area.geometry || zone.area // Handle direct geometry or feature wrapper
            }))
        };

        const zonesSource = map.current.getSource('zones-data');
        if (zonesSource) {
            zonesSource.setData(zonesGeoJSON);
        }

        // 2. Calculate Density and Create Labels
        if (participantLocations && participantLocations.length > 0) {
            const participantPoints = turf.featureCollection(
                participantLocations.map(loc => turf.point([loc.longitude, loc.latitude]))
            );

            const labelsFeatures = zones.map(zone => {
                const polygon = zone.area.geometry || zone.area;
                
                // Count points in polygon
                let count = 0;
                try {
                    // turf.pointsWithinPolygon requires a FeatureCollection of points and a FeatureCollection of Polygons
                    const zoneFeature = turf.feature(polygon);
                    const ptsWithin = turf.pointsWithinPolygon(participantPoints, turf.featureCollection([zoneFeature]));
                    count = ptsWithin.features.length;
                } catch (e) {
                    console.error("Error calculating density for zone", zone.name, e);
                }

                // Calculate center for label
                let center;
                try {
                    center = turf.centerOfMass(turf.feature(polygon));
                } catch {
                    // Fallback if center calc fails
                    center = turf.point(polygon.coordinates[0][0]); 
                }

                return {
                    type: 'Feature',
                    geometry: center.geometry,
                    properties: {
                        label: `${zone.name}\n👤 ${count}`
                    }
                };
            });

            const labelsSource = map.current.getSource('zones-labels');
            if (labelsSource) {
                labelsSource.setData({
                    type: 'FeatureCollection',
                    features: labelsFeatures
                });
            }
        } else {
             // If no participants, just show names
             const labelsFeatures = zones.map(zone => {
                const polygon = zone.area.geometry || zone.area;
                let center = turf.point(polygon.coordinates[0][0]);
                try { center = turf.centerOfMass(turf.feature(polygon)); } catch(e){}
                
                return {
                    type: 'Feature',
                    geometry: center.geometry,
                    properties: {
                        label: `${zone.name}\n👤 0`
                    }
                };
            });
            const labelsSource = map.current.getSource('zones-labels');
            if (labelsSource) labelsSource.setData({ type: 'FeatureCollection', features: labelsFeatures });
        }

    }, [zones, participantLocations, mapLoaded]);


    // --- Expose FlyTo ---
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
