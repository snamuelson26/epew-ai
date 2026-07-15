"use client";

import Image from "next/image";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="bg-[#06245c] shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">
        <Link href="/">
          <Image
            src="/images/epew-logo.png"
            alt="EPEW Logo"
            width={220}
            height={90}
            style={{ width: "auto", height: "auto" }}
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-8 text-white text-xl font-semibold">
          <Link href="/" className="hover:text-green-400 transition">
            Home
          </Link>

          <div className="relative group">
            <div className="flex items-center gap-1 cursor-default select-none hover:text-green-400 transition">
              <span>About</span>
              <span className="text-sm">▼</span>
            </div>

            <div className="absolute left-0 top-full hidden group-hover:block bg-white text-[#06245c] rounded-2xl shadow-2xl w-80 py-3 z-50">
              <Link href="/about" className="block px-6 py-3 hover:bg-green-100">
                About EPEW
              </Link>

              <Link
                href="/professional-support"
                className="block px-6 py-3 hover:bg-green-100"
              >
                Professional Support Center
              </Link>

              <Link
                href="/how-it-works"
                className="block px-6 py-3 hover:bg-green-100"
              >
                How EPEW Works
              </Link>

            </div>
          </div>

          <Link href="/how-it-works" className="hover:text-green-400 transition">
            How
          </Link>

          <div className="relative group">
            <div className="flex items-center gap-1 cursor-default select-none hover:text-green-400 transition">
              <span>EPEW Team</span>
              <span className="text-sm">▼</span>
            </div>

            <div className="absolute left-0 top-full hidden group-hover:block bg-white text-[#06245c] rounded-2xl shadow-2xl w-64 py-3 z-50">
              <Link
                href="/entrepreneurs"
                className="block px-6 py-3 hover:bg-green-100"
              >
                Entrepreneurs
              </Link>

              <Link
                href="/supporters"
                className="block px-6 py-3 hover:bg-green-100"
              >
                Supporters
              </Link>

              <Link href="/coaches" className="block px-6 py-3 hover:bg-green-100">
                Coaches
              </Link>

              <Link href="/partners" className="block px-6 py-3 hover:bg-green-100">
                Partners
              </Link>
            </div>
          </div>

          <Link href="/videos" className="hover:text-green-400 transition">
            Videos
          </Link>

          <Link href="/blogs" className="hover:text-green-400 transition">
            Blogs
          </Link>
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <select
            className="bg-white text-[#06245c] px-4 py-2 rounded-xl text-lg font-bold outline-none cursor-pointer"
            defaultValue="EN"
          >
            <option value="EN">EN</option>
            <option value="FR">FR</option>
            <option value="HT">HT</option>
            <option value="ES">ES</option>
            <option value="TL">TL</option>
          </select>

          <div className="relative group">
            <div className="bg-white text-[#06245c] px-7 py-3 rounded-xl text-xl font-bold hover:bg-green-500 hover:text-white transition cursor-default select-none">
              Login
            </div>

            <div className="absolute right-0 top-full hidden group-hover:block bg-white text-[#06245c] rounded-2xl shadow-2xl w-72 py-3 z-50">
              <Link
                href="/entrepreneurs/login"
                className="block px-6 py-3 hover:bg-green-100"
              >
                Entrepreneur Login
              </Link>

              <Link
                href="/supporters/login"
                className="block px-6 py-3 hover:bg-green-100"
              >
                Supporter Login
              </Link>

              <Link
                href="/coaches/login"
                className="block px-6 py-3 hover:bg-green-100"
              >
                Coach Login
              </Link>

              <Link
                href="/partners/login"
                className="block px-6 py-3 hover:bg-green-100"
              >
                Partner Login
              </Link>

              <Link
                href="/admin/login"
                className="block px-6 py-3 hover:bg-green-100"
              >
                Admin Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}