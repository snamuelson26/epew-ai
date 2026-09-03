"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function SupporterPlatformParticipationAgreementPage() {
  const router = useRouter();
  const [accepted, setAccepted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  function continueAfterAcceptance() {
    setErrorMessage("");

    if (!accepted) {
      setErrorMessage(
        "Please read and accept the EPEW Supporter Platform Participation Agreement before continuing."
      );
      return;
    }

    router.push("/supporters/dashboard");
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb] px-6 py-16 text-[#06245c]">
      <div className="mx-auto max-w-6xl">
        <section className="mb-10 rounded-3xl bg-[#06245c] p-10 text-white shadow-2xl">
          <p className="mb-3 text-lg font-bold uppercase tracking-[0.18em] text-green-300">
            EPEW Supporter Agreement
          </p>

          <h1 className="text-4xl font-black leading-tight md:text-6xl">
            EPEW Supporter Platform Participation Agreement
          </h1>

          <p className="mt-6 max-w-4xl text-xl leading-relaxed text-slate-200">
            Between the Supporter and EPEW (EKERO Partners Empower Wealth LLC)
          </p>
        </section>

        <section className="rounded-3xl bg-white p-8 shadow-2xl md:p-12">
          <div className="max-h-[1100px] space-y-8 overflow-y-auto rounded-3xl border border-slate-200 bg-[#f8fafc] p-8 text-xl leading-relaxed text-slate-700 md:p-10">
            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                1. Parties
              </h2>

              <p>
                This Supporter Platform Participation Agreement is entered into
                between EPEW (EKERO Partners Empower Wealth LLC), referred to in
                this Agreement as “EPEW,” and the individual registered through
                the EPEW platform as a Supporter, referred to as the
                “Supporter.”
              </p>

              <p className="mt-4">
                This Agreement governs the relationship between EPEW and the
                Supporter regarding the Supporter&apos;s use of the EPEW
                platform and participation in the EPEW Entrepreneur Development
                Ecosystem.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                2. Purpose
              </h2>

              <p>
                EPEW operates an entrepreneurship-development and
                community-support ecosystem designed to connect qualified
                entrepreneurs with supporters and to provide technology,
                administration, business-development infrastructure,
                communication systems, financial administration, and other
                services necessary to support that ecosystem.
              </p>

              <p className="mt-4">
                The Supporter voluntarily elects to participate in the EPEW
                ecosystem subject to this Agreement and applicable EPEW
                policies and procedures.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                3. Separate Supporter–Entrepreneur Relationship
              </h2>

              <p>
                When the Supporter chooses to support a specific Entrepreneur,
                the financial and participation relationship between that
                Supporter and Entrepreneur is governed by a separate
                Supporter–Entrepreneur Participation Agreement.
              </p>

              <p className="mt-4 font-bold text-[#06245c]">
                EPEW is not a party to that separate agreement.
              </p>

              <p className="mt-4">
                The Entrepreneur remains responsible for obligations undertaken
                directly with the Supporter.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                4. Services Provided by EPEW
              </h2>

              <ul className="list-disc space-y-2 pl-8">
                <li>Supporter account access.</li>
                <li>Entrepreneur marketplace access.</li>
                <li>Entrepreneur qualification information.</li>
                <li>Support-unit selection tools.</li>
                <li>Payment-processing coordination.</li>
                <li>Payment and participation records.</li>
                <li>Supporter Financial Center access.</li>
                <li>Transaction history.</li>
                <li>Entrepreneur progress information.</li>
                <li>Communications and notifications.</li>
                <li>Reports and available business updates.</li>
                <li>Participation-benefit administration.</li>
                <li>Documentation and electronic recordkeeping.</li>
                <li>Customer and administrative support.</li>
                <li>Mediation and resolution assistance when appropriate.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                5. Entrepreneur Qualification
              </h2>

              <p>
                EPEW establishes qualification criteria and may review
                Entrepreneurs before allowing them to participate in the EPEW
                Marketplace.
              </p>

              <p className="mt-4">
                EPEW qualification means that an Entrepreneur has satisfied
                applicable EPEW eligibility and program requirements at the
                time of qualification.
              </p>

              <p className="mt-4">
                Qualification does not constitute a guarantee by EPEW that the
                Entrepreneur will become profitable, remain in business,
                fulfill every obligation, or produce any particular financial
                outcome.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                6. Supporter Responsibilities
              </h2>

              <ul className="list-disc space-y-2 pl-8">
                <li>Provide accurate account information.</li>
                <li>Maintain the confidentiality and security of login credentials.</li>
                <li>Review applicable agreements and disclosures before participating.</li>
                <li>Select participation voluntarily.</li>
                <li>Authorize payments only when participation is intended.</li>
                <li>Comply with applicable EPEW policies and procedures.</li>
                <li>Notify EPEW of material account or payment issues.</li>
                <li>Use EPEW services lawfully and responsibly.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                7. Payment Administration
              </h2>

              <p>
                EPEW may coordinate payment processing, recordkeeping,
                transaction tracking, and allocation of Supporter payments
                through approved payment processors and EPEW financial systems.
              </p>

              <p className="mt-4">
                The Supporter authorizes EPEW and its authorized payment
                processors to process payments according to the payment option
                selected by the Supporter.
              </p>

              <p className="mt-4">
                The specific amount, frequency, units, and applicable
                participation-benefit terms related to an Entrepreneur are
                governed by the Supporter–Entrepreneur Participation Agreement
                and the selected payment arrangement.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                8. Participation Benefits
              </h2>

              <p>
                Certain participation arrangements may provide an opportunity
                for participation benefits according to applicable EPEW
                policies, the Supporter–Entrepreneur Participation Agreement,
                business performance, and other applicable conditions.
              </p>

              <div className="mt-5 rounded-2xl bg-white p-6 shadow">
                <p>
                  <strong>Weekly or Monthly Participation:</strong> up to 6%
                  annually.
                </p>

                <p className="mt-3">
                  <strong>Annual One-Time Participation:</strong> up to 8%
                  annually.
                </p>

                <p className="mt-4 font-bold text-amber-700">
                  Participation benefits are not guaranteed.
                </p>
              </div>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                9. EPEW Mediation and Resolution Assistance
              </h2>

              <p>
                If a circumstance arises between a Supporter and an
                Entrepreneur concerning an obligation, payment, participation
                benefit, business performance, or another matter relating to
                their participation agreement, the Supporter may request EPEW
                assistance.
              </p>

              <p className="mt-4">
                EPEW may review available records, facilitate communication,
                obtain relevant information, assist the parties in identifying
                possible solutions, provide administrative mediation, and
                coordinate an appropriate resolution process under applicable
                EPEW policies.
              </p>

              <p className="mt-4 font-bold text-[#06245c]">
                EPEW&apos;s mediation role does not make EPEW responsible for
                the Entrepreneur&apos;s obligations.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                10. No EPEW Responsibility for Entrepreneur Restitution
              </h2>

              <p className="font-bold">
                EPEW is not responsible for restitution, repayment,
                reimbursement, compensation, or satisfaction of a financial or
                contractual obligation owed by an Entrepreneur to a Supporter.
              </p>

              <p className="mt-4">
                If an Entrepreneur is unable to fulfill an obligation, EPEW
                will make reasonable efforts to assist the Entrepreneur and
                Supporter through communication, mediation,
                business-development assistance, and available ecosystem
                resources.
              </p>

              <p className="mt-4">
                The obligation remains the responsibility of the Entrepreneur
                unless a separate written agreement expressly provides
                otherwise.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                11. EPEW Entrepreneur-Success Support
              </h2>

              <p>
                EPEW intends to actively assist participating Entrepreneurs
                through available business coaching, enterprise-development
                services, business planning, operational coordination,
                marketing preparation, marketplace participation, business
                monitoring, reporting systems, professional-service
                coordination, technology, administrative support, and growth
                resources.
              </p>

              <p className="mt-4">
                EPEW&apos;s purpose is not simply to process Supporter
                payments. EPEW works to improve the Entrepreneur&apos;s
                opportunity to establish, operate, strengthen, and grow a
                sustainable business.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                12. Economic Growth Mission
              </h2>

              <p>
                EPEW also works to help Entrepreneurs and Supporters strengthen
                their financial position, increase economic opportunity, build
                stronger businesses and communities, and pursue long-term
                wealth growth through entrepreneurship, participation,
                collaboration, and responsible economic activity.
              </p>

              <p className="mt-4">
                EPEW does not guarantee any specific amount of wealth growth,
                income, participation benefit, business profitability, or
                financial outcome.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                13. Nature of EPEW
              </h2>

              <p>
                EPEW (EKERO Partners Empower Wealth LLC) operates as an
                entrepreneurship-development and community-participation
                platform.
              </p>

              <p className="mt-4">EPEW is not acting as the Supporter&apos;s:</p>

              <ul className="mt-3 list-disc space-y-2 pl-8">
                <li>Bank.</li>
                <li>Lender.</li>
                <li>Broker-dealer.</li>
                <li>Investment adviser.</li>
                <li>Financial adviser.</li>
                <li>Securities exchange.</li>
                <li>Guarantor of Entrepreneur performance.</li>
              </ul>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                14. Supporter Financial Records
              </h2>

              <p>
                EPEW may maintain electronic records regarding Supporter
                identity, supported businesses, selected units, payment
                frequency, payment amounts, transaction dates, payment status,
                participation agreements, participation benefits, applicable
                maturity or eligibility dates, distributions or returns when
                applicable, communications, and administrative activity.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                15. Communications
              </h2>

              <p>
                The Supporter authorizes EPEW to provide program-related
                communications through approved communication channels,
                including email, SMS, telephone, WhatsApp, dashboard
                notifications, or other authorized channels.
              </p>

              <p className="mt-4">
                Supporters remain responsible for maintaining accurate contact
                information.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                16. Electronic Agreements and Records
              </h2>

              <p>
                The Supporter agrees that electronic acceptance, checkboxes,
                electronic signatures, authenticated account actions, payment
                authorization, and other electronic records may serve as
                evidence of the Supporter&apos;s consent and participation.
              </p>

              <p className="mt-4">
                EPEW may retain the applicable Supporter ID, agreement version,
                acceptance date and time, selected business, selected units,
                payment frequency, and related transaction information.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                17. Platform Access
              </h2>

              <p>
                EPEW may temporarily restrict or suspend platform access when
                reasonably necessary because of fraud concerns,
                account-security issues, violations of EPEW policies, payment
                disputes, misuse of the platform, legal requirements, or
                material compliance concerns.
              </p>

              <p className="mt-4">
                Such action does not automatically eliminate obligations
                already created under a separate Supporter–Entrepreneur
                Participation Agreement.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                18. Limitation of EPEW Responsibility
              </h2>

              <p>
                EPEW remains responsible for performing the platform and
                administrative responsibilities expressly undertaken by EPEW.
              </p>

              <p className="mt-4">
                EPEW does not assume responsibility for an Entrepreneur&apos;s
                independent business decisions, business losses, failure to
                perform, restitution obligations, market conditions,
                third-party actions outside EPEW&apos;s reasonable control,
                guaranteed participation benefits, or guaranteed financial
                growth.
              </p>

              <p className="mt-4">
                Nothing in this section is intended to eliminate responsibility
                that EPEW itself expressly undertakes under this Agreement or
                that cannot lawfully be excluded.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                19. Governing Law
              </h2>

              <p>
                This Agreement shall be governed by the applicable laws of the
                State of New York, except where another applicable law is
                required.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                20. Entire Agreement
              </h2>

              <p>
                This Agreement, together with applicable EPEW policies,
                disclosures, and electronically accepted program terms,
                constitutes the agreement governing the Supporter&apos;s
                relationship with EPEW.
              </p>

              <p className="mt-4">
                The separate Supporter–Entrepreneur Participation Agreement
                governs the Supporter&apos;s relationship with each supported
                Entrepreneur.
              </p>
            </section>

            <section>
              <h2 className="mb-4 text-3xl font-black text-[#06245c]">
                21. Acceptance
              </h2>

              <p>
                By electronically accepting this Agreement, the Supporter
                confirms that the Supporter has reviewed the Agreement,
                understands the distinction between EPEW and the Entrepreneur,
                understands EPEW&apos;s platform, administrative, and mediation
                roles, understands that EPEW does not assume the
                Entrepreneur&apos;s restitution or repayment obligations,
                understands that participation benefits and financial outcomes
                are not guaranteed, and voluntarily agrees to participate
                subject to these terms.
              </p>
            </section>
          </div>

          <label className="mt-10 flex items-start gap-4 rounded-2xl border-2 border-slate-200 p-6 text-xl leading-relaxed text-slate-700">
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => setAccepted(event.target.checked)}
              className="mt-1 h-6 w-6"
            />

            <span>
              I have read and agree to the EPEW Supporter Platform Participation
              Agreement with{" "}
              <strong>EPEW (EKERO Partners Empower Wealth LLC)</strong>. I
              understand EPEW&apos;s platform, administrative, and mediation
              role and understand that EPEW does not assume an
              Entrepreneur&apos;s restitution, repayment, or other contractual
              obligations.
            </span>
          </label>

          {errorMessage && (
            <p className="mt-5 rounded-xl bg-red-50 p-4 text-lg font-bold text-red-700">
              {errorMessage}
            </p>
          )}

          <div className="mt-8 text-center">
            <button
              type="button"
              onClick={continueAfterAcceptance}
              disabled={!accepted}
              className="rounded-2xl bg-[#06245c] px-12 py-5 text-2xl font-bold text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Accept and Continue
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
