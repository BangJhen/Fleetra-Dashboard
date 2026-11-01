# Fleetra places basemap

`fleetra-places.json` is adapted from the OpenFreeMap Positron style at
https://tiles.openfreemap.org/styles/positron.

It retains region and place labels, pale green land cover, blue water, and neutral
roads. Road names and shields, rail layers, and airport symbols are omitted.
There is no traffic layer. The map initially shows OpenStreetMap and OpenFreeMap attribution, then collapses
it after five seconds or a drag interaction. The Sumber peta control always allows
reopening the credits. Leaflet's optional branding prefix is disabled.

`maplibre-gl-worker.mjs` and `MAPLIBRE-LICENSE.txt` are copied from the installed
MapLibre package by `scripts/prepare-map.mjs` during install, development startup,
and production build. They are generated files and should not be edited.
