import DashboardLocalization from "./DashboardLocalization";
import EntrepreneurNextActionBridge from "./EntrepreneurNextActionBridge";
import CampaignActionsFix from "./CampaignActionsFix";
import EntrepreneurJourneyPreQualificationPatch from "./EntrepreneurJourneyPreQualificationPatch";
import EntrepreneurIdentityBar from "./EntrepreneurIdentityBar";
import EntrepreneurCommunicationAccess from "./EntrepreneurCommunicationAccess";

export default function EntrepreneurDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardLocalization>
      <EntrepreneurCommunicationAccess />
      <EntrepreneurNextActionBridge />
      <CampaignActionsFix />
      <EntrepreneurJourneyPreQualificationPatch />
      <EntrepreneurIdentityBar />
      {children}
    </DashboardLocalization>
  );
}
