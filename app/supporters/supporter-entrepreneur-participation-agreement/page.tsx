import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

export default function SupporterEntrepreneurParticipationAgreementPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] px-6 py-12 text-[#06245c]">
        <section className="mx-auto max-w-5xl overflow-hidden rounded-[2rem] bg-white shadow-2xl">
          <div className="bg-[#06245c] px-6 py-10 text-center text-white md:px-10">
            <p className="text-sm font-black uppercase tracking-[0.3em] text-lime-300 md:text-base">
              EPEW Participation Agreement
            </p>
            <h1 className="mt-4 text-4xl font-black md:text-5xl">
              Supporter–Entrepreneur Participation Agreement
            </h1>
          </div>

          <div className="space-y-8 px-6 py-10 text-lg leading-relaxed text-gray-700 md:px-10">
            <p>
              This Agreement is between the participating Supporter and the participating Entrepreneur and/or Business.
            </p>

            <p>
              <strong>EPEW (EKERO Partners Empower Wealth LLC)</strong> provides the platform, administration, payment coordination, recordkeeping, and mediation support. EPEW is not a party to the direct Supporter–Entrepreneur participation relationship unless stated in a separate agreement.
            </p>

            <AgreementSection title="1. Support Unit">
              <p>
                One full EPEW Support Unit is <strong>$5,200</strong> for a one-year participation period.
              </p>
            </AgreementSection>

            <AgreementSection title="2. Available Support Options">
              <p>
                The available payment options shown at checkout are determined by the financing path selected by the Entrepreneur.
              </p>
              <p className="mt-4">
                For entrepreneurs participating in the <strong>standard Funding Queue</strong>, the Supporter may choose:
              </p>
              <ul className="mt-4 list-disc space-y-2 pl-7">
                <li><strong>Weekly:</strong> $100 per week toward one Support Unit — participation benefit up to <strong>6%</strong>.</li>
                <li><strong>Monthly:</strong> $433.34 per month toward one Support Unit — participation benefit up to <strong>6%</strong>.</li>
                <li><strong>Annual Paid in Full:</strong> $5,200 per Support Unit — participation benefit up to <strong>8%</strong>.</li>
              </ul>
              <p className="mt-4">
                For entrepreneurs participating in the <strong>Accelerated Business Financing Path</strong>, only the following option will be available:
              </p>
              <ul className="mt-4 list-disc pl-7">
                <li><strong>Annual Paid in Full:</strong> $5,200 per Support Unit — participation benefit up to <strong>8%</strong>.</li>
              </ul>
              <p className="mt-4">
                The checkout page will automatically display only the payment choices applicable to that Entrepreneur.
              </p>
            </AgreementSection>

            <AgreementSection title="3. Multiple Units">
              <p>
                A Supporter may support one or more available units. When multiple units are selected, the checkout amount and payment terms will automatically adjust according to the number of units and payment frequency selected.
              </p>
            </AgreementSection>

            <AgreementSection title="4. Participation Benefit">
              <p>
                The applicable participation benefit depends upon the payment method selected.
              </p>
              <p className="mt-4">
                A Supporter who pays for one or more complete $5,200 units in full may qualify for an annual participation benefit of <strong>up to 8%</strong>.
              </p>
              <p className="mt-4">
                A Supporter who completes a Support Unit through weekly or monthly payments may qualify for an annual participation benefit of <strong>up to 6%</strong>.
              </p>
              <p className="mt-4">
                Participation benefits are not guaranteed and depend on applicable program terms and business performance.
              </p>
            </AgreementSection>

            <AgreementSection title="5. Payment Terms">
              <p>
                The checkout page will clearly identify the selected payment method, number of units, payment amount, payment frequency, and applicable participation percentage before the Supporter submits the participation request or proceeds to payment.
              </p>
              <p className="mt-4">
                The Supporter is responsible only for the payment option selected and confirmed at checkout.
              </p>
            </AgreementSection>

            <AgreementSection title="6. Entrepreneur Financing Path">
              <p>
                The Supporter understands that the Entrepreneur may participate in either the <strong>Funding Queue Path</strong>, where weekly, monthly, and annual paid-in-full options may be available, or the <strong>Accelerated Business Financing Path</strong>, where only full annual Support Units are offered.
              </p>
              <p className="mt-4">
                The Entrepreneur’s financing-path election controls the support options displayed by the EPEW platform.
              </p>
            </AgreementSection>

            <AgreementSection title="7. Nature of Participation">
              <p>
                Participation is voluntary and is intended to support the development, establishment, operation, or growth of the Entrepreneur’s business.
              </p>
              <p className="mt-4">
                Participation is not a bank deposit, savings account, or guaranteed financial product. No guaranteed financial return is promised.
              </p>
            </AgreementSection>

            <AgreementSection title="8. EPEW Administration and Mediation">
              <p>
                EPEW may administer payment processing, participation records, support allocation, reporting, and related program activities.
              </p>
              <p className="mt-4">
                If a disagreement arises between the Supporter and Entrepreneur, the parties agree to first allow EPEW to assist with mediation and resolution.
              </p>
            </AgreementSection>

            <AgreementSection title="9. Electronic Acceptance">
              <p>
                The Supporter may accept this Agreement electronically. The EPEW system may record the Supporter, Entrepreneur, business, selected payment option, number of units, agreement version, date, time, and related transaction information.
              </p>
            </AgreementSection>

            <div className="rounded-3xl border-2 border-green-200 bg-green-50 p-6 text-green-900">
              <p className="font-black">Agreement Version: September 2026</p>
              <p className="mt-2">
                Electronic acceptance of this Agreement is intended to apply to the support option selected by the Supporter at checkout.
              </p>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function AgreementSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-gray-200 bg-[#f9fbfd] p-6">
      <h2 className="text-2xl font-black text-[#06245c]">{title}</h2>
      <div className="mt-4">{children}</div>
    </section>
  );
}
