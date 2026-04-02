import { Terminal } from './types'

export const TERMINAL_LOOKUP: Record<string, Terminal> = {
  // South West — Waterloo
  'GU24': {
    name: 'Waterloo',
    postcode: 'SE1 8SW',
    latLng: { lat: 51.5031, lng: -0.1132 },
    lastTrains: [
      { destination: 'Brookwood', departureTime: '23:34', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Brookwood', departureTime: '23:04', daysOfWeek: ['Sat'] },
      { destination: 'Brookwood', departureTime: '22:34', daysOfWeek: ['Sun'] },
    ],
  },
  'GU1': {
    name: 'Waterloo',
    postcode: 'SE1 8SW',
    latLng: { lat: 51.5031, lng: -0.1132 },
    lastTrains: [
      { destination: 'Guildford', departureTime: '23:50', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Guildford', departureTime: '23:20', daysOfWeek: ['Sat'] },
      { destination: 'Guildford', departureTime: '22:50', daysOfWeek: ['Sun'] },
    ],
  },
  'GU2': {
    name: 'Waterloo',
    postcode: 'SE1 8SW',
    latLng: { lat: 51.5031, lng: -0.1132 },
    lastTrains: [
      { destination: 'Guildford', departureTime: '23:50', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Guildford', departureTime: '23:20', daysOfWeek: ['Sat'] },
      { destination: 'Guildford', departureTime: '22:50', daysOfWeek: ['Sun'] },
    ],
  },
  'KT1': {
    name: 'Waterloo',
    postcode: 'SE1 8SW',
    latLng: { lat: 51.5031, lng: -0.1132 },
    lastTrains: [
      { destination: 'Kingston', departureTime: '00:07', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Kingston', departureTime: '23:37', daysOfWeek: ['Sat'] },
      { destination: 'Kingston', departureTime: '23:07', daysOfWeek: ['Sun'] },
    ],
  },
  'KT2': {
    name: 'Waterloo',
    postcode: 'SE1 8SW',
    latLng: { lat: 51.5031, lng: -0.1132 },
    lastTrains: [
      { destination: 'Kingston', departureTime: '00:07', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Kingston', departureTime: '23:37', daysOfWeek: ['Sat'] },
      { destination: 'Kingston', departureTime: '23:07', daysOfWeek: ['Sun'] },
    ],
  },
  'GU21': {
    name: 'Waterloo',
    postcode: 'SE1 8SW',
    latLng: { lat: 51.5031, lng: -0.1132 },
    lastTrains: [
      { destination: 'Woking', departureTime: '23:50', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Woking', departureTime: '23:20', daysOfWeek: ['Sat'] },
      { destination: 'Woking', departureTime: '22:50', daysOfWeek: ['Sun'] },
    ],
  },

  // South — London Bridge / Victoria
  'RH1': {
    name: 'London Bridge',
    postcode: 'SE1 9SP',
    latLng: { lat: 51.5055, lng: -0.0862 },
    lastTrains: [
      { destination: 'Redhill', departureTime: '23:44', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Redhill', departureTime: '23:14', daysOfWeek: ['Sat'] },
      { destination: 'Redhill', departureTime: '22:44', daysOfWeek: ['Sun'] },
    ],
  },
  'CR0': {
    name: 'London Bridge',
    postcode: 'SE1 9SP',
    latLng: { lat: 51.5055, lng: -0.0862 },
    lastTrains: [
      { destination: 'East Croydon', departureTime: '00:05', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'East Croydon', departureTime: '23:35', daysOfWeek: ['Sat'] },
      { destination: 'East Croydon', departureTime: '23:05', daysOfWeek: ['Sun'] },
    ],
  },

  // East Anglia — Liverpool Street
  'IP1': {
    name: 'Liverpool Street',
    postcode: 'EC2M 7PY',
    latLng: { lat: 51.5178, lng: -0.0823 },
    lastTrains: [
      { destination: 'Ipswich', departureTime: '23:30', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Ipswich', departureTime: '23:00', daysOfWeek: ['Sat'] },
      { destination: 'Ipswich', departureTime: '22:30', daysOfWeek: ['Sun'] },
    ],
  },
  'IP2': {
    name: 'Liverpool Street',
    postcode: 'EC2M 7PY',
    latLng: { lat: 51.5178, lng: -0.0823 },
    lastTrains: [
      { destination: 'Ipswich', departureTime: '23:30', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Ipswich', departureTime: '23:00', daysOfWeek: ['Sat'] },
      { destination: 'Ipswich', departureTime: '22:30', daysOfWeek: ['Sun'] },
    ],
  },
  'CM1': {
    name: 'Liverpool Street',
    postcode: 'EC2M 7PY',
    latLng: { lat: 51.5178, lng: -0.0823 },
    lastTrains: [
      { destination: 'Chelmsford', departureTime: '23:50', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Chelmsford', departureTime: '23:20', daysOfWeek: ['Sat'] },
      { destination: 'Chelmsford', departureTime: '22:50', daysOfWeek: ['Sun'] },
    ],
  },
  'CM2': {
    name: 'Liverpool Street',
    postcode: 'EC2M 7PY',
    latLng: { lat: 51.5178, lng: -0.0823 },
    lastTrains: [
      { destination: 'Chelmsford', departureTime: '23:50', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Chelmsford', departureTime: '23:20', daysOfWeek: ['Sat'] },
      { destination: 'Chelmsford', departureTime: '22:50', daysOfWeek: ['Sun'] },
    ],
  },
  'CO1': {
    name: 'Liverpool Street',
    postcode: 'EC2M 7PY',
    latLng: { lat: 51.5178, lng: -0.0823 },
    lastTrains: [
      { destination: 'Colchester', departureTime: '23:30', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Colchester', departureTime: '23:00', daysOfWeek: ['Sat'] },
      { destination: 'Colchester', departureTime: '22:30', daysOfWeek: ['Sun'] },
    ],
  },
  'CO2': {
    name: 'Liverpool Street',
    postcode: 'EC2M 7PY',
    latLng: { lat: 51.5178, lng: -0.0823 },
    lastTrains: [
      { destination: 'Colchester', departureTime: '23:30', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Colchester', departureTime: '23:00', daysOfWeek: ['Sat'] },
      { destination: 'Colchester', departureTime: '22:30', daysOfWeek: ['Sun'] },
    ],
  },
  'CB1': {
    name: 'Liverpool Street',
    postcode: 'EC2M 7PY',
    latLng: { lat: 51.5178, lng: -0.0823 },
    lastTrains: [
      { destination: 'Cambridge', departureTime: '23:26', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Cambridge', departureTime: '23:00', daysOfWeek: ['Sat'] },
      { destination: 'Cambridge', departureTime: '22:30', daysOfWeek: ['Sun'] },
    ],
  },

  // North / Midlands — Kings Cross / St Pancras / Euston
  'SG1': {
    name: 'Kings Cross',
    postcode: 'N1 9AP',
    latLng: { lat: 51.5320, lng: -0.1240 },
    lastTrains: [
      { destination: 'Stevenage', departureTime: '23:48', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Stevenage', departureTime: '23:18', daysOfWeek: ['Sat'] },
      { destination: 'Stevenage', departureTime: '22:48', daysOfWeek: ['Sun'] },
    ],
  },
  'SG4': {
    name: 'Kings Cross',
    postcode: 'N1 9AP',
    latLng: { lat: 51.5320, lng: -0.1240 },
    lastTrains: [
      { destination: 'Hitchin', departureTime: '23:48', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Hitchin', departureTime: '23:18', daysOfWeek: ['Sat'] },
      { destination: 'Hitchin', departureTime: '22:48', daysOfWeek: ['Sun'] },
    ],
  },
  'SG5': {
    name: 'Kings Cross',
    postcode: 'N1 9AP',
    latLng: { lat: 51.5320, lng: -0.1240 },
    lastTrains: [
      { destination: 'Hitchin', departureTime: '23:48', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Hitchin', departureTime: '23:18', daysOfWeek: ['Sat'] },
      { destination: 'Hitchin', departureTime: '22:48', daysOfWeek: ['Sun'] },
    ],
  },
  'AL1': {
    name: 'St Pancras',
    postcode: 'N1C 4QP',
    latLng: { lat: 51.5317, lng: -0.1262 },
    lastTrains: [
      { destination: 'St Albans', departureTime: '23:52', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'St Albans', departureTime: '23:22', daysOfWeek: ['Sat'] },
      { destination: 'St Albans', departureTime: '22:52', daysOfWeek: ['Sun'] },
    ],
  },
  'AL3': {
    name: 'St Pancras',
    postcode: 'N1C 4QP',
    latLng: { lat: 51.5317, lng: -0.1262 },
    lastTrains: [
      { destination: 'St Albans', departureTime: '23:52', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'St Albans', departureTime: '23:22', daysOfWeek: ['Sat'] },
      { destination: 'St Albans', departureTime: '22:52', daysOfWeek: ['Sun'] },
    ],
  },
  'HP23': {
    name: 'Euston',
    postcode: 'NW1 2RT',
    latLng: { lat: 51.5282, lng: -0.1337 },
    lastTrains: [
      { destination: 'Tring', departureTime: '23:33', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Tring', departureTime: '23:03', daysOfWeek: ['Sat'] },
      { destination: 'Tring', departureTime: '22:33', daysOfWeek: ['Sun'] },
    ],
  },
  'MK1': {
    name: 'Euston',
    postcode: 'NW1 2RT',
    latLng: { lat: 51.5282, lng: -0.1337 },
    lastTrains: [
      { destination: 'Milton Keynes', departureTime: '23:43', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Milton Keynes', departureTime: '23:13', daysOfWeek: ['Sat'] },
      { destination: 'Milton Keynes', departureTime: '22:43', daysOfWeek: ['Sun'] },
    ],
  },
  'MK9': {
    name: 'Euston',
    postcode: 'NW1 2RT',
    latLng: { lat: 51.5282, lng: -0.1337 },
    lastTrains: [
      { destination: 'Milton Keynes', departureTime: '23:43', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Milton Keynes', departureTime: '23:13', daysOfWeek: ['Sat'] },
      { destination: 'Milton Keynes', departureTime: '22:43', daysOfWeek: ['Sun'] },
    ],
  },
  'LU1': {
    name: 'St Pancras',
    postcode: 'N1C 4QP',
    latLng: { lat: 51.5317, lng: -0.1262 },
    lastTrains: [
      { destination: 'Luton', departureTime: '23:40', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Luton', departureTime: '23:10', daysOfWeek: ['Sat'] },
      { destination: 'Luton', departureTime: '22:40', daysOfWeek: ['Sun'] },
    ],
  },

  // South East — Victoria / Charing Cross
  'BN1': {
    name: 'Victoria',
    postcode: 'SW1V 1JU',
    latLng: { lat: 51.4952, lng: -0.1441 },
    lastTrains: [
      { destination: 'Brighton', departureTime: '23:32', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Brighton', departureTime: '23:02', daysOfWeek: ['Sat'] },
      { destination: 'Brighton', departureTime: '22:32', daysOfWeek: ['Sun'] },
    ],
  },
  'BN2': {
    name: 'Victoria',
    postcode: 'SW1V 1JU',
    latLng: { lat: 51.4952, lng: -0.1441 },
    lastTrains: [
      { destination: 'Brighton', departureTime: '23:32', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Brighton', departureTime: '23:02', daysOfWeek: ['Sat'] },
      { destination: 'Brighton', departureTime: '22:32', daysOfWeek: ['Sun'] },
    ],
  },
  'TN1': {
    name: 'Charing Cross',
    postcode: 'WC2N 5HS',
    latLng: { lat: 51.5081, lng: -0.1246 },
    lastTrains: [
      { destination: 'Tunbridge Wells', departureTime: '23:20', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Tunbridge Wells', departureTime: '22:50', daysOfWeek: ['Sat'] },
      { destination: 'Tunbridge Wells', departureTime: '22:20', daysOfWeek: ['Sun'] },
    ],
  },
  'ME1': {
    name: 'Victoria',
    postcode: 'SW1V 1JU',
    latLng: { lat: 51.4952, lng: -0.1441 },
    lastTrains: [
      { destination: 'Rochester', departureTime: '23:22', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Rochester', departureTime: '22:52', daysOfWeek: ['Sat'] },
      { destination: 'Rochester', departureTime: '22:22', daysOfWeek: ['Sun'] },
    ],
  },
  'CT1': {
    name: 'Victoria',
    postcode: 'SW1V 1JU',
    latLng: { lat: 51.4952, lng: -0.1441 },
    lastTrains: [
      { destination: 'Canterbury', departureTime: '22:58', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Canterbury', departureTime: '22:28', daysOfWeek: ['Sat'] },
      { destination: 'Canterbury', departureTime: '21:58', daysOfWeek: ['Sun'] },
    ],
  },

  // West — Paddington
  'SL1': {
    name: 'Paddington',
    postcode: 'W2 1HQ',
    latLng: { lat: 51.5154, lng: -0.1755 },
    lastTrains: [
      { destination: 'Slough', departureTime: '00:03', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Slough', departureTime: '23:33', daysOfWeek: ['Sat'] },
      { destination: 'Slough', departureTime: '23:03', daysOfWeek: ['Sun'] },
    ],
  },
  'RG1': {
    name: 'Paddington',
    postcode: 'W2 1HQ',
    latLng: { lat: 51.5154, lng: -0.1755 },
    lastTrains: [
      { destination: 'Reading', departureTime: '23:48', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Reading', departureTime: '23:18', daysOfWeek: ['Sat'] },
      { destination: 'Reading', departureTime: '22:48', daysOfWeek: ['Sun'] },
    ],
  },
  'RG2': {
    name: 'Paddington',
    postcode: 'W2 1HQ',
    latLng: { lat: 51.5154, lng: -0.1755 },
    lastTrains: [
      { destination: 'Reading', departureTime: '23:48', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Reading', departureTime: '23:18', daysOfWeek: ['Sat'] },
      { destination: 'Reading', departureTime: '22:48', daysOfWeek: ['Sun'] },
    ],
  },
  'OX1': {
    name: 'Paddington',
    postcode: 'W2 1HQ',
    latLng: { lat: 51.5154, lng: -0.1755 },
    lastTrains: [
      { destination: 'Oxford', departureTime: '23:15', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Oxford', departureTime: '22:45', daysOfWeek: ['Sat'] },
      { destination: 'Oxford', departureTime: '22:15', daysOfWeek: ['Sun'] },
    ],
  },
  'OX2': {
    name: 'Paddington',
    postcode: 'W2 1HQ',
    latLng: { lat: 51.5154, lng: -0.1755 },
    lastTrains: [
      { destination: 'Oxford', departureTime: '23:15', daysOfWeek: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'] },
      { destination: 'Oxford', departureTime: '22:45', daysOfWeek: ['Sat'] },
      { destination: 'Oxford', departureTime: '22:15', daysOfWeek: ['Sun'] },
    ],
  },
}

const LONDON_BOROUGHS = new Set([
  'Barking and Dagenham', 'Barnet', 'Bexley', 'Brent', 'Bromley',
  'Camden', 'City of London', 'Croydon', 'Ealing', 'Enfield',
  'Greenwich', 'Hackney', 'Hammersmith and Fulham', 'Haringey', 'Harrow',
  'Havering', 'Hillingdon', 'Hounslow', 'Islington',
  'Kensington and Chelsea', 'Kingston upon Thames', 'Lambeth', 'Lewisham',
  'Merton', 'Newham', 'Redbridge', 'Richmond upon Thames', 'Southwark',
  'Sutton', 'Tower Hamlets', 'Waltham Forest', 'Wandsworth', 'Westminster',
])

export function isLondonBorough(adminDistrict: string): boolean {
  return LONDON_BOROUGHS.has(adminDistrict)
}

export function lookupTerminal(postcodeOutward: string): Terminal | undefined {
  const prefix = postcodeOutward.toUpperCase().replace(/\s+/g, '')
  return TERMINAL_LOOKUP[prefix]
}

export function getPostcodeOutward(postcode: string): string {
  const clean = postcode.toUpperCase().replace(/\s+/g, '')
  // Outward code is everything except the last 3 characters
  return clean.slice(0, -3)
}
