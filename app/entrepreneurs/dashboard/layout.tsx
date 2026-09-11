import DashboardLocalization from "./DashboardLocalization";
import EntrepreneurNextActionBridge from "./EntrepreneurNextActionBridge";
import CampaignActionsFix from "./CampaignActionsFix";
import EntrepreneurJourneyPreQualificationPatch from "./EntrepreneurJourneyPreQualificationPatch";
import EntrepreneurIdentityBar from "./EntrepreneurIdentityBar";
import PreQualificationAppointmentBridge from "./PreQualificationAppointmentBridge";

export default function EntrepreneurDashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <DashboardLocalization>
      <EntrepreneurNextActionBridge />
      <CampaignActionsFix />
      <EntrepreneurJourneyPreQualificationPatch />
      <PreQualificationAppointmentBridge />
      <EntrepreneurIdentityBar />
      {children}
    </DashboardLocalization>
  );
}
