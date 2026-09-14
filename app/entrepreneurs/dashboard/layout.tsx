import DashboardLocalization from "./DashboardLocalization";
import EntrepreneurNextActionBridge from "./EntrepreneurNextActionBridge";
import CampaignActionsFix from "./CampaignActionsFix";
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
      <PreQualificationAppointmentBridge />
      <EntrepreneurIdentityBar />
      {children}
    </DashboardLocalization>
  );
}
