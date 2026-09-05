import DashboardLocalization from "./DashboardLocalization";
import EntrepreneurNextActionBridge from "./EntrepreneurNextActionBridge";
import EntrepreneurCampaignBridge from "./EntrepreneurCampaignBridge";

export default function EntrepreneurDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardLocalization>
      <EntrepreneurNextActionBridge />
      <EntrepreneurCampaignBridge />
      {children}
    </DashboardLocalization>
  );
}
