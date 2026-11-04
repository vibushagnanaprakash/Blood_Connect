import User from '../models/User.js';
import { escapeRegex, haversineKm } from './helpers.js';

// Medical blood compatibility mapping
// Which donor blood groups can a recipient with bloodGroup receive?
export const COMPATIBLE_DONORS_FOR_RECIPIENT = {
  'A+': ['A+', 'A-', 'O+', 'O-'],
  'A-': ['A-', 'O-'],
  'B+': ['B+', 'B-', 'O+', 'O-'],
  'B-': ['B-', 'O-'],
  'AB+': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'AB-': ['AB-', 'A-', 'B-', 'O-'],
  'O+': ['O+', 'O-'],
  'O-': ['O-'],
};

// Which recipient blood groups can a donor with bloodGroup donate to?
export const RECIPIENTS_FOR_DONOR = {
  'O-': ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
  'O+': ['A+', 'B+', 'AB+', 'O+'],
  'A-': ['A+', 'A-', 'AB+', 'AB-'],
  'A+': ['A+', 'AB+'],
  'B-': ['B+', 'B-', 'AB+', 'AB-'],
  'B+': ['B+', 'AB+'],
  'AB-': ['AB+', 'AB-'],
  'AB+': ['AB+'],
};

/**
 * Find donors by blood group, city and availability.
 * Compatible blood groups are matched (exact match sorted first).
 * If a city is given, donors in that city are matched first;
 * if none are found in that city, it falls back across all cities.
 * If coords {lat,lng} are given, donors that have coordinates get a distanceKm value
 * (Haversine) and the list is sorted nearest first.
 * Contact details are never returned here (privacy).
 */
export async function findDonors({
  bloodGroup,
  city,
  coords,
  availableOnly = true,
  limit = 50,
  exclude,
  exactBloodGroup = false,
}) {
  const baseFilter = { role: 'donor', isActive: true };
  if (availableOnly) baseFilter.available = true;
  if (exclude) baseFilter._id = { $ne: exclude };

  const targetGroups = bloodGroup
    ? exactBloodGroup
      ? [bloodGroup]
      : COMPATIBLE_DONORS_FOR_RECIPIENT[bloodGroup] || [bloodGroup]
    : null;

  if (targetGroups) {
    baseFilter.bloodGroup = { $in: targetGroups };
  }

  // 1. First attempt: match in the specified city (if provided)
  const filterWithCity = { ...baseFilter };
  if (city && city.trim()) {
    filterWithCity.city = new RegExp(escapeRegex(city.trim()), 'i');
  }

  let donors = await User.find(filterWithCity)
    .select('name bloodGroup city area available coordinates lastDonationDate')
    .limit(500)
    .lean();

  // 2. Fallback: if city filter yielded no donors, search across all cities
  // so matching donors are never missed in an emergency
  if (donors.length === 0 && city && city.trim()) {
    donors = await User.find(baseFilter)
      .select('name bloodGroup city area available coordinates lastDonationDate')
      .limit(500)
      .lean();
  }

  if (coords) {
    donors = donors
      .map((d) => ({
        ...d,
        distanceKm: d.coordinates?.lat != null ? Math.round(haversineKm(coords, d.coordinates) * 10) / 10 : null,
      }))
      .sort((a, b) => {
        if (bloodGroup) {
          const aExact = a.bloodGroup === bloodGroup ? 0 : 1;
          const bExact = b.bloodGroup === bloodGroup ? 0 : 1;
          if (aExact !== bExact) return aExact - bExact;
        }
        return (a.distanceKm ?? Infinity) - (b.distanceKm ?? Infinity);
      });
  } else if (bloodGroup) {
    donors.sort((a, b) => {
      const aExact = a.bloodGroup === bloodGroup ? 0 : 1;
      const bExact = b.bloodGroup === bloodGroup ? 0 : 1;
      return aExact - bExact;
    });
  }

  return donors.slice(0, limit).map(({ coordinates, ...rest }) => rest);
}
