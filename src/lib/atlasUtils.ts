interface System {
  name: string;
  grid_x: number;
  grid_y: number;
}

interface Connection {
  from_system: string;
  to_system: string;
  is_manual?: boolean;
}

/**
 * Finds all systems connected to the starting system (the "nest").
 * Ignores manual connections (yellow lines) to keep nests separate.
 */
export const findConnectedComponent = (
  startName: string,
  systems: System[],
  connections: Connection[]
): string[] => {
  const component = new Set<string>();
  const queue = [startName];
  component.add(startName);

  while (queue.length > 0) {
    const current = queue.shift()!;
    const neighbors = connections
      .filter(c => !c.is_manual) // Ignore manual connections
      .filter(c => c.from_system === current || c.to_system === current)
      .map(c => c.from_system === current ? c.to_system : c.from_system);

    for (const neighbor of neighbors) {
      if (!component.has(neighbor)) {
        component.add(neighbor);
        queue.push(neighbor);
      }
    }
  }

  return Array.from(component);
};

/**
 * Arranges a cluster of systems on a grid starting from a root position.
 * Tries to minimize crossings by spreading out in a breadth-first manner.
 */
export const layoutCluster = (
  rootName: string,
  rootX: number,
  rootY: number,
  clusterNames: string[],
  connections: Connection[],
  occupied: Set<string> = new Set()
): System[] => {
  const placed = new Map<string, { x: number, y: number }>();
  const result: System[] = [];
  const queue: { name: string; parentX?: number; parentY?: number }[] = [
    { name: rootName, parentX: rootX, parentY: rootY }
  ];
  
  const visited = new Set<string>();
  visited.add(rootName);

  // Directions to try for neighbors (prioritizing cardinal then ordinal)
  const directions = [
    [1, 0], [0, 1], [-1, 0], [0, -1],
    [1, 1], [1, -1], [-1, 1], [-1, -1],
    [2, 0], [0, 2], [-2, 0], [0, -2]
  ];

  while (queue.length > 0) {
    const { name, parentX, parentY } = queue.shift()!;
    
    let targetX = parentX!;
    let targetY = parentY!;

    // If it's not the root, find the first available spot around the parent
    if (placed.has(name)) {
      const pos = placed.get(name)!;
      targetX = pos.x;
      targetY = pos.y;
    } else {
      let found = false;
      if (name === rootName) {
        targetX = rootX;
        targetY = rootY;
        found = true;
      } else {
        // Search for a spot around the parent
        for (let dist = 1; dist < 10 && !found; dist++) {
          for (const [dx, dy] of directions) {
            const nx = parentX! + dx * dist;
            const ny = parentY! + dy * dist;
            const key = `${nx},${ny}`;
            if (!occupied.has(key) && !Array.from(placed.values()).some(p => p.x === nx && p.y === ny)) {
              targetX = nx;
              targetY = ny;
              found = true;
              break;
            }
          }
        }
      }
      
      placed.set(name, { x: targetX, y: targetY });
      result.push({ name, grid_x: targetX, grid_y: targetY });
    }

    // Add unvisited neighbors to queue
    const neighbors = connections
      .filter(c => !c.is_manual) // Ignore manual connections
      .filter(c => c.from_system === name || c.to_system === name)
      .map(c => c.from_system === name ? c.to_system : c.from_system)
      .filter(n => clusterNames.includes(n) && !visited.has(n));

    for (const neighbor of neighbors) {
      visited.add(neighbor);
      queue.push({ name: neighbor, parentX: targetX, parentY: targetY });
    }
  }

  return result;
};
