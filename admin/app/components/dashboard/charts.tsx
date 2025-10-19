"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { MonthlyData, AppointmentStatus } from "@/lib/actions/dashboard";

interface AppointmentChartProps {
  data: MonthlyData[];
}

export function AppointmentTrendChart({ data }: AppointmentChartProps) {
  console.log("Chart data:", data);

  // Transform data to ensure proper structure
  const chartData = data.map((item) => ({
    month: item.month,
    rendezVous: Number(item.rendezVous),
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium">
          Évolution des Rendez-vous
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-3rem)] p-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} width={30} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid gray",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                formatter={(value) => [`${value} RDV`, "Rendez-vous"]}
              />
              <Line
                type="monotone"
                dataKey="rendezVous"
                stroke="hsl(var(--primary))"
                strokeWidth={2}
                dot={{ fill: "hsl(var(--primary))", strokeWidth: 2, r: 4 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            Aucune donnée disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RevenueChartProps {
  data: MonthlyData[];
}

export function RevenueChart({ data }: RevenueChartProps) {
  return (
    <Card className="h-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium">
          Chiffre d&apos;Affaires
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-3rem)] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="month"
              className="text-xs"
              tick={{ fontSize: 12 }}
            />
            <YAxis className="text-xs" tick={{ fontSize: 12 }} width={40} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid gray",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value) => [
                `${Number(value).toFixed(0)} Dh`,
                "Chiffre d'Affaires",
              ]}
            />
            <Bar
              dataKey="revenue"
              fill="hsl(142.1 76.2% 36.3%)"
              radius={[2, 2, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface StatusPieChartProps {
  data: AppointmentStatus[];
}

export function AppointmentStatusChart({ data }: StatusPieChartProps) {
  // Transform data for Recharts PieChart
  const chartData = data.map((item) => ({
    name: item.status,
    value: item.count,
    color: item.color,
  }));

  const COLORS = {
    "À venir": "#f59e0b",
    Absent: "#ef4444",
    Assisté: "#10b981",
    Annulé: "#6b7280",
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium">Statut des RDV</CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-3rem)] p-2">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={30}
              outerRadius={60}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[entry.name]} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid gray",
                borderRadius: "6px",
                fontSize: "12px",
              }}
              formatter={(value) => [`${value} RDV`, "Nombre"]}
            />
            <Legend wrapperStyle={{ fontSize: "12px" }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface CombinedChartProps {
  data: MonthlyData[];
}

export function CombinedChart({ data }: CombinedChartProps) {
  console.log("CombinedChart data:", data);

  // Transform data to ensure proper structure
  const chartData = data.map((item) => ({
    month: item.month,
    rendezVous: Number(item.rendezVous) || 0,
    revenue: Number(item.revenue) || 0,
  }));

  return (
    <Card className="h-full">
      <CardHeader className="pb-1">
        <CardTitle className="text-xs font-medium">
          Tendances Combinées
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[calc(100%-3rem)] p-2">
        {chartData.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
              <XAxis
                dataKey="month"
                className="text-xs"
                tick={{ fontSize: 12 }}
              />
              <YAxis className="text-xs" tick={{ fontSize: 12 }} width={30} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "12px" }} />
              <Area
                type="monotone"
                dataKey="rendezVous"
                stackId="1"
                stroke="hsl(var(--primary))"
                fill="hsl(var(--primary) / 0.2)"
                name="Rendez-vous"
              />
              <Area
                type="monotone"
                dataKey="revenue"
                stackId="2"
                stroke="hsl(142.1 76.2% 36.3%)"
                fill="hsl(142.1 76.2% 36.3% / 0.2)"
                name="Chiffre d'Affaires"
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground text-xs">
            Aucune donnée disponible
          </div>
        )}
      </CardContent>
    </Card>
  );
}
