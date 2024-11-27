import { useMemo } from "react";
import { ChartData } from "chart.js";
import SimplePieChart from "./simple-pie-chart";

function createChartData(kinds: Record<string, number>) {
  const sortedKinds = Object.entries(kinds)
    .map(([kind, count]) => ({ kind, count }))
    .sort((a, b) => b.count - a.count);

  const data: ChartData<"pie", number[], string> = {
    labels: sortedKinds.map(({ kind }) => String(kind)),
    datasets: [{ label: "# of events", data: sortedKinds.map(({ count }) => count) }],
  };

  return data;
}

export default function EventKindsPieChart({ kinds }: { kinds: Record<string, number> }) {
  const chartData = useMemo(() => createChartData(kinds), [kinds]);

  return <SimplePieChart data={chartData} />;
}
