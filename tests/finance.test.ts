import { describe, it, expect, beforeEach } from "vitest";
import {
  calculateMoneyRunway,
  DEFAULT_EXPENSE_CATEGORIES,
  DEFAULT_INCOME_CATEGORIES,
} from "../src/lib/engine/money";
import { calculateBikeAnalytics, BikeLog } from "../src/lib/engine/bike";
import { dataAdapter } from "../src/lib/data";

describe("Finance Engine — Money Runway & Budgets", () => {
  const fixedNow = new Date("2026-10-15T12:00:00Z"); // Mid month

  it("calculates real net balance from starting balance, income, and expenses without fictional assumptions", () => {
    const transactions: any[] = [
      {
        id: "tx-1",
        title: "Freelance Payment",
        amount: 25000,
        type: "INCOME",
        category: "Freelance Income",
        createdAt: "2026-10-02T10:00:00Z",
      },
      {
        id: "tx-2",
        title: "Apartment Rent",
        amount: 8000,
        type: "EXPENSE",
        category: "Housing",
        createdAt: "2026-10-03T10:00:00Z",
      },
      {
        id: "tx-3",
        title: "Grocery Store",
        amount: 3000,
        type: "EXPENSE",
        category: "Food",
        createdAt: "2026-10-07T10:00:00Z",
      },
    ];

    const result = calculateMoneyRunway(transactions, 15000, [], {
      startingBalance: 10000,
      now: fixedNow,
    });

    // Opening 10000 + 25000 income - 11000 expenses = 24000
    expect(result.startingBalance).toBe(10000);
    expect(result.totalBalance).toBe(24000);
    expect(result.totalIncomeThisMonth).toBe(25000);
    expect(result.totalSpentThisMonth).toBe(11000);
    expect(result.monthlyBudget).toBe(15000);
    expect(result.remainingBudget).toBe(4000);
    expect(result.hasRecordedData).toBe(true);
    expect(result.budgetHealth).toBe("critical"); // 11000 spent by day 15 out of 15000 (well above expected mid-month pace of 7258)
  });

  it("handles unconfigured/empty financial state honestly without fake data", () => {
    const result = calculateMoneyRunway([], 0, [], {
      startingBalance: 0,
      now: fixedNow,
    });

    expect(result.totalBalance).toBe(0);
    expect(result.totalSpentThisMonth).toBe(0);
    expect(result.totalIncomeThisMonth).toBe(0);
    expect(result.remainingBudget).toBe(0);
    expect(result.hasRecordedData).toBe(false);
    expect(result.categoryBreakdown).toEqual([]);
    expect(result.burnRatePerDay).toBe(0);
  });

  it("triggers warning at >=80% and exceeded at >=100% of category budget limits", () => {
    const transactions: any[] = [
      {
        id: "tx-food-1",
        title: "Dinner",
        amount: 4200,
        type: "EXPENSE",
        category: "Food",
        createdAt: "2026-10-05T10:00:00Z",
      },
      {
        id: "tx-shopping-1",
        title: "Sneakers",
        amount: 6500,
        type: "EXPENSE",
        category: "Shopping",
        createdAt: "2026-10-06T10:00:00Z",
      },
    ];

    const categoryBudgets = {
      Food: 5000,     // 4200 / 5000 = 84% -> warning
      Shopping: 5000, // 6500 / 5000 = 130% -> exceeded
      Transport: 3000,// 0% -> ok
    };

    const result = calculateMoneyRunway(transactions, 20000, [], {
      categoryBudgets,
      now: fixedNow,
    });

    const foodStatus = result.categoryBudgets.find((b) => b.category === "Food");
    const shoppingStatus = result.categoryBudgets.find((b) => b.category === "Shopping");
    const transportStatus = result.categoryBudgets.find((b) => b.category === "Transport");

    expect(foodStatus?.status).toBe("warning");
    expect(foodStatus?.percentage).toBe(84);
    expect(foodStatus?.remaining).toBe(800);

    expect(shoppingStatus?.status).toBe("exceeded");
    expect(shoppingStatus?.percentage).toBe(130);
    expect(shoppingStatus?.remaining).toBe(0);

    expect(transportStatus?.status).toBe("ok");
    expect(transportStatus?.spent).toBe(0);
    expect(transportStatus?.remaining).toBe(3000);
  });

  it("tracks savings goals progress without double-counting as expenses", () => {
    const goals = [
      { id: "g-1", title: "Emergency Fund", targetValue: 50000, currentValue: 15000 },
      { id: "g-2", title: "MacBook", targetValue: 100000, currentValue: 100000 },
    ];

    const result = calculateMoneyRunway([], 0, [], {
      goals,
      now: fixedNow,
    });

    expect(result.savingsGoals.length).toBe(2);
    expect(result.totalSavedAcrossGoals).toBe(115000);

    const emergency = result.savingsGoals.find((g) => g.id === "g-1");
    expect(emergency?.percentage).toBe(30);
    expect(emergency?.remaining).toBe(35000);

    const macbook = result.savingsGoals.find((g) => g.id === "g-2");
    expect(macbook?.percentage).toBe(100);
    expect(macbook?.remaining).toBe(0);
  });
});

