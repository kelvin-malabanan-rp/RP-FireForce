import { DashboardLayout } from "../components/layout/DashboardLayout";

interface DashboardPageProps {
  onLogout: () => void;
}

export function DashboardPage({ onLogout }: DashboardPageProps) {
  return <DashboardLayout onLogout={onLogout} />;
}
