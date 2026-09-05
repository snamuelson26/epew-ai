import DashboardLocalization from "./DashboardLocalization";
import EntrepreneurNextActionBridge from "./EntrepreneurNextActionBridge";
import EntrepreneurCampaignBridge from "./EntrepreneurCampaignBridge";
import CampaignActionsFix from "./CampaignActionsFix";

export default function EntrepreneurDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardLocalization>
      <EntrepreneurNextActionBridge />
      <EntrepreneurCampaignBridge />
      <CampaignActionsFix />
      {children}
    </DashboardLocalization>
  );
}
