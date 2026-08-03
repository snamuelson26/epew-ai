"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

export default function VideosPage() {
  const { t } = useTranslation();
const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces(["videos"]);
  }, [loadNamespaces]);

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white text-[#06245c]">
        {/* HERO */}
        <section className="bg-white py-20">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <Image
              src="/images/videos-hero.png"
              alt={t("hero.imageAlt", {
                namespace: "videos",
              })}
              width={1600}
              height={900}
              className="mb-16 w-full rounded-3xl object-cover shadow-2xl"
              priority
            />

            <h1 className="mb-8 text-7xl font-extrabold">
              {t("hero.title", {
                namespace: "videos",
              })}
            </h1>

            <p className="mx-auto mb-12 max-w-6xl text-3xl leading-relaxed text-gray-700">
              {t("hero.description", {
                namespace: "videos",
              })}
            </p>

            <div className="flex flex-col justify-center gap-6 md:flex-row">
              <Link
                href="#featured-videos"
                className="rounded-2xl bg-[#06245c] px-10 py-5 text-2xl font-bold text-white transition hover:bg-green-600"
              >
                {t("hero.watchFeatured", {
                  namespace: "videos",
                })}
              </Link>

              <Link
                href="/entrepreneurs"
                className="rounded-2xl bg-green-600 px-10 py-5 text-2xl font-bold text-white transition hover:bg-[#06245c]"
              >
                {t("hero.becomeEntrepreneur", {
                  namespace: "videos",
                })}
              </Link>
            </div>
          </div>
        </section>

        {/* WHY THE VIDEO LIBRARY */}
        <section className="bg-[#f5f7fb] py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <h2 className="mb-10 text-6xl font-extrabold">
              {t("why.title", {
                namespace: "videos",
              })}
            </h2>

            <p className="mx-auto max-w-6xl text-3xl leading-relaxed text-gray-700">
              {t("why.description", {
                namespace: "videos",
              })}
            </p>
          </div>
        </section>

        {/* VIDEO CATEGORIES */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-16 text-center">
              <h2 className="mb-10 text-6xl font-extrabold">
                {t("categories.title", {
                  namespace: "videos",
                })}
              </h2>
            </div>

            <div className="grid gap-8 md:grid-cols-4">
              <CategoryCard
                icon="🎓"
                title={t("categories.entrepreneurFundamentals", {
                  namespace: "videos",
                })}
              />

              <CategoryCard
                icon="💼"
                title={t("categories.businessDevelopment", {
                  namespace: "videos",
                })}
              />

              <CategoryCard
                icon="🤝"
                title={t("categories.coachingMentorship", {
                  namespace: "videos",
                })}
              />

              <CategoryCard
                icon="💰"
                title={t("categories.fundingReadiness", {
                  namespace: "videos",
                })}
              />

              <CategoryCard
                icon="📣"
                title={t("categories.marketingPromotion", {
                  namespace: "videos",
                })}
              />

              <CategoryCard
                icon="🏢"
                title={t("categories.businessOperations", {
                  namespace: "videos",
                })}
              />

              <CategoryCard
                icon="📊"
                title={t("categories.financialManagement", {
                  namespace: "videos",
                })}
              />

              <CategoryCard
                icon="⭐"
                title={t("categories.successStories", {
                  namespace: "videos",
                })}
              />
            </div>
          </div>
        </section>

        {/* FEATURED VIDEOS */}
        <section
          id="featured-videos"
          className="bg-[#f5f7fb] py-24"
        >
          <div className="mx-auto max-w-7xl px-8">
            <div className="mb-16 text-center">
              <h2 className="mb-10 text-6xl font-extrabold">
                {t("featured.title", {
                  namespace: "videos",
                })}
              </h2>

              <div className="mx-auto mt-8 max-w-5xl rounded-2xl border-2 border-red-300 bg-red-50 px-8 py-6">
                <p className="text-3xl font-extrabold text-red-700">
                  {t("featured.comingSoon", {
                    namespace: "videos",
                  })}
                </p>

                <p className="mt-3 text-2xl leading-relaxed text-red-600">
                  {t("featured.comingSoonDescription", {
                    namespace: "videos",
                  })}
                </p>
              </div>
            </div>

            <div className="grid gap-10 md:grid-cols-3">
              <VideoCard
                title={t("featured.welcome.title", {
                  namespace: "videos",
                })}
                description={t(
                  "featured.welcome.description",
                  {
                    namespace: "videos",
                  },
                )}
                duration={t("featured.duration", {
                  namespace: "videos",
                })}
              />

              <VideoCard
                title={t("featured.ideaToBusiness.title", {
                  namespace: "videos",
                })}
                description={t(
                  "featured.ideaToBusiness.description",
                  {
                    namespace: "videos",
                  },
                )}
                duration={t("featured.duration", {
                  namespace: "videos",
                })}
              />

              <VideoCard
                title={t("featured.supporters.title", {
                  namespace: "videos",
                })}
                description={t(
                  "featured.supporters.description",
                  {
                    namespace: "videos",
                  },
                )}
                duration={t("featured.duration", {
                  namespace: "videos",
                })}
              />

              <VideoCard
                title={t("featured.coaching.title", {
                  namespace: "videos",
                })}
                description={t(
                  "featured.coaching.description",
                  {
                    namespace: "videos",
                  },
                )}
                duration={t("featured.duration", {
                  namespace: "videos",
                })}
              />

              <VideoCard
                title={t("featured.funding.title", {
                  namespace: "videos",
                })}
                description={t(
                  "featured.funding.description",
                  {
                    namespace: "videos",
                  },
                )}
                duration={t("featured.duration", {
                  namespace: "videos",
                })}
              />

              <VideoCard
                title={t("featured.launch.title", {
                  namespace: "videos",
                })}
                description={t(
                  "featured.launch.description",
                  {
                    namespace: "videos",
                  },
                )}
                duration={t("featured.duration", {
                  namespace: "videos",
                })}
              />
            </div>
          </div>
        </section>

        {/* LEARNING JOURNEY */}
        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <h2 className="mb-10 text-6xl font-extrabold">
              {t("journey.title", {
                namespace: "videos",
              })}
            </h2>

            <div className="mt-16 grid gap-8 md:grid-cols-4">
              <StepCard
                number="1"
                title={t("journey.startHere", {
                  namespace: "videos",
                })}
              />

              <StepCard
                number="2"
                title={t("journey.learnEcosystem", {
                  namespace: "videos",
                })}
              />

              <StepCard
                number="3"
                title={t("journey.developBusiness", {
                  namespace: "videos",
                })}
              />

              <StepCard
                number="4"
                title={t("journey.prepareGrowth", {
                  namespace: "videos",
                })}
              />
            </div>
          </div>
        </section>

        {/* CALL TO ACTION */}
        <section className="bg-[#06245c] py-24 text-white">
          <div className="mx-auto max-w-6xl px-8 text-center">
            <h2 className="mb-10 text-6xl font-extrabold">
              {t("cta.title", {
                namespace: "videos",
              })}
            </h2>

            <p className="mb-12 text-3xl leading-relaxed text-blue-100">
              {t("cta.description", {
                namespace: "videos",
              })}
            </p>

            <Link
              href="/entrepreneurs"
              className="inline-block rounded-2xl bg-green-600 px-14 py-6 text-2xl font-bold text-white transition hover:bg-white hover:text-[#06245c]"
            >
              {t("cta.button", {
                namespace: "videos",
              })}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function CategoryCard({
  icon,
  title,
}: {
  icon: string;
  title: string;
}) {
  return (
    <div className="rounded-3xl bg-[#f5f7fb] p-8 text-center shadow-xl">
      <div className="mb-6 text-6xl">{icon}</div>

      <h3 className="text-2xl font-extrabold">
        {title}
      </h3>
    </div>
  );
}

function VideoCard({
  title,
  description,
  duration,
}: {
  title: string;
  description: string;
  duration: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-10 shadow-xl">
      <div className="mb-8 flex h-56 items-center justify-center rounded-2xl bg-[#06245c]">
        <div className="text-7xl text-white">
          ▶
        </div>
      </div>

      <h3 className="mb-5 text-3xl font-extrabold">
        {title}
      </h3>

      <p className="mb-6 text-2xl leading-relaxed text-gray-700">
        {description}
      </p>

      <p className="text-xl font-bold text-green-700">
        {duration}
      </p>
    </div>
  );
}

function StepCard({
  number,
  title,
}: {
  number: string;
  title: string;
}) {
  return (
    <div className="rounded-3xl bg-[#f5f7fb] p-8 text-center shadow-xl">
      <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-700 text-3xl font-black text-white">
        {number}
      </div>

      <h3 className="text-2xl font-extrabold">
        {title}
      </h3>
    </div>
  );
}