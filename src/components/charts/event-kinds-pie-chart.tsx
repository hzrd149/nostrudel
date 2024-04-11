import { useMemo } from "react";
import { useColorModeValue, useTheme } from "@chakra-ui/react";
import {
  Chart as ChartJS,
  ArcElement,
  CategoryScale,
  ChartData,
  Colors,
  Legend,
  LineElement,
  LinearScale,
  PointElement,
  Title,
  Tooltip,
} from "chart.js";
import { Pie } from "react-chartjs-2";

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  Colors,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
);

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
  const theme = useTheme();
  const token = theme.semanticTokens.colors["chakra-body-text"];
  const color = useColorModeValue(token._light, token._dark) as string;

  const chartData = useMemo(() => createChartData(kinds), [kinds]);

  return (
    <Pie
      data={chartData}
      options={{
        color,
        plugins: { colors: { forceOverride: true } },
      }}
    />
  );
}
