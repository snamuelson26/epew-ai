import DashboardLocalization from "./DashboardLocalization";
import EntrepreneurNextActionBridge from "./EntrepreneurNextActionBridge";

export default function EntrepreneurDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardLocalization>
      <EntrepreneurNextActionBridge />
      {children}
    </DashboardLocalization>
  );
}
