import { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import type { LineDefinition } from '../core/models';

export function TransitMap({ line }: { line: LineDefinition }) {
  const element = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!element.current) return undefined;
    const map = new maplibregl.Map({
      container: element.current, center: [line.stops[0].x, line.stops[0].y], zoom: 12, attributionControl: false,
      style: { version: 8, sources: {}, layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#0b1730' } }] }
    });
    map.on('load', () => {
      const points = line.stops.map((stop) => [stop.x, stop.y]);
      map.addSource('route', { type: 'geojson', data: { type: 'Feature', properties: {}, geometry: { type: 'LineString', coordinates: points } } });
      map.addSource('stops', { type: 'geojson', data: { type: 'FeatureCollection', features: line.stops.map((stop) => ({ type: 'Feature' as const, properties: { name: stop.name }, geometry: { type: 'Point' as const, coordinates: [stop.x, stop.y] } })) } });
      map.addLayer({ id: 'route-line', type: 'line', source: 'route', paint: { 'line-color': '#68e6c5', 'line-width': 5 } });
      map.addLayer({ id: 'stops-circle', type: 'circle', source: 'stops', paint: { 'circle-color': '#ffd166', 'circle-radius': 6, 'circle-stroke-width': 2, 'circle-stroke-color': '#0b1730' } });
    });
    return () => map.remove();
  }, [line]);
  return <section className="map-card" aria-label="Synthetic line map"><div className="map" ref={element} /><p>{line.stops.length} synthetic stops · no external tiles or rider data</p></section>;
}
