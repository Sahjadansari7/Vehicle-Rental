const RentalLocation = require('../models/RentalLocation');
const { calculateDistance } = require('../utils/haversine');

/**
 * Runs Dijkstra's algorithm on a graph of locations to find the shortest distance from the start node.
 * @param {Object} graph - Adjacency list representation: { nodeId: { neighborId: weight, ... }, ... }
 * @param {string} startNode - The starting node ID
 * @returns {Object} - Object containing distances: { nodeId: distance, ... } and paths
 */
const dijkstra = (graph, startNode) => {
  const distances = {};
  const visited = new Set();
  const previous = {};

  // Initialize distances
  for (const node in graph) {
    distances[node] = Infinity;
    previous[node] = null;
  }
  distances[startNode] = 0;

  while (visited.size < Object.keys(graph).length) {
    // Find the unvisited node with the smallest distance
    let minNode = null;
    let minDistance = Infinity;

    for (const node in distances) {
      if (!visited.has(node) && distances[node] < minDistance) {
        minNode = node;
        minDistance = distances[node];
      }
    }

    if (minNode === null) break; // Remaining nodes are unreachable

    visited.add(minNode);

    // Update distances to neighbors
    const neighbors = graph[minNode];
    for (const neighbor in neighbors) {
      if (!visited.has(neighbor)) {
        const newDist = distances[minNode] + neighbors[neighbor];
        if (newDist < distances[neighbor]) {
          distances[neighbor] = Number(newDist.toFixed(2));
          previous[neighbor] = minNode;
        }
      }
    }
  }

  return { distances, previous };
};

/**
 * Find the nearest rental locations from user coordinates using Dijkstra's Algorithm
 * over a dynamically constructed GPS-based rental network.
 * @param {number} userLat - User's current latitude
 * @param {number} userLng - User's current longitude
 * @returns {Array} - List of rental locations with their calculated shortest distances and routing paths
 */
const getNearestLocations = async (userLat, userLng) => {
  const locations = await RentalLocation.find().populate('availableVehicles');

  if (locations.length === 0) {
    return [];
  }

  // 1. Build the network graph among rental locations
  // We connect locations if their distance is less than 15km, or connect them to their nearest neighbor.
  const graph = {};

  // Initialize graph nodes for all locations
  locations.forEach((loc) => {
    graph[loc._id.toString()] = {};
  });

  // Add edges between locations
  for (let i = 0; i < locations.length; i++) {
    const locA = locations[i];
    const idA = locA._id.toString();

    // Store all distances to find nearest neighbor if no locations are under 15km
    const distancesFromA = [];

    for (let j = 0; j < locations.length; j++) {
      if (i === j) continue;
      const locB = locations[j];
      const idB = locB._id.toString();
      const dist = calculateDistance(locA.latitude, locA.longitude, locB.latitude, locB.longitude);

      distancesFromA.push({ id: idB, dist });

      // If distance is less than 15 km, add connection
      if (dist <= 15) {
        graph[idA][idB] = dist;
        graph[idB][idA] = dist;
      }
    }

    // Ensure connection: if a location is isolated, connect it to its closest neighbor
    if (Object.keys(graph[idA]).length === 0 && distancesFromA.length > 0) {
      distancesFromA.sort((a, b) => a.dist - b.dist);
      const nearest = distancesFromA[0];
      graph[idA][nearest.id] = nearest.dist;
      graph[nearest.id][idA] = nearest.dist;
    }
  }

  // 2. Add temporary 'user' node to the graph
  graph['user'] = {};

  // Calculate distances from user to all locations
  const userDistances = locations.map((loc) => {
    const dist = calculateDistance(userLat, userLng, loc.latitude, loc.longitude);
    return { id: loc._id.toString(), dist, name: loc.name };
  });

  // Sort user distances to find the nearest branches
  userDistances.sort((a, b) => a.dist - b.dist);

  // Connect 'user' node to the 2 nearest rental locations (creating the graph entrance edges)
  const branchesToConnect = userDistances.slice(0, 2);
  branchesToConnect.forEach((branch) => {
    graph['user'][branch.id] = branch.dist;
    graph[branch.id]['user'] = branch.dist; // bidirectional
  });

  // 3. Run Dijkstra's Algorithm starting from 'user'
  const { distances, previous } = dijkstra(graph, 'user');

  // Helper to reconstruct path from user to node
  const getPath = (node) => {
    const path = [];
    let curr = node;
    while (curr !== null) {
      path.unshift(curr);
      curr = previous[curr];
    }
    return path;
  };

  // 4. Map the shortest path and distance results back to the locations list
  const results = locations.map((loc) => {
    const idStr = loc._id.toString();
    const shortestDistance = distances[idStr];
    
    // Map path ID array back to actual location names for premium visual representation
    const pathIds = getPath(idStr);
    const pathNames = pathIds.map(nodeId => {
      if (nodeId === 'user') return 'Your Location';
      const match = locations.find(l => l._id.toString() === nodeId);
      return match ? match.name : nodeId;
    });

    return {
      _id: loc._id,
      name: loc.name,
      latitude: loc.latitude,
      longitude: loc.longitude,
      availableVehicles: loc.availableVehicles,
      distanceFromUser: shortestDistance === Infinity ? null : shortestDistance,
      directDistance: calculateDistance(userLat, userLng, loc.latitude, loc.longitude),
      routingPath: pathNames,
    };
  });

  // 5. Sort locations by shortest path distance
  results.sort((a, b) => {
    if (a.distanceFromUser === null) return 1;
    if (b.distanceFromUser === null) return -1;
    return a.distanceFromUser - b.distanceFromUser;
  });

  return results;
};

module.exports = { getNearestLocations };
