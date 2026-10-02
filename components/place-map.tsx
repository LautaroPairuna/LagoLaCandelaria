"use client"

import { useEffect, useRef } from "react"
import type { Map as LeafletMap } from "leaflet"

import "leaflet/dist/leaflet.css"

import { fotoUrl } from "@/lib/fotos"
import { mapPoint, mapUrl } from "@/lib/site"

export function PlaceMap() {
  const node = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = node.current
    if (!el) return

    let map: LeafletMap | undefined
    let cancelled = false
    const onResize = () => map?.invalidateSize()

    void (async () => {
      const L = (await import("leaflet")).default
      if (cancelled) return

      map = L.map(el, {
        center: [-34.72, -58.5],
        zoom: 10.5,
        zoomSnap: 0.5,
        zoomControl: false,
        scrollWheelZoom: false,
        dragging: false,
        doubleClickZoom: false,
        boxZoom: false,
        keyboard: false,
        touchZoom: false,
        attributionControl: true,
      })

      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
        {
          maxZoom: 18,
          attribution: "&copy; Esri, HERE, Garmin, OpenStreetMap",
        },
      ).addTo(map)

      const icon = L.divIcon({
        className: "logo-pin",
        html: `<img src="${fotoUrl("/logo.png", 136)}" alt="" /><i></i>`,
        iconSize: [72, 86],
        iconAnchor: [36, 82],
      })

      L.marker([mapPoint.lat, mapPoint.lng], {
        icon,
        keyboard: false,
        interactive: false,
        title: "Lago La Candelaria",
      }).addTo(map)

      requestAnimationFrame(onResize)
      window.addEventListener("resize", onResize)
    })()

    return () => {
      cancelled = true
      window.removeEventListener("resize", onResize)
      map?.remove()
    }
  }, [])

  return (
    <div className="place-map-frame">
      <div
        ref={node}
        className="place-map"
        role="img"
        aria-label="Mapa del área metropolitana de Buenos Aires. Lago La Candelaria está en Tristán Suárez, al sur de la ciudad."
      />
      <a
        className="place-map-open"
        href={mapUrl}
        target="_blank"
        rel="noreferrer"
        aria-label="Abrir Lago La Candelaria en Google Maps, Blas Parera, Tristán Suárez"
      />
    </div>
  )
}