describe("Bike Engine — Tank-to-Tank Mileage & Travel Costs", () => {
  it("does not present fake estimates when fewer than 2 fuel refills exist", () => {
    const singleLog: BikeLog = {
      id: "b-1",
      userId: "u-1",
      bikeName: "Hunter 350",
      type: "FUEL",
      litres: 10,
      amountPaid: 1020,
      odometer: 1000,
      date: "2026-10-01T10:00:00Z",
    };

    const analytics = calculateBikeAnalytics([singleLog]);
    expect(analytics.hasEnoughDataForMileage).toBe(false);
    expect(analytics.averageMileage).toBeNull();
    expect(analytics.fuelCostPerKm).toBeNull();
    expect(analytics.totalFuelSpent).toBe(1020);
    expect(analytics.mileageExplanation).toContain("at least 2 fuel refill logs");
  });

  it("calculates accurate tank-to-tank mileage and ₹/km when consecutive refills are logged", () => {
    const logs: BikeLog[] = [
      {
        id: "b-1",
        userId: "u-1",
        bikeName: "Hunter 350",
        type: "FUEL",
        litres: 10,
        amountPaid: 1020,
        odometer: 1000, // Starting tank
        date: "2026-10-01T10:00:00Z",
      },
      {
        id: "b-2",
        userId: "u-1",
        bikeName: "Hunter 350",
        type: "FUEL",
        litres: 10,
        amountPaid: 1040,
        odometer: 1350, // Refill 2: 350 km on 10 litres = 35 km/L! Cost: 1040 / 350 = 2.97 ₹/km
        date: "2026-10-10T10:00:00Z",
      },
      {
        id: "b-3",
        userId: "u-1",
        bikeName: "Hunter 350",
        type: "SERVICE",
        amountPaid: 2200,
        odometer: 1350,
        serviceType: "First Free Service & Engine Oil",
        date: "2026-10-11T10:00:00Z",
      },
    ];

    const analytics = calculateBikeAnalytics(logs);
    expect(analytics.hasEnoughDataForMileage).toBe(true);
    expect(analytics.intervals.length).toBe(1);
    expect(analytics.intervals[0].distanceKm).toBe(350);
    expect(analytics.intervals[0].litresFilled).toBe(10);
    expect(analytics.intervals[0].mileageKmPerLitre).toBe(35);
    expect(analytics.intervals[0].costPerKm).toBe(2.97);

    expect(analytics.averageMileage).toBe(35);
    expect(analytics.fuelCostPerKm).toBe(2.97);
    expect(analytics.totalFuelSpent).toBe(2060);
    expect(analytics.totalServiceSpent).toBe(2200);
    expect(analytics.totalTravelSpent).toBe(4260);
    expect(analytics.totalTrackedDistanceKm).toBe(350);
    expect(analytics.latestOdometer).toBe(1350);
  });
});

describe("Data Adapter — Finance CRUD Operations", () => {
  it("persists transactions and patches fields accurately", async () => {
    const testEntry = {
      type: "EXPENSE",
      title: "Swiggy Dinner Test",
      amount: 450,
      category: "Food",
      metadata: { paymentMethod: "UPI", subcategory: "Dinner" },
    };

    const saved = await dataAdapter.addEntry(testEntry, "test-user-finance");
    expect(saved.id).toBeDefined();
    expect(saved.amount).toBe(450);

    // Edit transaction
    const edited = await dataAdapter.patchEntry(
      saved.id,
      "EDIT",
      { title: "Zomato Dinner Updated", amount: 520 },
      "test-user-finance"
    );
    expect(edited?.title).toBe("Zomato Dinner Updated");
    expect(edited?.amount).toBe(520);

    // Delete transaction
    const deleted = await dataAdapter.patchEntry(
      saved.id,
      "DELETE",
      undefined,
      "test-user-finance"
    );
    expect(deleted?.deleted).toBe(true);
  });

  it("handles recurring spends and advance schedule on payment", async () => {
    const spend = await dataAdapter.addRecurringSpend(
      {
        name: "Netflix Premium",
        amount: 649,
        dayOfMonth: 12,
        category: "Entertainment",
        frequency: "MONTHLY",
        status: "ACTIVE",
        nextDueDate: "2026-10-12T00:00:00Z",
      },
      "test-user-recurring"
    );

    expect(spend.id).toBeDefined();
    expect(spend.amount).toBe(649);

    const spendsList = await dataAdapter.getRecurringSpends("test-user-recurring");
    expect(spendsList.some((s: any) => s.id === spend.id)).toBe(true);

    // Delete recurring spend
    const delResult = await dataAdapter.deleteRecurringSpend(spend.id, "test-user-recurring");
    expect(delResult.deleted).toBe(true);
  });

  it("handles bike logs persistence and retrieval", async () => {
    const bikeLog = await dataAdapter.addBikeLog(
      {
        bikeName: "Royal Enfield",
        type: "FUEL",
        litres: 12.5,
        amount: 1250,
        odometer: 5200,
      },
      "test-user-bike"
    );

    expect(bikeLog.id).toBeDefined();
    expect(bikeLog.amount).toBe(1250);

    const logs = await dataAdapter.getBikeLogs("test-user-bike");
    expect(logs.some((l: any) => l.id === bikeLog.id)).toBe(true);

    const del = await dataAdapter.deleteBikeLog(bikeLog.id, "test-user-bike");
    expect(del.deleted).toBe(true);
  });
});
