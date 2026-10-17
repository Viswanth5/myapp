export interface BikeLog {
  id: string;
  userId: string;
  bikeName: string;
  type: "FUEL" | "SERVICE" | "EXPENSE";
  litres?: number;
  fuelPricePerLitre?: number;
  amountPaid: number;
  odometer?: number;
  distance?: number;
  serviceType?: string;
  date: string;
  notes?: string;
  createdAt?: string;
}

export interface MileageInterval {
  fromOdometer: number;
  toOdometer: number;
  distanceKm: number;
  litresFilled: number;
  mileageKmPerLitre: number;
  costPerKm: number;
  refillDate: string;
}

export interface BikeAnalytics {
  bikeNames: string[];
  totalFuelSpent: number;
  totalServiceSpent: number;
  totalOtherSpent: number;
  totalTravelSpent: number;
  totalLitres: number;
  totalTrackedDistanceKm: number;
  averageMileage: number | null; // km/L, null if not enough valid odometer data
  fuelCostPerKm: number | null;  // ₹/km, null if not enough valid distance data
  latestOdometer: number | null;
  intervals: MileageInterval[];
  hasEnoughDataForMileage: boolean;
  mileageExplanation: string;
}

/**
 * Calculates genuine tank-to-tank mileage and travel metrics across recorded bike logs.
 * Avoids assumptions or fake estimates; requires at least 2 consecutive fuel refills with odometer readings.
 */
export function calculateBikeAnalytics(logs: BikeLog[], now: Date = new Date()): BikeAnalytics {
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();

  let totalFuelSpent = 0;
  let totalServiceSpent = 0;
  let totalOtherSpent = 0;
  let totalLitres = 0;

  const bikeNameSet = new Set<string>();

  for (const log of logs) {
    if (log.bikeName) bikeNameSet.add(log.bikeName.trim());

    const amount = Number(log.amountPaid ?? (log as any).amount) || 0;
    if (log.type === "FUEL") {
      totalFuelSpent += amount;
      if (log.litres && Number(log.litres) > 0) {
        totalLitres += Number(log.litres);
      }
    } else if (log.type === "SERVICE") {
      totalServiceSpent += amount;
    } else {
      totalOtherSpent += amount;
    }
  }

  // Group fuel logs with valid odometer readings, sorted chronologically
  const fuelWithOdo = logs
    .filter((l) => l.type === "FUEL" && typeof l.odometer === "number" && l.odometer > 0)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const intervals: MileageInterval[] = [];
  let totalTrackedDistanceKm = 0;
  let totalFuelUsedInIntervals = 0;
  let totalCostInIntervals = 0;

  if (fuelWithOdo.length >= 2) {
    for (let i = 1; i < fuelWithOdo.length; i++) {
      const prev = fuelWithOdo[i - 1];
      const curr = fuelWithOdo[i];

      const odoPrev = Number(prev.odometer);
      const odoCurr = Number(curr.odometer);
      const litres = Number(curr.litres);
      const amount = Number(curr.amountPaid ?? (curr as any).amount) || 0;

      if (odoCurr > odoPrev && litres > 0) {
        const distance = Math.round((odoCurr - odoPrev) * 10) / 10;
        const mileage = Math.round((distance / litres) * 10) / 10;
        const costPerKm = distance > 0 ? Math.round((amount / distance) * 100) / 100 : 0;

        intervals.push({
          fromOdometer: odoPrev,
          toOdometer: odoCurr,
          distanceKm: distance,
          litresFilled: litres,
          mileageKmPerLitre: mileage,
          costPerKm,
          refillDate: curr.date,
        });

        totalTrackedDistanceKm += distance;
        totalFuelUsedInIntervals += litres;
        totalCostInIntervals += amount;
      }
    }
  }

  const latestOdometer = fuelWithOdo.length > 0 ? Number(fuelWithOdo[fuelWithOdo.length - 1].odometer) : null;

  const hasEnoughDataForMileage = intervals.length > 0;
  const averageMileage = hasEnoughDataForMileage && totalFuelUsedInIntervals > 0
    ? Math.round((totalTrackedDistanceKm / totalFuelUsedInIntervals) * 10) / 10
    : null;

  const fuelCostPerKm = hasEnoughDataForMileage && totalTrackedDistanceKm > 0
    ? Math.round((totalCostInIntervals / totalTrackedDistanceKm) * 100) / 100
    : null;

  const mileageExplanation = hasEnoughDataForMileage
    ? `Calculated using the tank-to-tank method across ${intervals.length} recorded odometer interval${intervals.length === 1 ? "" : "s"}: Total Distance (${totalTrackedDistanceKm} km) ÷ Fuel Filled (${Math.round(totalFuelUsedInIntervals * 10) / 10} L).`
    : `Mileage calculation requires at least 2 fuel refill logs with consecutive odometer readings to measure actual distance travelled per litre.`;

  return {
    bikeNames: Array.from(bikeNameSet),
    totalFuelSpent: Math.round(totalFuelSpent),
    totalServiceSpent: Math.round(totalServiceSpent),
    totalOtherSpent: Math.round(totalOtherSpent),
    totalTravelSpent: Math.round(totalFuelSpent + totalServiceSpent + totalOtherSpent),
    totalLitres: Math.round(totalLitres * 100) / 100,
    totalTrackedDistanceKm: Math.round(totalTrackedDistanceKm),
    averageMileage,
    fuelCostPerKm,
    latestOdometer,
    intervals,
    hasEnoughDataForMileage,
    mileageExplanation,
  };
}
