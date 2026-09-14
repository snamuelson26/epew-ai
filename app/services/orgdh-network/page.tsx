"use client";

import Link from "next/link";
import { useState } from "react";

const serviceGroups = [
  {
    title: "Promotion & Marketing",
    services: [
      "Business Promotion",
      "Business Exposure",
      "Social Media Promotion",
      "Community Outreach",
      "Public Relations",
      "Press Releases",
      "Digital Marketing Campaigns",
    ],
  },
  {
    title: "Branding & Design",
    services: [
      "Business Logo Design",
      "Business Card Design",
      "Flyer Design",
      "Storefront Window Graphics",
      "Vehicle Magnets & Vehicle Branding",
      "T-Shirt Design",
      "Brochure Design",
      "Event Banner Design",
      "Promotional Materials",
    ],
  },
  {
    title: "Media & Content Production",
    services: [
      "Business Welcome Page Development",
      "Business Photography",
      "Promotional Videos",
      "Media Coverage",
      "Business Story Development",
      "Grand Opening Promotion",
      "Grand Opening Media Coverage",
    ],
  },
];

export default function OrgdhNetworkServicesPage() {
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  async function submitRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setMessage("");

    const form = event.currentTarget;
    const formData = new FormData(form);
    const payload = {
      name: String(formData.get("name") || ""),
      email: String(formData.get("email") || ""),
      phone: String(formData.get("phone") || ""),
      businessName: String(formData.get("businessName") || ""),
      serviceInterest: String(formData.get("serviceInterest") || ""),
      goalDescription: String(formData.get("goalDescription") || ""),
      website: String(formData.get("website") || ""),
    };

    try {
      const response = await fetch("/api/public/orgdh/service-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = (await response.json()) as { success?: boolean; message?: string; error?: string };

      if (!response.ok || !result.success) {
        setMessage(result.error || "Unable to submit your request. Please try again.");
        return;
      }

      form.reset();
      setSubmitted(true);
      setMessage(result.message || "Your service request was submitted successfully.");
    } catch {
      setMessage("Unable to submit your request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f7fb] text-slate-900">
      <section className="bg-gradient-to-r from-blue-950 via-blue-900 to-green-700 px-6 py-14 text-white">
        <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-[180px_1fr] md:items-center">
          <div className="flex h-44 w-44 items-center justify-center overflow-hidden rounded-3xl bg-white p-3 shadow-xl">
            <img src="/images/orgdh-network.png" alt="ORGDH Network" className="h-full w-full object-contain" />
          </div>
          <div>
            <p className="text-lg font-black uppercase tracking-[0.2em] text-lime-300">ORGDH Network</p>
            <h1 className="mt-3 text-4xl font-black md:text-6xl">Business Promotion & Media Services</h1>
            <p className="mt-5 max-w-4xl text-xl leading-relaxed text-blue-50">ORGDH Network builds the entrepreneur&apos;s public image, promotes the business, and produces professional marketing materials.</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <a href="#request-services" className="rounded-xl bg-lime-300 px-6 py-3 font-black text-blue-950 hover:bg-lime-200">Describe Your Project</a>
              <Link href="/support/ORGDH-001" className="rounded-xl border-2 border-white px-6 py-3 font-black text-white hover:bg-white/10">Support ORGDH Network</Link>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-6xl space-y-8 px-6 py-10">
        <section className="grid gap-6 lg:grid-cols-3">
          {serviceGroups.map((group) => (
            <article key={group.title} className="rounded-3xl bg-white p-7 shadow-lg">
              <h2 className="text-2xl font-black text-[#10246f]">{group.title}</h2>
              <ul className="mt-5 space-y-3 text-lg text-slate-700">
                {group.services.map((service) => <li key={service}>✅ {service}</li>)}
              </ul>
            </article>
          ))}
        </section>

        <section id="request-services" className="scroll-mt-6 rounded-3xl bg-white p-7 shadow-xl md:p-10">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-green-700">Start Your Project</p>
              <h2 className="mt-3 text-4xl font-black text-[#10246f]">What do you want to accomplish?</h2>
              <p className="mt-5 text-lg leading-relaxed text-slate-700">Tell ORGDH Network about your business, audience, goals, preferred services, and the result you want. The promotion and design team will use your description to prepare the next follow-up.</p>
            </div>

            {submitted ? (
              <div className="rounded-2xl border-2 border-green-300 bg-green-50 p-7">
                <h3 className="text-2xl font-black text-green-900">Request Received</h3>
                <p className="mt-3 text-lg text-green-900">{message}</p>
                <button type="button" onClick={() => { setSubmitted(false); setMessage(""); }} className="mt-6 rounded-xl bg-[#10246f] px-5 py-3 font-bold text-white">Submit Another Request</button>
              </div>
            ) : (
              <form onSubmit={submitRequest} className="grid gap-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <Field label="Your Name" name="name" required />
                  <Field label="Business or Organization" name="businessName" />
                  <Field label="Email Address" name="email" type="email" required />
                  <Field label="Phone Number" name="phone" type="tel" />
                </div>
                <label className="grid gap-2 font-bold text-slate-800">
                  Service Area
                  <select name="serviceInterest" required className="rounded-xl border border-slate-300 bg-white px-4 py-3 font-normal">
                    <option value="">Select a service area</option>
                    {serviceGroups.map((group) => <option key={group.title} value={group.title}>{group.title}</option>)}
                    <option value="Multiple Services">Multiple Services</option>
                    <option value="Not Sure Yet">Not Sure Yet</option>
                  </select>
                </label>
                <label className="grid gap-2 font-bold text-slate-800">
                  Describe What You Want to Accomplish
                  <textarea name="goalDescription" required minLength={20} maxLength={5000} rows={8} placeholder="Describe your project, audience, goals, timeline, and the materials you need..." className="rounded-xl border border-slate-300 px-4 py-3 font-normal" />
                </label>
                <label className="hidden" aria-hidden="true">Website<input name="website" tabIndex={-1} autoComplete="off" /></label>
                {message && <p className="rounded-xl border border-red-200 bg-red-50 p-4 font-bold text-red-700">{message}</p>}
                <button type="submit" disabled={submitting} className="rounded-xl bg-green-700 px-7 py-4 text-lg font-black text-white shadow hover:bg-green-800 disabled:opacity-60">{submitting ? "Submitting..." : "Submit Service Request"}</button>
              </form>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

function Field({ label, name, type = "text", required = false }: { label: string; name: string; type?: string; required?: boolean }) {
  return <label className="grid gap-2 font-bold text-slate-800">{label}<input name={name} type={type} required={required} maxLength={200} className="rounded-xl border border-slate-300 px-4 py-3 font-normal" /></label>;
}
