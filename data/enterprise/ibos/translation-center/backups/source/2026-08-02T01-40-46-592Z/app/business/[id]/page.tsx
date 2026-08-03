"use client";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

type BusinessProfile = {
  id: string | number;
  full_name?: string | null;
  business_name?: string | null;
  business_description?: string | null;
  business_category?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  entrepreneur_code?: string | null;
  campaign_slug?: string | null;
  funding_goal?: number | null;
  current_stage?: string | null;
  ibos_status?: string | null;

  business_photo_url?: string | null;
  entrepreneur_photo_url?: string | null;
  business_logo_url?: string | null;
  business_phone?: string | null;
  business_email?: string | null;
  business_website?: string | null;
  business_hours?: string | null;

  business_photo_1?: string | null;
  business_photo_2?: string | null;
  business_photo_3?: string | null;
  business_photo_4?: string | null;

  services?: string | null;
  mission?: string | null;
  vision?: string | null;
  history?: string | null;
  experience?: string | null;
  languages?: string | null;

  community_units_supported?: number | null;
  community_units_required?: number | null;
};

export default function BusinessWelcomePage() {
  const params = useParams();
  const id = String(params?.id || "");

  const [business, setBusiness] = useState<BusinessProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (id) loadBusiness();
  }, [id]);

  async function loadBusiness() {
    setLoading(true);
    setMessage("");

    let data: any = null;
    let error: any = null;

  const result = await supabase
  .from("entrepreneurs")
  .select("*")
  .or(
    `public_business_id.eq.${id},entrepreneur_code.eq.${id},campaign_slug.eq.${id}`
  )
  .maybeSingle();

    data = result.data;
    error = result.error;

    if (!data) {
  const fallback = await supabase
  .from("entrepreneur_applications")
  .select("*")
  .eq("public_business_id", id)
  .maybeSingle();

      data = fallback.data;
      error = fallback.error;
    }

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (!data) {
      setMessage("Business page not found.");
      setLoading(false);
      return;
    }

    const campaignCode = data.entrepreneur_code || id;

    if (typeof window !== "undefined") {
      localStorage.setItem("epew_campaign_source", campaignCode);
      localStorage.setItem("epew_supported_entrepreneur", campaignCode);
    }

    setBusiness(data);
    setLoading(false);
  }

  const campaignCode = business?.entrepreneur_code || id;

  const unitsSupported = Number(business?.community_units_supported || 0);
  const unitsRequired = Number(business?.community_units_required || 20);
  const remaining = Math.max(0, unitsRequired - unitsSupported);

  const progress =
    unitsRequired > 0
      ? Math.min(100, Math.round((unitsSupported / unitsRequired) * 100))
      : 0;

  const services = useMemo(() => {
    const raw = business?.services || "";

    if (!raw.trim()) {
      return [
        "Business Services",
        "Professional Support",
        "Customer Solutions",
        "Community Services",
      ];
    }

    return raw
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
  }, [business]);

  const gallery = [
    business?.business_photo_url,
    business?.business_photo_1,
    business?.business_photo_2,
    business?.business_photo_3,
    business?.business_photo_4,
  ].filter(Boolean) as string[];

  const phone = business?.business_phone || business?.phone || "";
  const email = business?.business_email || business?.email || "";
  const website = business?.business_website || business?.website || "";

  async function shareBusiness() {
    const url =
      typeof window !== "undefined"
        ? `${window.location.origin}/business/${campaignCode}`
        : `/business/${campaignCode}`;

    try {
      await navigator.clipboard.writeText(url);
      setMessage("Business page link copied successfully.");
    } catch {
      setMessage("Unable to copy link. Please copy it manually.");
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
        <p className="text-2xl font-bold">Loading Business Welcome Page...</p>
      </main>
    );
  }

  if (!business) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-10 text-[#06245c]">
        <div className="mx-auto max-w-4xl rounded-3xl bg-white p-10 shadow-xl">
          <h1 className="text-4xl font-extrabold">Business Welcome Page</h1>
          <p className="mt-4 text-2xl text-gray-700">{message}</p>
        </div>
      </main>
    );
  }

 return (
  <>
    <Navbar />

    <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
      {message && (
        <div className="sticky top-0 z-50 bg-green-700 px-4 py-3 text-center text-lg font-bold text-white">
          {message}
        </div>
      )}

      <section className="bg-gradient-to-r from-[#06245c] via-[#0b3b91] to-green-700 px-8 py-16 text-white">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.2fr_0.8fr] lg:items-center">
          <div>
            <p className="text-xl font-black uppercase tracking-widest text-lime-300">
              EPEW Verified Business
            </p>

            <h1 className="mt-4 text-6xl font-extrabold leading-tight">
              {business.business_name || "Business Name"}
            </h1>

            <p className="mt-4 text-3xl font-bold text-blue-100">
              Led by {business.full_name || "EPEW Entrepreneur"}
            </p>

            <div className="mt-6 flex flex-wrap gap-3">
              <Badge text="🟢 Verified EPEW Entrepreneur" />
              <Badge text={business.ibos_status || "Preparing for Launch"} />
              <Badge text={business.business_category || "Business Category"} />
            </div>

            <p className="mt-6 text-2xl font-semibold text-blue-50">
              {business.city || "City"} • {business.state || "State/Province"} •{" "}
              {business.country || "Country"}
            </p>

            <div className="mt-10 flex flex-wrap gap-4">
              {phone && (
                <a
                  href={`tel:${phone}`}
                  className="rounded-2xl bg-white px-8 py-4 text-xl font-black text-[#06245c] hover:bg-lime-300"
                >
                  📞 Call
                </a>
              )}

              {email && (
                <a
                  href={`mailto:${email}`}
                  className="rounded-2xl bg-white px-8 py-4 text-xl font-black text-[#06245c] hover:bg-lime-300"
                >
                  ✉️ Email
                </a>
              )}

              {website && (
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-2xl bg-white px-8 py-4 text-xl font-black text-[#06245c] hover:bg-lime-300"
                >
                  🌐 Website
                </a>
              )}

              <button
                onClick={shareBusiness}
                className="rounded-2xl bg-lime-400 px-8 py-4 text-xl font-black text-[#06245c] hover:bg-lime-300"
              >
                📤 Share Business
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/20 bg-white/10 p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-white text-6xl font-black text-[#06245c]">
              {business.entrepreneur_photo_url ? (
                <img
                  src={business.entrepreneur_photo_url}
                  alt={business.full_name || "Entrepreneur"}
                  className="h-full w-full object-cover"
                />
              ) : (
                (business.full_name || "E").charAt(0)
              )}
            </div>

            <h2 className="mt-6 text-4xl font-black">
              {business.full_name || "Entrepreneur"}
            </h2>

            <p className="mt-2 text-xl text-blue-100">
              Founder of {business.business_name || "Business"}
            </p>

            <div className="mt-6 rounded-2xl bg-black/20 p-5">
              <p className="text-sm font-bold uppercase text-lime-300">
                Business Status
              </p>
              <p className="mt-2 text-2xl font-black">
                {business.current_stage || "Preparing for Launch"}
              </p>
            </div>
          </div>
        </div>
      </section>

            <div className="mx-auto max-w-7xl space-y-10 px-8 py-10">
        <section className="rounded-3xl bg-white p-10 shadow-xl">
          <h2 className="text-5xl font-extrabold text-[#06245c]">
            Welcome to My Business at EPEW
          </h2>

          <p className="mt-6 text-2xl leading-relaxed text-gray-700">
            Welcome and thank you for visiting{" "}
            <strong>{business.business_name || "our business"}</strong>. We are
            proud to introduce our business, our mission, and the community we
            are building through the EPEW ecosystem.
          </p>
        </section>

        <section className="grid gap-8 lg:grid-cols-3">
          <InfoCard
            title="Our Mission"
            text={
              business.mission ||
              "To serve our customers with professionalism, integrity, and commitment while creating positive impact in the community."
            }
          />

          <InfoCard
            title="Our Vision"
            text={
              business.vision ||
              "To grow into a trusted business that creates opportunities, strengthens families, and contributes to long-term community development."
            }
          />

          <InfoCard
            title="Our Experience"
            text={
              business.experience ||
              "This entrepreneur is preparing to bring valuable services, dedication, and leadership to the community."
            }
          />
        </section>

        <section className="rounded-3xl bg-white p-10 shadow-xl">
          <h2 className="text-4xl font-extrabold text-[#06245c]">
            About My Business
          </h2>

          <p className="mt-6 whitespace-pre-line text-2xl leading-relaxed text-gray-700">
            {business.business_description ||
              "Our business is being developed to serve customers, create value, and contribute to stronger communities. Through EPEW, we are preparing our business foundation, building our community, and moving toward long-term success."}
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-3">
            <SmallInfo
              label="Business Category"
              value={business.business_category || "Not provided"}
            />

            <SmallInfo
              label="Location"
              value={`${business.city || "City"} • ${
                business.state || "State"
              } • ${business.country || "Country"}`}
            />

            <SmallInfo
              label="Languages"
              value={business.languages || "Not provided"}
            />
          </div>
        </section>

        <section className="rounded-3xl bg-white p-10 shadow-xl">
          <h2 className="text-4xl font-extrabold text-[#06245c]">
            Products & Services
          </h2>

          <p className="mt-4 text-2xl leading-relaxed text-gray-700">
            Learn more about the services and solutions this business is
            preparing to offer to customers and the community.
          </p>

          <div className="mt-8 grid gap-5 md:grid-cols-4">
            {services.map((service) => (
              <div
                key={service}
                className="rounded-3xl border border-gray-200 bg-[#f5f7fb] p-6 shadow-md"
              >
                <div className="text-5xl">✅</div>
                <h3 className="mt-4 text-2xl font-extrabold text-[#06245c]">
                  {service}
                </h3>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-3xl bg-white p-10 shadow-xl">
          <h2 className="text-4xl font-extrabold text-[#06245c]">
            Why Choose Our Servicess?
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-4">
            <ReasonCard
              icon="⭐"
              title="Professionalism"
              text="We are committed to serving customers with respect, preparation, and accountability."
            />

            <ReasonCard
              icon="🤝"
              title="Community Commitment"
              text="We believe businesses should strengthen the communities they serve."
            />

            <ReasonCard
              icon="📈"
              title="Growth Focused"
              text="Our goal is to grow responsibly while creating long-term value."
            />

            <ReasonCard
              icon="🛡️"
              title="EPEW Verified"
              text="This entrepreneur is part of the EPEW business development ecosystem."
            />
          </div>
        </section>

                <section className="rounded-3xl bg-white p-10 shadow-xl">
          <h2 className="text-4xl font-extrabold text-[#06245c]">
            Business Gallery
          </h2>

          <p className="mt-4 text-2xl text-gray-700">
            Take a look at our business, our work, and our journey.
          </p>

          {gallery.length > 0 ? (
            <div className="mt-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {gallery.map((photo, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-3xl shadow-lg"
                >
                  <img
                    src={photo}
                    alt={`Gallery ${index + 1}`}
                    className="h-64 w-full object-cover"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 rounded-3xl border-2 border-dashed border-gray-300 p-16 text-center text-xl text-gray-500">
              Business gallery coming soon.
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white p-10 shadow-xl">
          <h2 className="text-4xl font-extrabold text-[#06245c]">
            Testimonials
          </h2>

          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <div className="rounded-3xl bg-blue-50 p-8">
              <h3 className="text-2xl font-extrabold text-[#06245c]">
                Customer Reviews
              </h3>

              <p className="mt-4 text-xl text-gray-700">
                Customer testimonials will appear here as the business grows.
              </p>
            </div>

            <div className="rounded-3xl bg-green-50 p-8">
              <h3 className="text-2xl font-extrabold text-[#06245c]">
                Coach Recommendation
              </h3>

              <p className="mt-4 text-xl text-gray-700">
                The assigned EPEW Coach may publish a professional recommendation
                after working with the entrepreneur.
              </p>
            </div>
          </div>
        </section>

        <section className="rounded-3xl border-2 border-green-400 bg-green-50 p-10 shadow-xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <h2 className="text-5xl font-extrabold text-green-900">
                Build This Business With Us
              </h2>

              <p className="mt-6 text-2xl leading-relaxed text-green-900">
                Become part of our story by joining our community of Founding
                Supporters. Your participation helps launch businesses, create
                jobs, and strengthen communities.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href={`/supporters?campaign=${campaignCode}`}
                  className="rounded-2xl bg-green-700 px-8 py-5 text-xl font-extrabold text-white hover:bg-green-800"
                >
                  Become a Founding Supporter
                </Link>

                <Link
                  href={`/campaign/${campaignCode}`}
                  className="rounded-2xl bg-[#06245c] px-8 py-5 text-xl font-extrabold text-white hover:bg-[#041a46]"
                >
                  View Community Progress
                </Link>
              </div>
            </div>

            <div className="rounded-3xl bg-white p-8 shadow-lg">
              <h3 className="text-3xl font-extrabold text-[#06245c]">
                Community Leadership Goal
              </h3>

              <div className="mt-8 flex items-center gap-8">
                <div className="flex h-36 w-36 items-center justify-center rounded-full border-[10px] border-green-600 text-4xl font-extrabold text-green-700">
                  {progress}%
                </div>

                <div>
                  <p className="text-4xl font-extrabold text-[#06245c]">
                    {unitsSupported} / {unitsRequired}
                  </p>

                  <p className="text-xl text-gray-600">
                    Community Support Units
                  </p>

                  <p className="mt-3 text-xl font-bold text-green-700">
                    {remaining} Units Remaining
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4 text-xl text-gray-700">
                <p>✅ Help launch this business.</p>
                <p>✅ Become part of our permanent history.</p>
                <p>✅ Attend the Grand Opening.</p>
                <p>✅ Receive your Digital Founding Supporter Certificate.</p>
                <p>
                  ✅ Participation benefits may be up to{" "}
                  <strong>6% annually</strong>, subject to business performance
                  and EPEW policies.
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-10 shadow-xl">
          <h2 className="text-4xl font-extrabold text-[#06245c]">
            Contact Information
          </h2>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <SmallInfo label="Phone" value={phone || "Not Provided"} />

            <SmallInfo label="Email" value={email || "Not Provided"} />

            <SmallInfo label="Website" value={website || "Not Provided"} />

            <SmallInfo
              label="Business Hours"
              value={business.business_hours || "Coming Soon"}
            />

            <SmallInfo
              label="Location"
              value={`${business.city || "City"} • ${
                business.state || "State"
              } • ${business.country || "Country"}`}
            />

            <SmallInfo
              label="Business Status"
              value={business.current_stage || "Preparing for Launch"}
            />
          </div>
        </section>

                <section className="rounded-3xl bg-[#06245c] p-10 text-center text-white shadow-xl">
          <h2 className="text-4xl font-extrabold">
            Powered by IBOS — I Am My Own Boss
          </h2>

          <p className="mt-4 text-2xl text-blue-100">
            An Entrepreneur Development Ecosystem powered by Ekero Partners
            Empower Wealth.
          </p>
                </section>
      </div>
    </main>

    <Footer />
  </>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <span className="rounded-full bg-white/15 px-5 py-3 text-sm font-black text-white">
      {text}
    </span>
  );
}

function InfoCard({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl">
      <h3 className="text-3xl font-extrabold text-[#06245c]">{title}</h3>
      <p className="mt-4 text-xl leading-relaxed text-gray-700">{text}</p>
    </div>
  );
}

function ReasonCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-[#f5f7fb] p-7 shadow-md">
      <div className="text-5xl">{icon}</div>
      <h3 className="mt-4 text-2xl font-extrabold text-[#06245c]">
        {title}
      </h3>
      <p className="mt-3 text-lg leading-relaxed text-gray-700">{text}</p>
    </div>
  );
}

function SmallInfo({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl bg-[#f5f7fb] p-6 shadow-md">
      <p className="text-sm font-bold uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-xl font-extrabold text-[#06245c]">{value}</p>
    </div>
  );
}