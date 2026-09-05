import DashboardLocalization from "./DashboardLocalization";

export default function EntrepreneurDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <DashboardLocalization>{children}</DashboardLocalization>;
}
