"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-[#04163d] text-white pt-20 pb-10">

      <div className="max-w-7xl mx-auto px-8 grid md:grid-cols-4 gap-14">

        {/* CONTACT */}
        <div>
          <h3 className="text-3xl font-bold mb-8">
            Contact Us
          </h3>

          <div className="space-y-4 text-xl text-gray-300">
            <p>EPEW – Ekero Partners Empower Wealth</p>
            <p>Phone: (866) 720-0014</p>
            <p>Email: support@epew.us</p>
            <p>United States</p>
          </div>
        </div>

        {/* QUICK LINKS */}
        <div>
          <h3 className="text-3xl font-bold mb-8">
            Quick Links
          </h3>

          <div className="flex flex-col gap-5 text-xl">

            <Link
              href="/"
              className="text-gray-300 hover:text-green-400 transition"
            >
              Home
            </Link>

            <Link
              href="/about"
              className="text-gray-300 hover:text-green-400 transition"
            >
              About
            </Link>

            <Link
              href="/how-it-works"
              className="text-gray-300 hover:text-green-400 transition"
            >
              How It Works
            </Link>

            <Link
              href="/videos"
              className="text-gray-300 hover:text-green-400 transition"
            >
              Videos
            </Link>

            <Link
              href="/blogs"
              className="text-gray-300 hover:text-green-400 transition"
            >
              Blogs
            </Link>

          </div>
        </div>

        {/* EPEW TEAM */}
        <div>
          <h3 className="text-3xl font-bold mb-8">
            EPEW Team
          </h3>

          <div className="flex flex-col gap-5 text-xl">

            <Link
              href="/entrepreneurs"
              className="text-gray-300 hover:text-green-400 transition"
            >
              Entrepreneurs
            </Link>

            <Link
              href="/supporters"
              className="text-gray-300 hover:text-green-400 transition"
            >
              Supporters
            </Link>

            <Link
              href="/coaches"
              className="text-gray-300 hover:text-green-400 transition"
            >
              Coaches
            </Link>

            <Link
              href="/partners"
              className="text-gray-300 hover:text-green-400 transition"
            >
              Partners
            </Link>

          </div>
        </div>

        {/* LEGAL */}

<div>
  <h3 className="text-3xl font-bold mb-8">
    Legal
  </h3>

  <div className="flex flex-col gap-5 text-xl">

    <Link
      href="/legal"
      className="text-gray-300 hover:text-green-400 transition"
    >
      Legal Center
    </Link>

    <Link
      href="/legal/privacy-policy"
      className="text-gray-300 hover:text-green-400 transition"
    >
      Privacy Policy
    </Link>

    <Link
      href="/legal/terms-of-use"
      className="text-gray-300 hover:text-green-400 transition"
    >
      Terms of Use
    </Link>

    <Link
      href="/legal/disclaimer"
      className="text-gray-300 hover:text-green-400 transition"
    >
      Platform Disclaimer
    </Link>

  </div>
</div>
      </div>

      {/* COPYRIGHT */}
      <div className="border-t border-gray-700 mt-12 pt-8 text-center text-gray-400 text-lg">

  <p>
    © 2026 Ekero Partners Empower Wealth (EPEW). All Rights Reserved.
  </p>

  <p className="mt-2">
    Entrepreneur Development Ecosystem (EDE)
  </p>

  <p>
    Powered by the Intelligent Business Operating System (IBOS).
  </p>

</div>

    </footer>
  );
}