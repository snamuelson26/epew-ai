"use client";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";

import AboutSection from "@/app/components/about/AboutSection";
import WhoWeAre from "@/app/components/about/WhoWeAre";
import WhatWeDo from "@/app/components/about/WhatWeDo";
import Approach from "@/app/components/about/Approach";
import Model from "@/app/components/about/Model";
import Mission from "@/app/components/about/Mission";
import Vision from "@/app/components/about/Vision";
import Values from "@/app/components/about/Values";
import WhyEpewExists from "@/app/components/about/WhyEpewExists";
import Join from "@/app/components/about/Join";
import Disclosure from "@/app/components/about/Disclosure";

export default function AboutPage() {
  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white">
  {/* About Ekero Partners Empower Wealth */}
  <AboutSection />

  {/* Who We Are */}
  <WhoWeAre />

        {/* Every Successful Business Begins with an Idea */}
        <WhatWeDo />

        {/* EPEW Development Model */}
        <Approach />

        {/* EPEW • EDE • IBOS */}
        <Model />

        {/* Our Mission */}
        <Mission />

        {/* Our Vision */}
        <Vision />

        {/* Our Values */}
        <Values />

        {/* Why EPEW Exists */}
        <WhyEpewExists />

        {/* Join the EPEW Ecosystem and EPEW Promise */}
        <Join />

        {/* Important Disclosure */}
        <Disclosure />
      </main>

      <Footer />
    </>
  );
}