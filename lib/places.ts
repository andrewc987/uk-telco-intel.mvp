import { LatLng } from './types'

interface KnownPlace {
  name: string
  aliases: string[]
  latLng: LatLng
  type: 'station' | 'area' | 'city' | 'landmark'
}

// All London tube/rail stations, major London areas, UK cities, and common landmarks
const KNOWN_PLACES: KnownPlace[] = [
  // === LONDON TUBE STATIONS ===
  { name: 'Great Portland Street', aliases: ['great portland', 'gps'], latLng: { lat: 51.5238, lng: -0.1440 }, type: 'station' },
  { name: 'Baker Street', aliases: ['baker st'], latLng: { lat: 51.5226, lng: -0.1571 }, type: 'station' },
  { name: 'Bank', aliases: ['bank station'], latLng: { lat: 51.5133, lng: -0.0886 }, type: 'station' },
  { name: 'Barbican', aliases: [], latLng: { lat: 51.5204, lng: -0.0979 }, type: 'station' },
  { name: 'Bermondsey', aliases: [], latLng: { lat: 51.4979, lng: -0.0637 }, type: 'station' },
  { name: 'Bethnal Green', aliases: [], latLng: { lat: 51.5270, lng: -0.0549 }, type: 'station' },
  { name: 'Bond Street', aliases: ['bond st'], latLng: { lat: 51.5142, lng: -0.1494 }, type: 'station' },
  { name: 'Borough', aliases: [], latLng: { lat: 51.5011, lng: -0.0943 }, type: 'station' },
  { name: 'Brixton', aliases: [], latLng: { lat: 51.4627, lng: -0.1145 }, type: 'station' },
  { name: 'Camden Town', aliases: ['camden'], latLng: { lat: 51.5392, lng: -0.1426 }, type: 'station' },
  { name: 'Canada Water', aliases: [], latLng: { lat: 51.4982, lng: -0.0502 }, type: 'station' },
  { name: 'Canary Wharf', aliases: ['canary'], latLng: { lat: 51.5035, lng: -0.0187 }, type: 'station' },
  { name: 'Cannon Street', aliases: ['cannon st'], latLng: { lat: 51.5113, lng: -0.0904 }, type: 'station' },
  { name: 'Chancery Lane', aliases: [], latLng: { lat: 51.5185, lng: -0.1111 }, type: 'station' },
  { name: 'Charing Cross', aliases: [], latLng: { lat: 51.5081, lng: -0.1246 }, type: 'station' },
  { name: 'Clapham Common', aliases: ['clapham'], latLng: { lat: 51.4618, lng: -0.1384 }, type: 'station' },
  { name: 'Clapham Junction', aliases: [], latLng: { lat: 51.4641, lng: -0.1703 }, type: 'station' },
  { name: 'Covent Garden', aliases: [], latLng: { lat: 51.5129, lng: -0.1243 }, type: 'station' },
  { name: 'East Croydon', aliases: ['croydon'], latLng: { lat: 51.3753, lng: -0.0927 }, type: 'station' },
  { name: 'Elephant & Castle', aliases: ['elephant'], latLng: { lat: 51.4943, lng: -0.1001 }, type: 'station' },
  { name: 'Euston', aliases: ['euston station'], latLng: { lat: 51.5282, lng: -0.1337 }, type: 'station' },
  { name: 'Farringdon', aliases: [], latLng: { lat: 51.5203, lng: -0.1053 }, type: 'station' },
  { name: 'Finsbury Park', aliases: [], latLng: { lat: 51.5642, lng: -0.1065 }, type: 'station' },
  { name: 'Fulham Broadway', aliases: ['fulham'], latLng: { lat: 51.4804, lng: -0.1953 }, type: 'station' },
  { name: 'Gloucester Road', aliases: ['gloucester rd'], latLng: { lat: 51.4945, lng: -0.1829 }, type: 'station' },
  { name: 'Goodge Street', aliases: ['goodge st'], latLng: { lat: 51.5205, lng: -0.1347 }, type: 'station' },
  { name: 'Green Park', aliases: [], latLng: { lat: 51.5067, lng: -0.1428 }, type: 'station' },
  { name: 'Hammersmith', aliases: [], latLng: { lat: 51.4936, lng: -0.2251 }, type: 'station' },
  { name: 'Highbury & Islington', aliases: ['highbury', 'islington'], latLng: { lat: 51.5463, lng: -0.1039 }, type: 'station' },
  { name: 'Holborn', aliases: [], latLng: { lat: 51.5174, lng: -0.1201 }, type: 'station' },
  { name: 'Holland Park', aliases: [], latLng: { lat: 51.5075, lng: -0.2060 }, type: 'station' },
  { name: "King's Cross St. Pancras", aliases: ['kings cross', "king's cross", 'st pancras', 'kgx'], latLng: { lat: 51.5308, lng: -0.1238 }, type: 'station' },
  { name: 'Knightsbridge', aliases: [], latLng: { lat: 51.5015, lng: -0.1607 }, type: 'station' },
  { name: 'Lancaster Gate', aliases: [], latLng: { lat: 51.5119, lng: -0.1756 }, type: 'station' },
  { name: 'Leicester Square', aliases: ['leicester sq'], latLng: { lat: 51.5113, lng: -0.1281 }, type: 'station' },
  { name: 'Liverpool Street', aliases: ['liverpool st'], latLng: { lat: 51.5178, lng: -0.0823 }, type: 'station' },
  { name: 'London Bridge', aliases: [], latLng: { lat: 51.5055, lng: -0.0862 }, type: 'station' },
  { name: 'Marble Arch', aliases: [], latLng: { lat: 51.5136, lng: -0.1586 }, type: 'station' },
  { name: 'Marylebone', aliases: [], latLng: { lat: 51.5225, lng: -0.1631 }, type: 'station' },
  { name: 'Monument', aliases: [], latLng: { lat: 51.5108, lng: -0.0861 }, type: 'station' },
  { name: 'Moorgate', aliases: [], latLng: { lat: 51.5186, lng: -0.0886 }, type: 'station' },
  { name: 'Notting Hill Gate', aliases: ['notting hill'], latLng: { lat: 51.5094, lng: -0.1967 }, type: 'station' },
  { name: 'Old Street', aliases: [], latLng: { lat: 51.5258, lng: -0.0873 }, type: 'station' },
  { name: 'Oxford Circus', aliases: ['oxford st'], latLng: { lat: 51.5152, lng: -0.1418 }, type: 'station' },
  { name: 'Paddington', aliases: ['paddington station'], latLng: { lat: 51.5154, lng: -0.1755 }, type: 'station' },
  { name: 'Piccadilly Circus', aliases: ['piccadilly'], latLng: { lat: 51.5100, lng: -0.1340 }, type: 'station' },
  { name: 'Pimlico', aliases: [], latLng: { lat: 51.4893, lng: -0.1334 }, type: 'station' },
  { name: 'Putney', aliases: [], latLng: { lat: 51.4610, lng: -0.2166 }, type: 'station' },
  { name: "Regent's Park", aliases: ['regents park'], latLng: { lat: 51.5234, lng: -0.1466 }, type: 'station' },
  { name: 'Richmond', aliases: [], latLng: { lat: 51.4613, lng: -0.3013 }, type: 'station' },
  { name: "Shepherd's Bush", aliases: ['shepherds bush'], latLng: { lat: 51.5046, lng: -0.2187 }, type: 'station' },
  { name: 'Shoreditch High Street', aliases: ['shoreditch'], latLng: { lat: 51.5234, lng: -0.0756 }, type: 'station' },
  { name: 'Sloane Square', aliases: [], latLng: { lat: 51.4924, lng: -0.1565 }, type: 'station' },
  { name: 'South Kensington', aliases: ['south ken'], latLng: { lat: 51.4941, lng: -0.1738 }, type: 'station' },
  { name: 'Southwark', aliases: [], latLng: { lat: 51.5036, lng: -0.1050 }, type: 'station' },
  { name: "St Paul's", aliases: ['st pauls'], latLng: { lat: 51.5152, lng: -0.0975 }, type: 'station' },
  { name: 'Stratford', aliases: [], latLng: { lat: 51.5416, lng: -0.0033 }, type: 'station' },
  { name: 'Swiss Cottage', aliases: [], latLng: { lat: 51.5432, lng: -0.1738 }, type: 'station' },
  { name: 'Temple', aliases: [], latLng: { lat: 51.5111, lng: -0.1141 }, type: 'station' },
  { name: 'Tottenham Court Road', aliases: ['tcr', 'tottenham court rd'], latLng: { lat: 51.5165, lng: -0.1310 }, type: 'station' },
  { name: 'Tower Hill', aliases: ['tower of london'], latLng: { lat: 51.5101, lng: -0.0765 }, type: 'station' },
  { name: 'Vauxhall', aliases: [], latLng: { lat: 51.4861, lng: -0.1233 }, type: 'station' },
  { name: 'Victoria', aliases: ['victoria station'], latLng: { lat: 51.4952, lng: -0.1441 }, type: 'station' },
  { name: 'Warren Street', aliases: ['warren st'], latLng: { lat: 51.5247, lng: -0.1384 }, type: 'station' },
  { name: 'Waterloo', aliases: ['waterloo station'], latLng: { lat: 51.5031, lng: -0.1132 }, type: 'station' },
  { name: 'Westminster', aliases: [], latLng: { lat: 51.5010, lng: -0.1254 }, type: 'station' },
  { name: 'White City', aliases: [], latLng: { lat: 51.5120, lng: -0.2246 }, type: 'station' },
  { name: 'Whitechapel', aliases: [], latLng: { lat: 51.5194, lng: -0.0612 }, type: 'station' },
  { name: 'Wimbledon', aliases: [], latLng: { lat: 51.4214, lng: -0.2064 }, type: 'station' },
  { name: 'Angel', aliases: [], latLng: { lat: 51.5322, lng: -0.1058 }, type: 'station' },
  { name: 'Balham', aliases: [], latLng: { lat: 51.4431, lng: -0.1525 }, type: 'station' },
  { name: 'Battersea Power Station', aliases: ['battersea'], latLng: { lat: 51.4828, lng: -0.1466 }, type: 'station' },
  { name: 'Tooting Broadway', aliases: ['tooting'], latLng: { lat: 51.4275, lng: -0.1688 }, type: 'station' },
  { name: 'Kennington', aliases: [], latLng: { lat: 51.4884, lng: -0.1053 }, type: 'station' },
  { name: 'Oval', aliases: ['the oval'], latLng: { lat: 51.4819, lng: -0.1126 }, type: 'station' },
  { name: 'Stockwell', aliases: [], latLng: { lat: 51.4723, lng: -0.1228 }, type: 'station' },
  { name: 'Walthamstow Central', aliases: ['walthamstow'], latLng: { lat: 51.5830, lng: -0.0199 }, type: 'station' },
  { name: 'Mile End', aliases: [], latLng: { lat: 51.5252, lng: -0.0332 }, type: 'station' },
  { name: 'Bow Road', aliases: ['bow'], latLng: { lat: 51.5269, lng: -0.0247 }, type: 'station' },
  { name: 'Aldgate', aliases: [], latLng: { lat: 51.5143, lng: -0.0755 }, type: 'station' },
  { name: 'Aldgate East', aliases: [], latLng: { lat: 51.5152, lng: -0.0715 }, type: 'station' },

  // === LONDON AREAS / NEIGHBOURHOODS ===
  { name: 'Soho', aliases: [], latLng: { lat: 51.5137, lng: -0.1337 }, type: 'area' },
  { name: 'Mayfair', aliases: [], latLng: { lat: 51.5099, lng: -0.1480 }, type: 'area' },
  { name: 'The City', aliases: ['city of london', 'the square mile'], latLng: { lat: 51.5155, lng: -0.0922 }, type: 'area' },
  { name: 'Canary Wharf', aliases: ['docklands'], latLng: { lat: 51.5054, lng: -0.0235 }, type: 'area' },
  { name: 'South Bank', aliases: ['southbank'], latLng: { lat: 51.5055, lng: -0.1146 }, type: 'area' },
  { name: 'Fitzrovia', aliases: [], latLng: { lat: 51.5200, lng: -0.1388 }, type: 'area' },
  { name: 'Clerkenwell', aliases: [], latLng: { lat: 51.5235, lng: -0.1050 }, type: 'area' },
  { name: 'Hackney', aliases: [], latLng: { lat: 51.5450, lng: -0.0553 }, type: 'area' },
  { name: 'Peckham', aliases: [], latLng: { lat: 51.4738, lng: -0.0685 }, type: 'area' },
  { name: 'Dalston', aliases: [], latLng: { lat: 51.5462, lng: -0.0753 }, type: 'area' },
  { name: 'Greenwich', aliases: [], latLng: { lat: 51.4769, lng: -0.0005 }, type: 'area' },
  { name: 'Woolwich', aliases: [], latLng: { lat: 51.4907, lng: 0.0654 }, type: 'area' },
  { name: 'Lewisham', aliases: [], latLng: { lat: 51.4535, lng: -0.0205 }, type: 'area' },
  { name: 'Deptford', aliases: [], latLng: { lat: 51.4741, lng: -0.0276 }, type: 'area' },
  { name: 'Bloomsbury', aliases: [], latLng: { lat: 51.5228, lng: -0.1269 }, type: 'area' },
  { name: 'Kings Cross', aliases: [], latLng: { lat: 51.5347, lng: -0.1246 }, type: 'area' },
  { name: 'Hoxton', aliases: [], latLng: { lat: 51.5316, lng: -0.0753 }, type: 'area' },
  { name: 'Bethnal Green', aliases: [], latLng: { lat: 51.5270, lng: -0.0549 }, type: 'area' },
  { name: 'Chelsea', aliases: [], latLng: { lat: 51.4875, lng: -0.1687 }, type: 'area' },
  { name: 'Kensington', aliases: [], latLng: { lat: 51.4990, lng: -0.1889 }, type: 'area' },
  { name: 'Ealing', aliases: [], latLng: { lat: 51.5130, lng: -0.3089 }, type: 'area' },
  { name: 'Acton', aliases: [], latLng: { lat: 51.5094, lng: -0.2752 }, type: 'area' },
  { name: 'Chiswick', aliases: [], latLng: { lat: 51.4920, lng: -0.2575 }, type: 'area' },
  { name: 'Wandsworth', aliases: [], latLng: { lat: 51.4571, lng: -0.1818 }, type: 'area' },
  { name: 'Dulwich', aliases: [], latLng: { lat: 51.4499, lng: -0.0769 }, type: 'area' },

  // === UK MAJOR CITIES & TOWNS ===
  { name: 'Newcastle upon Tyne', aliases: ['newcastle', 'newcastle tyne'], latLng: { lat: 54.9783, lng: -1.6178 }, type: 'city' },
  { name: 'Manchester', aliases: [], latLng: { lat: 53.4808, lng: -2.2426 }, type: 'city' },
  { name: 'Birmingham', aliases: [], latLng: { lat: 52.4862, lng: -1.8904 }, type: 'city' },
  { name: 'Leeds', aliases: [], latLng: { lat: 53.8008, lng: -1.5491 }, type: 'city' },
  { name: 'Liverpool', aliases: [], latLng: { lat: 53.4084, lng: -2.9916 }, type: 'city' },
  { name: 'Bristol', aliases: [], latLng: { lat: 51.4545, lng: -2.5879 }, type: 'city' },
  { name: 'Edinburgh', aliases: [], latLng: { lat: 55.9533, lng: -3.1883 }, type: 'city' },
  { name: 'Glasgow', aliases: [], latLng: { lat: 55.8642, lng: -4.2518 }, type: 'city' },
  { name: 'Brighton', aliases: ['brighton and hove'], latLng: { lat: 50.8225, lng: -0.1372 }, type: 'city' },
  { name: 'Oxford', aliases: [], latLng: { lat: 51.7520, lng: -1.2577 }, type: 'city' },
  { name: 'Cambridge', aliases: [], latLng: { lat: 52.2053, lng: 0.1218 }, type: 'city' },
  { name: 'Reading', aliases: [], latLng: { lat: 51.4543, lng: -0.9781 }, type: 'city' },
  { name: 'Guildford', aliases: [], latLng: { lat: 51.2362, lng: -0.5704 }, type: 'city' },
  { name: 'Milton Keynes', aliases: ['mk'], latLng: { lat: 52.0406, lng: -0.7594 }, type: 'city' },
  { name: 'St Albans', aliases: [], latLng: { lat: 51.7554, lng: -0.3362 }, type: 'city' },
  { name: 'Stevenage', aliases: [], latLng: { lat: 51.9020, lng: -0.2016 }, type: 'city' },
  { name: 'Hitchin', aliases: [], latLng: { lat: 51.9470, lng: -0.2834 }, type: 'city' },
  { name: 'Ipswich', aliases: [], latLng: { lat: 52.0567, lng: 1.1482 }, type: 'city' },
  { name: 'Colchester', aliases: [], latLng: { lat: 51.8860, lng: 0.8919 }, type: 'city' },
  { name: 'Chelmsford', aliases: [], latLng: { lat: 51.7356, lng: 0.4685 }, type: 'city' },
  { name: 'Luton', aliases: [], latLng: { lat: 51.8787, lng: -0.4200 }, type: 'city' },
  { name: 'Slough', aliases: [], latLng: { lat: 51.5105, lng: -0.5950 }, type: 'city' },
  { name: 'Tring', aliases: [], latLng: { lat: 51.7940, lng: -0.6600 }, type: 'city' },
  { name: 'Tunbridge Wells', aliases: ['royal tunbridge wells'], latLng: { lat: 51.1322, lng: 0.2631 }, type: 'city' },
  { name: 'Rochester', aliases: [], latLng: { lat: 51.3885, lng: 0.5058 }, type: 'city' },
  { name: 'Canterbury', aliases: [], latLng: { lat: 51.2802, lng: 1.0789 }, type: 'city' },
  { name: 'Woking', aliases: [], latLng: { lat: 51.3162, lng: -0.5600 }, type: 'city' },
  { name: 'Brookwood', aliases: [], latLng: { lat: 51.3074, lng: -0.6384 }, type: 'city' },
  { name: 'Redhill', aliases: [], latLng: { lat: 51.2393, lng: -0.1707 }, type: 'city' },
  { name: 'Croydon', aliases: [], latLng: { lat: 51.3762, lng: -0.0982 }, type: 'city' },
  { name: 'Watford', aliases: [], latLng: { lat: 51.6565, lng: -0.3903 }, type: 'city' },
  { name: 'Basingstoke', aliases: [], latLng: { lat: 51.2667, lng: -1.0875 }, type: 'city' },
  { name: 'Southampton', aliases: [], latLng: { lat: 50.9097, lng: -1.4044 }, type: 'city' },
  { name: 'Portsmouth', aliases: [], latLng: { lat: 50.8198, lng: -1.0880 }, type: 'city' },
  { name: 'Nottingham', aliases: [], latLng: { lat: 52.9548, lng: -1.1581 }, type: 'city' },
  { name: 'Sheffield', aliases: [], latLng: { lat: 53.3811, lng: -1.4701 }, type: 'city' },
  { name: 'York', aliases: [], latLng: { lat: 53.9600, lng: -1.0873 }, type: 'city' },
  { name: 'Bath', aliases: [], latLng: { lat: 51.3811, lng: -2.3590 }, type: 'city' },
  { name: 'Swindon', aliases: [], latLng: { lat: 51.5558, lng: -1.7797 }, type: 'city' },

  // === LANDMARKS / NOTABLE OFFICES ===
  { name: 'London Bridge Station', aliases: ['london bridge stn'], latLng: { lat: 51.5055, lng: -0.0862 }, type: 'landmark' },
  { name: 'Paddington Station', aliases: [], latLng: { lat: 51.5154, lng: -0.1755 }, type: 'landmark' },
  { name: 'Waterloo Station', aliases: [], latLng: { lat: 51.5031, lng: -0.1132 }, type: 'landmark' },
  { name: 'Victoria Station', aliases: [], latLng: { lat: 51.4952, lng: -0.1441 }, type: 'landmark' },
  { name: 'The Shard', aliases: ['shard'], latLng: { lat: 51.5045, lng: -0.0865 }, type: 'landmark' },
  { name: 'O2 Arena', aliases: ['the o2', 'north greenwich'], latLng: { lat: 51.5030, lng: 0.0032 }, type: 'landmark' },
  { name: 'Excel London', aliases: ['excel centre'], latLng: { lat: 51.5075, lng: 0.0286 }, type: 'landmark' },
  { name: 'Wembley Stadium', aliases: ['wembley'], latLng: { lat: 51.5560, lng: -0.2795 }, type: 'landmark' },
  { name: 'Olympic Park', aliases: ['queen elizabeth olympic'], latLng: { lat: 51.5384, lng: -0.0164 }, type: 'landmark' },
]

