Standalone graph view
=====================

This directory contains a standalone ``index.html`` for easier development of ``graph_vis.js`` withou the UI getting in the way. Run `python -m http.server`` in the parent directory and browse to ``http://localhost:8000/_web/``.

The ``get-graph.ipynb`` notebook uses the Constellation REST API to get a graph and priduce a JSON document that can be read by the graph visualiser.
