export const TOGGLE_ROWS = [
  ["Trojan Annex", "Trojan Garden", "Stone Cluster", "Blue Drift", "Outer Grove"],
  ["Outer Shale", "Outer Vestiges", "Inner Ruins", "Derelict Bay", "Derelict Quarry"],
  ["Abandoned Foundry", "Ancient Cluster", "Fringe Crossing", "Fringe Latticeway", "Fringe Tallyport"]
];

export const SITE_POINTS: Record<string, number> = {
  "Trojan Annex": 1,
  "Trojan Garden": 1,
  "Stone Cluster": 1,
  "Blue Drift": 3,
  "Outer Grove": 2,
  "Outer Shale": 2,
  "Outer Vestiges": 3,
  "Inner Ruins": 2,
  "Derelict Bay": 1,
  "Derelict Quarry": 1,
  "Abandoned Foundry": 2,
  "Ancient Cluster": 3,
  "Fringe Crossing": 3,
  "Fringe Latticeway": 3,
  "Fringe Tallyport": 4
};

export const CYPHER_MAP: Record<string, string> = {};
TOGGLE_ROWS.flat().forEach((label, index) => {
  CYPHER_MAP[String.fromCharCode(97 + index)] = label;
});

export const decodeVectors = (siteContents: string) => {
  return siteContents.split('').map(char => CYPHER_MAP[char] || char).join(", ");
};

export const calculateAge = (createdAt: string) => {
  const created = new Date(createdAt).getTime();
  const now = new Date().getTime();
  const diffInMs = now - created;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const hours = Math.floor(diffInMinutes / 60);
  const minutes = diffInMinutes % 60;
  return `${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m`;
};
