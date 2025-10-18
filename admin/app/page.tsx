"use client";

import { useState, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import { Card } from "./components/ui/card";
import { Button } from "./components/ui/button";
import { CalendarDays, DollarSign, Users, Receipt } from "lucide-react";
import {
  getDashboardStats,
  getMonthlyData,
  getAppointmentStatusData,
  getTodayAppointments,
  getRecentActivity,
  getTopClients,
  type DashboardStats,
  type MonthlyData,
  type AppointmentStatus,
  type TodayAppointment,
  type RecentActivity,
  type TopClient,
} from "@/lib/actions/dashboard";
import {
  AppointmentTrendChart,
  RevenueChart,
  AppointmentStatusChart,
  CombinedChart,
} from "./components/dashboard/charts";
import {
  TodaySchedule,
  RecentActivityCard,
  TopClientsCard,
  QuickActionsCard,
  AlertsCard,
} from "./components/dashboard/dashboard-cards";

export default function DashboardPage() {
  const { status } = useSession();
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    totalAppointments: 0,
    totalRevenue: 0,
    activeClients: 0,
    pendingInvoicesAmount: 0,
    upcomingAppointments: 0,
    overdueInvoices: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [statusData, setStatusData] = useState<AppointmentStatus[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<
    TodayAppointment[]
  >([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [topClients, setTopClients] = useState<TopClient[]>([]);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        const [
          statsData,
          monthlyDataResponse,
          statusDataResponse,
          todayAppointmentsResponse,
          recentActivityResponse,
          topClientsResponse,
        ] = await Promise.all([
          getDashboardStats(),
          getMonthlyData(),
          getAppointmentStatusData(),
          getTodayAppointments(),
          getRecentActivity(),
          getTopClients(),
        ]);

        setStats(statsData);
        setMonthlyData(monthlyDataResponse);
        setStatusData(statusDataResponse);
        setTodayAppointments(todayAppointmentsResponse);
        setRecentActivity(recentActivityResponse);
        setTopClients(topClientsResponse);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-lg">Chargement du tableau de bord...</div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => `${amount.toFixed(2)} Dh`;

  return (
    <div className="h-full flex flex-col">
      <div className="flex justify-between items-center px-4 py-6 flex-shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tableau de Bord</h1>
          <p className="text-muted-foreground">Bienvenue, Malika Lkhabir</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="text-xs md:text-sm"
        >
          Se déconnecter
        </Button>
      </div>
      <div className="flex-1 overflow-hidden flex flex-col gap-2 md:gap-3 px-4 pb-4">
        {/* Alerts */}
        <div className="flex-shrink-0">
          <AlertsCard
            overdueInvoices={stats.overdueInvoices}
            upcomingAppointments={stats.upcomingAppointments}
          />
        </div>

        {/* Key Metrics Cards */}
        <div className="grid gap-2 md:gap-3 grid-cols-2 md:grid-cols-4 flex-shrink-0 h-12 md:h-16">
          <Card className="p-1.5 md:p-2">
            <div className="flex items-center justify-between h-full">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  <span className="md:hidden">RDV</span>
                  <span className="hidden md:inline">Rendez-vous</span>
                </p>
                <p className="text-sm md:text-lg font-bold">
                  {stats.totalAppointments}
                </p>
              </div>
              <CalendarDays className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-1.5 md:p-2">
            <div className="flex items-center justify-between h-full">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  <span className="md:hidden">CA</span>
                  <span className="hidden md:inline">
                    Chiffre d&apos;Affaires
                  </span>
                </p>
                <p className="text-sm md:text-lg font-bold text-green-600">
                  {formatCurrency(stats.totalRevenue)}
                </p>
              </div>
              <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-1.5 md:p-2">
            <div className="flex items-center justify-between h-full">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  <span className="md:hidden">Clients</span>
                  <span className="hidden md:inline">Clients Actifs</span>
                </p>
                <p className="text-sm md:text-lg font-bold text-blue-600">
                  {stats.activeClients}
                </p>
              </div>
              <Users className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </div>
          </Card>

          <Card className="p-1.5 md:p-2">
            <div className="flex items-center justify-between h-full">
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  En Attente
                </p>
                <p className="text-sm md:text-lg font-bold text-orange-600">
                  {formatCurrency(stats.pendingInvoicesAmount)}
                </p>
              </div>
              <Receipt className="h-3 w-3 md:h-4 md:w-4 text-muted-foreground" />
            </div>
          </Card>
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-2 md:gap-3 grid-cols-1 md:grid-cols-6 flex-1 min-h-0">
          {/* Left Column - Charts (Desktop: 4 cols, Mobile: full width) */}
          <div className="md:col-span-4 flex flex-col gap-2 md:gap-3 min-h-0 md:h-full">
            {/* Top Charts Row */}
            <div className="grid gap-2 md:gap-3 grid-cols-1 md:grid-cols-2 flex-1 min-h-0">
              <div className="h-48 md:h-full min-h-0">
                <AppointmentTrendChart data={monthlyData} />
              </div>
              <div className="h-48 md:h-full min-h-0">
                <RevenueChart data={monthlyData} />
              </div>
            </div>
            {/* Bottom Charts Row */}
            <div className="grid gap-2 md:gap-3 grid-cols-1 md:grid-cols-2 flex-1 min-h-0">
              <div className="h-48 md:h-full min-h-0">
                <AppointmentStatusChart data={statusData} />
              </div>
              <div className="h-48 md:h-full min-h-0">
                <CombinedChart data={monthlyData} />
              </div>
            </div>
          </div>

          {/* Right Column - Cards (Desktop: 2 cols, Mobile: full width below charts) */}
          <div className="md:col-span-2 flex flex-col gap-2 md:gap-3 min-h-0 md:h-full">
            <div className="flex-1 min-h-0">
              <TodaySchedule appointments={todayAppointments} />
            </div>
            <div className="flex-1 min-h-0">
              <RecentActivityCard activities={recentActivity} />
            </div>
            <div className="flex-1 min-h-0 h-full">
              <div className="grid gap-2 md:gap-3 grid-cols-2 h-full">
                <TopClientsCard clients={topClients} />
                <QuickActionsCard />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
