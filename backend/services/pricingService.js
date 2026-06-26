/**
 * Checks if the booking dates span any weekend (Saturday or Sunday).
 * @param {Date} start - Pickup Date
 * @param {Date} end - Return Date
 * @returns {boolean} - True if spans weekend
 */
const isWeekendRental = (start, end) => {
  const curr = new Date(start);
  const finish = new Date(end);
  
  while (curr <= finish) {
    const day = curr.getDay(); // 0 = Sunday, 6 = Saturday
    if (day === 0 || day === 6) {
      return true;
    }
    curr.setDate(curr.getDate() + 1);
  }
  return false;
};

/**
 * Checks if the booking dates span Peak Season (May, June, Oct, Nov, Dec).
 * JS Month is 0-indexed: May=4, June=5, Oct=9, Nov=10, Dec=11.
 * @param {Date} start - Pickup Date
 * @param {Date} end - Return Date
 * @returns {boolean} - True if peak season
 */
const isPeakSeason = (start, end) => {
  const peakMonths = [4, 5, 9, 10, 11]; // May, June, October, November, December
  const startMonth = new Date(start).getMonth();
  const endMonth = new Date(end).getMonth();

  return peakMonths.includes(startMonth) || peakMonths.includes(endMonth);
};

/**
 * Calculates the exact pricing for renting a vehicle using the college project spec formula.
 * @param {Object} vehicle - Vehicle object
 * @param {string|Date} pickupStr - Pickup date
 * @param {string|Date} returnStr - Return date
 * @returns {Object} Detailed pricing object
 */
const calculatePricing = (vehicle, pickupStr, returnStr) => {
  const pickup = new Date(pickupStr);
  const returnD = new Date(returnStr);

  // Calculate days (minimum 1 day)
  const diffTime = Math.abs(returnD - pickup);
  const diffDays = Math.max(1, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));

  const basePrice = vehicle.rentPerDay * diffDays;

  // 1. Vehicle Type Multiplier
  let vehicleTypeMultiplier = 1.0;
  if (vehicle.type === 'Bike') vehicleTypeMultiplier = 0.5;
  if (vehicle.type === 'Car') vehicleTypeMultiplier = 1.0;
  if (vehicle.type === 'EV') vehicleTypeMultiplier = 1.2;
  if (vehicle.type === 'SUV') vehicleTypeMultiplier = 1.5;

  // 2. Weekend Multiplier (+20%)
  const spansWeekend = isWeekendRental(pickup, returnD);
  const weekendMultiplier = spansWeekend ? 1.2 : 1.0;

  // 3. Peak Season Multiplier (+10%)
  const spansPeak = isPeakSeason(pickup, returnD);
  const seasonMultiplier = spansPeak ? 1.1 : 1.0;

  // Calculate price before discount
  const intermediatePrice = basePrice * vehicleTypeMultiplier * weekendMultiplier * seasonMultiplier;

  // 4. Long Term Discount (-15% discount for > 7 days)
  const isLongTerm = diffDays > 7;
  const longTermDiscount = isLongTerm ? Number((intermediatePrice * 0.15).toFixed(2)) : 0;

  const finalPrice = Math.round(intermediatePrice - longTermDiscount);

  return {
    days: diffDays,
    basePrice,
    vehicleTypeMultiplier,
    weekendMultiplier,
    seasonMultiplier,
    longTermDiscount,
    finalPrice,
    breakdown: {
      spansWeekend,
      spansPeak,
      isLongTerm,
      rentPerDay: vehicle.rentPerDay
    }
  };
};

/**
 * Greedy Heuristic: Allocates the optimal vehicle based on the lowest rentPerDay,
 * and prioritizes the highest fuel efficiency for vehicles of that type.
 * @param {Array} vehicles - List of available vehicles
 * @param {string} [preferredType] - Optional filter by type (Bike, Car, SUV, EV)
 * @returns {Array} - Sorted vehicles by the greedy optimization heuristic
 */
const getGreedyAllocations = (vehicles, preferredType = null) => {
  let filtered = [...vehicles];

  // If a specific type is requested, filter it first
  if (preferredType) {
    filtered = filtered.filter((v) => v.type.toLowerCase() === preferredType.toLowerCase());
  }

  // Greedy sorting:
  // 1. Primary key: rentPerDay ascending (lowest cost is optimal)
  // 2. Secondary key: fuelEfficiency descending (highest efficiency is optimal)
  filtered.sort((a, b) => {
    if (a.rentPerDay !== b.rentPerDay) {
      return a.rentPerDay - b.rentPerDay;
    }
    // Prioritize fuel efficiency if rents are identical
    return b.fuelEfficiency - a.fuelEfficiency;
  });

  return filtered;
};

module.exports = {
  calculatePricing,
  getGreedyAllocations,
};
