"use client";

import React, { useState } from "react";
import {
  Bike,
  Fuel,
  Wrench,
  Gauge,
  TrendingUp,
  Info,
  Plus,
  Trash2,
  Calendar,
  IndianRupee,
  AlertCircle,
  X,
  Compass,
} from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { GlassButton } from "@/components/ui/GlassButton";
import { Badge } from "@/components/ui/Badge";

interface BikeTravelTabProps {
  logs: any[];
  analytics: any;
  onRefresh: () => void;
}

export const BikeTravelTab: React.FC<BikeTravelTabProps> = ({
  logs = [],
  analytics,
  onRefresh,
}) => {
  const [isAddFuelModalOpen, setIsAddFuelModalOpen] = useState(false);
  const [isAddServiceModalOpen, setIsAddServiceModalOpen] = useState(false);

  // Form states
  const [bikeName, setBikeName] = useState("My Bike");
  const [litres, setLitres] = useState("");
  const [fuelPrice, setFuelPrice] = useState("");
  const [amount, setAmount] = useState("");
  const [odometer, setOdometer] = useState("");
  const [serviceType, setServiceType] = useState("General Service & Oil Change");
  const [notes, setNotes] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [recordAsExpense, setRecordAsExpense] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Auto-calculate amount if litres and fuel price are typed
  const handleLitresChange = (val: string) => {
    setLitres(val);
    const l = parseFloat(val);
    const p = parseFloat(fuelPrice);
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
      setAmount((l * p).toFixed(2));
    }
  };

  const handlePriceChange = (val: string) => {
    setFuelPrice(val);
    const p = parseFloat(val);
    const l = parseFloat(litres);
    if (!isNaN(l) && !isNaN(p) && l > 0 && p > 0) {
      setAmount((l * p).toFixed(2));
    }
  };

  // Submit Fuel Log
  const handleSubmitFuel = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setError("Please provide a valid amount paid.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/money/bike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bikeName: bikeName.trim() || "My Bike",
          type: "FUEL",
          litres: litres ? parseFloat(litres) : null,
          fuelPricePerLitre: fuelPrice ? parseFloat(fuelPrice) : null,
          amount: parsedAmt,
          odometer: odometer ? parseFloat(odometer) : null,
          date: new Date(date).toISOString(),
          notes: notes.trim() || null,
          recordAsExpense,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to record fuel log");
      }

      setIsAddFuelModalOpen(false);
      setLitres("");
      setFuelPrice("");
      setAmount("");
      setOdometer("");
      setNotes("");
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to save log");
    } finally {
      setLoading(false);
    }
  };

  // Submit Service Log
  const handleSubmitService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const parsedAmt = parseFloat(amount);
    if (isNaN(parsedAmt) || parsedAmt <= 0) {
      setError("Please provide a valid amount paid.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/money/bike", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bikeName: bikeName.trim() || "My Bike",
          type: "SERVICE",
          amount: parsedAmt,
          serviceType: serviceType.trim() || "Periodic Maintenance",
          odometer: odometer ? parseFloat(odometer) : null,
          date: new Date(date).toISOString(),
          notes: notes.trim() || null,
          recordAsExpense,
        }),
      });

      if (!res.ok) {
        const d = await res.json();
        throw new Error(d.error || "Failed to record service log");
      }

      setIsAddServiceModalOpen(false);
      setAmount("");
      setOdometer("");
      setNotes("");
      onRefresh();
    } catch (err: any) {
      setError(err.message || "Failed to save log");
    } finally {
      setLoading(false);
    }
  };

  // Delete Log
  const handleDeleteLog = async (id: string) => {
    if (!confirm("Are you sure you want to remove this log?")) return;
    try {
      await fetch(`/api/money/bike?id=${id}`, { method: "DELETE" });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const hasMileage = analytics?.hasEnoughDataForMileage;
  const avgMileage = analytics?.averageMileage;
  const costPerKm = analytics?.fuelCostPerKm;
  const totalTravelSpent = analytics?.totalTravelSpent || 0;
  const totalFuelSpent = analytics?.totalFuelSpent || 0;
  const totalServiceSpent = analytics?.totalServiceSpent || 0;
  const totalTrackedDistance = analytics?.totalTrackedDistanceKm || 0;
  const intervals = analytics?.intervals || [];

  return (
    <div className="space-y-6 animate-in fade-in duration-200">
      {/* Top Action & Summary Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h3 className="font-serif text-lg font-semibold text-white">Bike Usage & Travel Costs</h3>
          <p className="text-xs text-slate-400 font-mono">
            Tank-to-tank mileage, fuel refills, odometer tracking & maintenance logs
          </p>
        </div>

        <div className="flex items-center gap-2">
          <GlassButton
            variant="secondary"
            size="sm"
            onClick={() => {
              setAmount("");
              setOdometer("");
              setNotes("");
              setIsAddServiceModalOpen(true);
            }}
          >
            <Wrench className="h-4 w-4 mr-1" />
            <span>Log Service</span>
          </GlassButton>

          <GlassButton
            variant="accent"
            size="sm"
            onClick={() => {
              setLitres("");
              setFuelPrice("");
              setAmount("");
              setOdometer("");
              setNotes("");
              setIsAddFuelModalOpen(true);
            }}
          >
            <Fuel className="h-4 w-4 mr-1" />
            <span>Log Fuel</span>
          </GlassButton>
        </div>
      </div>

      {/* 4 Core Mileage & Travel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Measured Mileage Card */}
        <GlassCard variant="hero" className="p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Average Mileage</span>
            <Badge variant={hasMileage ? "teal" : "outline"} size="sm">
              {hasMileage ? "Measured" : "Needs 2 Refills"}
            </Badge>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-bold text-white tabular-nums">
              {hasMileage ? avgMileage : "—"}
            </span>
            <span className="text-xs text-slate-400 font-mono">km / litre</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            {hasMileage
              ? `Calculated across ${intervals.length} tank refill interval${intervals.length > 1 ? "s" : ""}`
              : "Log 2 consecutive refills with odometer to compute"}
          </p>
        </GlassCard>

        {/* Cost per km Card */}
        <GlassCard variant="amber" className="p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Fuel Cost / KM</span>
            <Badge variant="amber" size="sm">Efficiency</Badge>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-bold text-desk-amber tabular-nums">
              {costPerKm ? `₹${costPerKm}` : "—"}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ km</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            {costPerKm
              ? `Real fuel expense per kilometre travelled`
              : "Available once distance is tracked"}
          </p>
        </GlassCard>

        {/* Total Travel Spending */}
        <GlassCard className="p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Total Travel Spent</span>
            <Badge variant="outline" size="sm">All Time</Badge>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-bold text-white tabular-nums">
              ₹{totalTravelSpent.toLocaleString("en-IN")}
            </span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Fuel: ₹{totalFuelSpent.toLocaleString("en-IN")} • Service: ₹{totalServiceSpent.toLocaleString("en-IN")}
          </p>
        </GlassCard>

        {/* Tracked Distance */}
        <GlassCard className="p-4 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase">Tracked Distance</span>
            <Badge variant="outline" size="sm">Odometer</Badge>
          </div>
          <div className="flex items-baseline gap-1.5">
            <span className="font-mono text-3xl font-bold text-white tabular-nums">
              {totalTrackedDistance.toLocaleString("en-IN")}
            </span>
            <span className="text-xs text-slate-400 font-mono">km</span>
          </div>
          <p className="text-[10px] text-slate-400 font-mono">
            Latest reading: {analytics?.latestOdometer ? `${analytics.latestOdometer} km` : "Not recorded"}
          </p>
        </GlassCard>
      </div>

      {/* Mileage Transparency Card */}
      <GlassCard className="p-4 sm:p-5 border-l-4 border-l-desk-teal space-y-2">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-desk-teal shrink-0" />
          <h4 className="font-serif text-sm font-semibold text-white">
            How Bike Mileage is Calculated
          </h4>
        </div>
        <p className="text-xs font-mono text-slate-300 leading-relaxed">
          {analytics?.mileageExplanation ||
            "Tank-to-tank formula: (Current Odometer - Previous Odometer) / Litres filled at second refill. VIRA does not assume manufacturer mileage or guess estimations; genuine metrics appear as soon as 2 consecutive fuel refills with odometer readings are entered."}
        </p>
      </GlassCard>

      {/* Intervals breakdown if available */}
      {intervals.length > 0 && (
        <GlassCard className="p-5 space-y-3">
          <h4 className="font-serif text-base font-semibold text-white">Mileage Refill Intervals</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {intervals.map((inv: any, idx: number) => (
              <div
                key={idx}
                className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-between text-xs font-mono"
              >
                <div className="space-y-0.5">
                  <p className="text-white font-semibold">
                    {inv.fromOdometer} km → {inv.toOdometer} km
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Distance: {inv.distanceKm} km • Fuel: {inv.litresFilled} L
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="font-bold text-desk-amber text-sm">
                    {inv.mileageKmPerLitre} km/L
                  </p>
                  <p className="text-[10px] text-slate-400">₹{inv.costPerKm}/km</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Log History Ledger */}
      <GlassCard className="p-0 overflow-hidden">
        <div className="p-4 sm:px-5 border-b border-white/[0.08] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Compass className="h-4 w-4 text-desk-amber" />
            <h3 className="font-serif text-base font-medium text-white">Travel & Vehicle Logs</h3>
          </div>
          <span className="text-xs font-mono text-slate-400">{logs.length} Records</span>
        </div>

        <div className="divide-y divide-white/[0.06]">
          {logs.length === 0 ? (
            <div className="p-10 text-center space-y-2">
              <Bike className="h-8 w-8 text-slate-500 mx-auto" />
              <p className="text-sm font-serif font-medium text-white">No vehicle logs recorded</p>
              <p className="text-xs font-mono text-slate-400 max-w-md mx-auto">
                Log your petrol bills and bike services. Odometer tracking unlocks genuine mileage per litre and fuel cost per kilometre.
              </p>
              <div className="pt-2 flex justify-center gap-2">
                <GlassButton variant="accent" size="sm" onClick={() => setIsAddFuelModalOpen(true)}>
                  <Fuel className="h-3.5 w-3.5 mr-1" />
                  <span>Log First Refill</span>
                </GlassButton>
              </div>
            </div>
          ) : (
            logs.map((log: any) => {
              const isFuel = log.type === "FUEL";
              const isService = log.type === "SERVICE";
              const formattedDate = new Date(log.date || log.createdAt).toLocaleDateString("en-IN", {
                month: "short",
                day: "numeric",
                year: "numeric",
              });

              return (
                <div
                  key={log.id}
                  className="p-3.5 sm:px-5 flex items-center justify-between hover:bg-white/[0.02] transition-colors group text-xs"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border ${
                        isFuel
                          ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                          : isService
                          ? "bg-sky-500/10 text-sky-400 border-sky-500/20"
                          : "bg-white/[0.05] text-slate-400 border-white/[0.1]"
                      }`}
                    >
                      {isFuel ? <Fuel className="h-4 w-4" /> : isService ? <Wrench className="h-4 w-4" /> : <Bike className="h-4 w-4" />}
                    </div>

                    <div className="space-y-0.5 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-white">
                          {isFuel ? "Fuel Refill" : isService ? (log.serviceType || "Bike Service") : "Travel Expense"}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/[0.05] text-slate-400 border border-white/[0.08]">
                          {log.bikeName || "My Bike"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 flex-wrap">
                        <span>{formattedDate}</span>
                        {log.odometer && (
                          <>
                            <span>•</span>
                            <span className="text-slate-300">{log.odometer} km (Odo)</span>
                          </>
                        )}
                        {log.litres && (
                          <>
                            <span>•</span>
                            <span>{log.litres} L</span>
                          </>
                        )}
                        {log.fuelPricePerLitre && (
                          <>
                            <span>•</span>
                            <span>₹{log.fuelPricePerLitre}/L</span>
                          </>
                        )}
                        {log.notes && (
                          <>
                            <span>•</span>
                            <span className="text-slate-500 truncate max-w-xs">{log.notes}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span className="font-mono text-sm sm:text-base font-bold text-white tabular-nums">
                      ₹{Number(log.amountPaid ?? log.amount).toLocaleString("en-IN")}
                    </span>

                    <button
                      onClick={() => handleDeleteLog(log.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-all"
                      title="Delete log"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </GlassCard>

      {/* Modal: Add Fuel */}
      {isAddFuelModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-[#090D16]/95 border border-white/[0.14] p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Fuel className="h-5 w-5 text-desk-amber" />
                <h3 className="font-serif text-base font-semibold text-white">Record Petrol Refill</h3>
              </div>
              <button onClick={() => setIsAddFuelModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitFuel} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Bike / Vehicle Name</label>
                <input
                  type="text"
                  value={bikeName}
                  onChange={(e) => setBikeName(e.target.value)}
                  placeholder="e.g. Royal Enfield Hunter 350, Activa 6G"
                  className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs text-white border border-white/[0.12] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Litres Filled *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={litres}
                    onChange={(e) => handleLitresChange(e.target.value)}
                    placeholder="e.g. 10.5"
                    className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono text-white border border-white/[0.12] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Fuel Price / L (₹)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={fuelPrice}
                    onChange={(e) => handlePriceChange(e.target.value)}
                    placeholder="e.g. 102.50"
                    className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono text-white border border-white/[0.12] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Total Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 1000"
                    required
                    className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono font-bold text-white border border-white/[0.12] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Odometer Reading (KM)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder="e.g. 4520"
                    className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono text-white border border-white/[0.12] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Refill Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono text-white border border-white/[0.12] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="fuelAsExpense"
                  checked={recordAsExpense}
                  onChange={(e) => setRecordAsExpense(e.target.checked)}
                  className="h-4 w-4 rounded accent-desk-amber"
                />
                <label htmlFor="fuelAsExpense" className="text-xs text-slate-300 font-mono">
                  Also add to financial transactions (Category: Transport)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <GlassButton variant="ghost" size="sm" onClick={() => setIsAddFuelModalOpen(false)}>
                  Cancel
                </GlassButton>
                <GlassButton variant="accent" size="sm" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Record Fuel"}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Add Service */}
      {isAddServiceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-3xl bg-[#090D16]/95 border border-white/[0.14] p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
              <div className="flex items-center gap-2">
                <Wrench className="h-5 w-5 text-sky-400" />
                <h3 className="font-serif text-base font-semibold text-white">Record Bike Maintenance</h3>
              </div>
              <button onClick={() => setIsAddServiceModalOpen(false)} className="text-slate-400 hover:text-white">
                <X className="h-5 w-5" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmitService} className="space-y-3">
              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Service Type</label>
                <input
                  type="text"
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value)}
                  placeholder="e.g. 5,000 km Periodic Service, Engine Oil, Brake Pads"
                  required
                  className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs text-white border border-white/[0.12] focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Amount Paid (₹) *
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="e.g. 2400"
                    required
                    className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono font-bold text-white border border-white/[0.12] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-mono text-slate-400 mb-1">
                    Odometer (KM)
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={odometer}
                    onChange={(e) => setOdometer(e.target.value)}
                    placeholder="e.g. 5000"
                    className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs font-mono text-white border border-white/[0.12] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-slate-400 mb-1">Notes / Replaced Parts</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Motul 15W50 oil, oil filter changed, chain lubed"
                  className="w-full rounded-2xl bg-white/[0.05] px-3.5 py-2.5 text-xs text-white border border-white/[0.12] focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="serviceAsExpense"
                  checked={recordAsExpense}
                  onChange={(e) => setRecordAsExpense(e.target.checked)}
                  className="h-4 w-4 rounded accent-desk-amber"
                />
                <label htmlFor="serviceAsExpense" className="text-xs text-slate-300 font-mono">
                  Also record as an Expense transaction (Category: Transport)
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <GlassButton variant="ghost" size="sm" onClick={() => setIsAddServiceModalOpen(false)}>
                  Cancel
                </GlassButton>
                <GlassButton variant="accent" size="sm" type="submit" disabled={loading}>
                  {loading ? "Saving..." : "Record Service"}
                </GlassButton>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
