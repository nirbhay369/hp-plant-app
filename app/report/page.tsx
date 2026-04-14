"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

type Plant = {
  category: string;
  flower_type: string;
  shade: string;
  hedge: string;
  shape: string;
  variety: string;
  water: string;
};

export default function ReportPage() {
  const [plants, setPlants] = useState<Plant[]>([]);

  useEffect(() => {
    fetchPlants();
  }, []);

  const fetchPlants = async () => {
    const { data } = await supabase.from("plants").select("*");
    setPlants(data || []);
  };

  // 🔥 UNIVERSAL COUNT FUNCTION
  const getCount = (key: keyof Plant) => {
    const map: Record<string, number> = {};

    plants.forEach((p) => {
      const value = p[key] || "Unknown";
      map[value] = (map[value] || 0) + 1;
    });

    return map;
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">

      <h1 className="text-2xl font-bold text-green-700 mb-6">
        🌿 Plant Report
      </h1>

      {/* TOTAL */}
      <div className="bg-green-100 p-5 rounded-xl text-center mb-6">
        <h2 className="text-3xl font-bold text-green-700">
          {plants.length}
        </h2>
        <p className="text-green-600">Total Plants</p>
      </div>

      {/* 🔥 IMPORTANT BLOCKS */}
<ReportCard title="Category" data={getCount("category")} />
<ReportCard title="Flower Type" data={getCount("flower_type")} />
<ReportCard title="Shade" data={getCount("shade")} />
<ReportCard title="Hedge" data={getCount("hedge")} />
<ReportCard title="Shape" data={getCount("shape")} />
<ReportCard title="Variety" data={getCount("variety")} />
<ReportCard title="Water Requirement" data={getCount("water")} />

    </div>
  );
}

// 🔥 REUSABLE COMPONENT
function ReportCard({ title, data }: any) {
  const entries = Object.entries(data);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 mb-6">

      {/* TITLE */}
      <h2 className="text-lg font-semibold text-gray-700 mb-4">
        {title}
      </h2>

      {/* LIST */}
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="flex justify-between bg-gray-50 rounded-xl px-4 py-3">
            <span className="text-gray-500">No Data</span>
            <span className="bg-gray-200 px-3 py-1 rounded-full text-sm">
              0
            </span>
          </div>
        ) : (
          entries.map(([key, value]) => (
            <div
              key={key}
              className="flex justify-between items-center bg-gray-50 rounded-xl px-4 py-3"
            >
              <span className="text-gray-700 text-sm">
                {key}
              </span>

              {/* 🔥 RIGHT SIDE COUNT BADGE */}
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                {value as number}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}