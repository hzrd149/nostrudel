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

export default function SimplePieChart({ data }: { data: ChartData<"pie", number[], string> }) {
  const theme = useTheme();
  const token = theme.semanticTokens.colors["chakra-body-text"];
  const color = useColorModeValue(token._light, token._dark) as string;

  return (
    <Pie
      data={data}
      options={{
        color,
        plugins: { colors: { forceOverride: true } },
      }}
    />
  );
}
