import Link from "next/link";

export const metadata = {
  title: "Legal Center | Ekero Partners Empower Wealth (EPEW)",
  description:
    "Official legal documents for Ekero Partners Empower Wealth (EPEW).",
};

export default function LegalCenterPage() {
  return (
    <div className="space-y-12">

      <div className="text-center">

        <h1 className="text-5xl md:text-6xl font-extrabold text-[#06245c] mb-6">
          Legal Center
        </h1>

        <p className="text-2xl text-gray-700 max-w-4xl mx-auto leading-relaxed">
          Access the official legal documents governing the
          <strong> Entrepreneur Development Ecosystem (EDE)</strong>,
          coordinated through the
          <strong> Intelligent Business Operating System (IBOS)</strong>.
        </p>

      </div>

      <div className="grid lg:grid-cols-3 gap-8">

        {/* Privacy Policy */}

        <div className="bg-white border rounded-3xl shadow-lg p-10">

          <div className="text-5xl mb-5">🔒</div>

          <h2 className="text-3xl font-bold text-[#06245c] mb-4">
            Privacy Policy
          </h2>

          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Learn how EPEW collects, protects, stores, and manages your
            personal information across our website, platforms, and services.
          </p>

          <Link
            href="/legal/privacy-policy"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Read Privacy Policy
          </Link>

        </div>

        {/* Terms */}

        <div className="bg-white border rounded-3xl shadow-lg p-10">

          <div className="text-5xl mb-5">📜</div>

          <h2 className="text-3xl font-bold text-[#06245c] mb-4">
            Terms of Use
          </h2>

          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Review the rules, responsibilities, acceptable use, and conditions
            governing participation in the EPEW Platform.
          </p>

          <Link
            href="/legal/terms-of-use"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Read Terms of Use
          </Link>

        </div>

        {/* Disclaimer */}

        <div className="bg-white border rounded-3xl shadow-lg p-10">

          <div className="text-5xl mb-5">⚖️</div>

          <h2 className="text-3xl font-bold text-[#06245c] mb-4">
            Platform Disclaimer
          </h2>

          <p className="text-gray-700 text-lg leading-relaxed mb-8">
            Understand the role of EPEW, participant responsibilities,
            important legal disclosures, and the structure of the Entrepreneur
            Development Ecosystem.
          </p>

          <Link
            href="/legal/disclaimer"
            className="inline-block bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-xl transition"
          >
            Read Platform Disclaimer
          </Link>

        </div>

      </div>

      <div className="bg-[#06245c] text-white rounded-3xl p-12 text-center">

        <h2 className="text-4xl font-bold mb-6">
          Need Assistance?
        </h2>

        <p className="text-xl text-gray-200 mb-8">
          If you have questions regarding our legal documents or policies,
          please contact our support team.
        </p>

        <div className="space-y-3 text-2xl font-semibold">
          <p>📧 support@epew.us</p>
          <p>📞 (866) 720-0014</p>
        </div>

      </div>

    </div>
  );
}