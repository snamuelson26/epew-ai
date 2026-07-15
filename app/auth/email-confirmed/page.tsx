import Link from "next/link";

export default function EmailConfirmedPage() {
  return (
    <main className="min-h-screen bg-slate-100 p-6">
      <div className="mx-auto max-w-2xl rounded-3xl bg-white p-10 text-center shadow-xl">
        <h1 className="text-4xl font-extrabold text-green-700">
          Email Successfully Confirmed
        </h1>

        <p className="mt-6 text-lg leading-relaxed text-slate-700">
          Your email address has been successfully verified.
        </p>

        <p className="mt-3 text-lg leading-relaxed text-slate-700">
          Welcome to the EPEW-EDE-IBOS Program. You may now access
          your Entrepreneur Portal and continue your Entrepreneur
          Development Ecosystem (EDE) Journey.
        </p>

        <Link
          href="/entrepreneurs/login"
          className="mt-8 inline-flex rounded-xl bg-[#10246f] px-7 py-4 font-bold text-white hover:bg-green-700"
        >
          Login to Your Entrepreneur Portal
        </Link>
      </div>
    </main>
  );
}