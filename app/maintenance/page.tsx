import Link from "next/link";

export default function MaintenancePage() {
  const currentYear = new Date().getFullYear();

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#050505] text-white">
      {/* Background effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-[-180px] h-[420px] w-[420px] -translate-x-1/2 rounded-full bg-emerald-500/15 blur-[130px]" />

        <div className="absolute bottom-[-180px] right-[-120px] h-[420px] w-[420px] rounded-full bg-amber-400/10 blur-[140px]" />

        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.8) 1px, transparent 1px)",
            backgroundSize: "42px 42px",
          }}
        />
      </div>

      <section className="relative z-10 flex min-h-screen flex-col">
        {/* Header */}
        <header className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-6 md:px-10">
          <Link
            href="/maintenance"
            className="flex items-center gap-3"
            aria-label="EPEW Maintenance"
          >
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-amber-300/40 bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 text-lg font-black text-black shadow-[0_0_30px_rgba(251,191,36,0.15)]">
              E
            </div>

            <div>
              <p className="text-lg font-black tracking-[0.18em] text-amber-300">
                EPEW
              </p>
              <p className="text-xs font-medium tracking-[0.14em] text-zinc-400">
                EDE · IBOS
              </p>
            </div>
          </Link>

          <div className="hidden items-center gap-2 rounded-full border border-emerald-400/20 bg-emerald-400/5 px-4 py-2 text-xs font-semibold text-emerald-300 sm:flex">
            <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-400" />
            Production Security Review
          </div>
        </header>

        {/* Main content */}
        <div className="mx-auto flex w-full max-w-7xl flex-1 items-center px-6 py-12 md:px-10">
          <div className="grid w-full items-center gap-12 lg:grid-cols-[1.15fr_0.85fr]">
            {/* Left */}
            <div className="max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/5 px-4 py-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-300">
                <span className="h-2 w-2 rounded-full bg-amber-300" />
                Temporary Maintenance
              </div>

              <h1 className="text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl md:text-6xl lg:text-7xl">
                We are strengthening the
                <span className="block bg-gradient-to-r from-amber-200 via-amber-400 to-emerald-400 bg-clip-text text-transparent">
                  EPEW platform.
                </span>
              </h1>

              <p className="mt-7 max-w-2xl text-base leading-8 text-zinc-300 sm:text-lg">
                The EPEW-EDE-IBOS platform is temporarily unavailable while our
                technical team completes final production security,
                authentication, and reliability verification.
              </p>

              <p className="mt-4 max-w-2xl text-sm leading-7 text-zinc-400 sm:text-base">
                This temporary measure protects our entrepreneurs, supporters,
                coaches, partners, and organizational information while we
                prepare the platform for secure live operations.
              </p>

              <div className="mt-9 grid max-w-2xl gap-4 sm:grid-cols-3">
                <StatusCard
                  number="01"
                  title="Security Review"
                  description="Administrator access and protected routes."
                />

                <StatusCard
                  number="02"
                  title="System Validation"
                  description="Production workflows and platform services."
                />

                <StatusCard
                  number="03"
                  title="Launch Readiness"
                  description="Final verification before reopening."
                />
              </div>
            </div>

            {/* Right */}
            <div className="relative">
              <div className="absolute inset-0 rounded-[36px] bg-gradient-to-br from-amber-300/20 via-transparent to-emerald-400/20 blur-2xl" />

              <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.045] p-6 shadow-2xl backdrop-blur-xl sm:p-8">
                <div className="flex items-center justify-between border-b border-white/10 pb-5">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-zinc-500">
                      Platform Status
                    </p>

                    <h2 className="mt-2 text-2xl font-black text-white">
                      Maintenance Active
                    </h2>
                  </div>

                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10">
                    <svg
                      viewBox="0 0 24 24"
                      className="h-7 w-7 text-amber-300"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="1.8"
                      aria-hidden="true"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 3l7 3v5c0 4.7-2.9 8.5-7 10-4.1-1.5-7-5.3-7-10V6l7-3z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M9.5 12l1.7 1.7 3.6-4"
                      />
                    </svg>
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <StatusRow label="Public Registration" status="Temporarily Paused" />
                  <StatusRow label="Administrator Access" status="Under Review" />
                  <StatusRow label="Production Database" status="Protected" />
                  <StatusRow label="Platform Configuration" status="Preserved" />
                </div>

                <div className="mt-7 rounded-2xl border border-emerald-400/15 bg-emerald-400/[0.06] p-5">
                  <div className="flex gap-4">
                    <div className="mt-1 h-3 w-3 flex-none rounded-full bg-emerald-400 shadow-[0_0_18px_rgba(52,211,153,0.75)]" />

                    <div>
                      <h3 className="font-bold text-emerald-300">
                        Your information remains protected
                      </h3>

                      <p className="mt-2 text-sm leading-6 text-zinc-400">
                        Core organizational configuration and production data
                        remain preserved while validation is completed.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-7 rounded-2xl border border-white/10 bg-black/30 p-5 text-center">
                  <p className="text-sm font-semibold text-zinc-300">
                    Thank you for your patience.
                  </p>

                  <p className="mt-2 text-xs leading-5 text-zinc-500">
                    Please return soon for the reopening of the EPEW
                    Entrepreneur Development Ecosystem.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="relative z-10 border-t border-white/10">
          <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 py-6 text-center text-xs text-zinc-500 sm:flex-row sm:items-center sm:justify-between sm:text-left md:px-10">
            <p>© {currentYear} EPEW. All rights reserved.</p>

            <p>
              Build Your Community. Build Your Business. Build Your Wealth.
            </p>
          </div>
        </footer>
      </section>
    </main>
  );
}

type StatusCardProps = {
  number: string;
  title: string;
  description: string;
};

function StatusCard({
  number,
  title,
  description,
}: StatusCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.035] p-5 backdrop-blur-sm">
      <p className="text-xs font-black tracking-[0.18em] text-amber-300">
        {number}
      </p>

      <h3 className="mt-3 text-sm font-bold text-white">{title}</h3>

      <p className="mt-2 text-xs leading-5 text-zinc-500">{description}</p>
    </div>
  );
}

type StatusRowProps = {
  label: string;
  status: string;
};

function StatusRow({
  label,
  status,
}: StatusRowProps) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl border border-white/[0.07] bg-black/20 px-4 py-4">
      <span className="text-sm font-medium text-zinc-300">{label}</span>

      <span className="text-right text-xs font-bold text-amber-300">
        {status}
      </span>
    </div>
  );
}