function normalise(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
}

function scoreMatch(query: string, place: KnownPlace): number {
  const q = normalise(query)
  const name = normalise(place.name)

  // Exact match
  if (name === q) return 100

  // Name starts with query
  if (name.startsWith(q)) return 90

  // Query starts with name (user typed more than the name)
  if (q.startsWith(name)) return 85

  // Alias exact match
  for (const alias of place.aliases) {
    const a = normalise(alias)
    if (a === q) return 95
    if (a.startsWith(q)) return 88
    if (q.startsWith(a)) return 83
  }

  // Name contains query as a whole word
  if (name.includes(q)) return 70

  // Alias contains query
  for (const alias of place.aliases) {
    if (normalise(alias).includes(q)) return 68
  }

  // Word-level matching for multi-word queries
  const queryWords = q.split(/\s+/)
  const nameWords = name.split(/\s+/)
  const matchedWords = queryWords.filter(w => nameWords.some(nw => nw.startsWith(w) || w.startsWith(nw)))
  if (matchedWords.length > 0) {
    return 40 + (matchedWords.length / queryWords.length) * 30
  }

  return 0
}

export function searchPlaces(query: string, limit: number = 6): Array<{ name: string; latLng: LatLng; type: string }> {
  if (!query || query.length < 2) return []

  const scored = KNOWN_PLACES
    .map(place => ({ place, score: scoreMatch(query, place) }))
    .filter(({ score }) => score > 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)

  return scored.map(({ place }) => ({
    name: place.name,
    latLng: place.latLng,
    type: place.type,
  }))
}

export function isPostcode(query: string): boolean {
  return /^[A-Z]{1,2}\d[A-Z\d]?\s*\d?[A-Z]{0,2}$/i.test(query.trim())
}
