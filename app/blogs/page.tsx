"use client";

import { useEffect } from "react";
import Link from "next/link";

import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

import {
  useLanguage,
  useTranslation,
} from "@/app/components/enterprise/language";

export default function BlogsPage() {
  const { t } = useTranslation();
  const { loadNamespaces } = useLanguage();

  useEffect(() => {
    void loadNamespaces(["blogs"]);
  }, [loadNamespaces]);

  const categories = [
    {
      title: t("categories.entrepreneurship.title", {
        namespace: "blogs",
      }),
      description: t(
        "categories.entrepreneurship.description",
        {
          namespace: "blogs",
        },
      ),
      icon: "🚀",
    },
    {
      title: t("categories.wealthBuilding.title", {
        namespace: "blogs",
      }),
      description: t(
        "categories.wealthBuilding.description",
        {
          namespace: "blogs",
        },
      ),
      icon: "💰",
    },
    {
      title: t(
        "categories.communityDevelopment.title",
        {
          namespace: "blogs",
        },
      ),
      description: t(
        "categories.communityDevelopment.description",
        {
          namespace: "blogs",
        },
      ),
      icon: "🌍",
    },
    {
      title: t("categories.epewNews.title", {
        namespace: "blogs",
      }),
      description: t(
        "categories.epewNews.description",
        {
          namespace: "blogs",
        },
      ),
      icon: "📢",
    },
    {
      title: t("categories.coachCorner.title", {
        namespace: "blogs",
      }),
      description: t(
        "categories.coachCorner.description",
        {
          namespace: "blogs",
        },
      ),
      icon: "🤝",
    },
    {
      title: t(
        "categories.partnerSpotlight.title",
        {
          namespace: "blogs",
        },
      ),
      description: t(
        "categories.partnerSpotlight.description",
        {
          namespace: "blogs",
        },
      ),
      icon: "⭐",
    },
  ];

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-[#f5f7fb] text-[#06245c]">
        <section className="px-8 py-24 text-center">
          <h1 className="mb-8 text-7xl font-extrabold">
            {t("hero.title", {
              namespace: "blogs",
            })}
          </h1>

          <p className="mx-auto max-w-5xl text-3xl leading-relaxed text-gray-700">
            {t("hero.description", {
              namespace: "blogs",
            })}
          </p>
        </section>

        <section className="mx-auto max-w-7xl px-8 pb-24">
          <div className="grid gap-10 md:grid-cols-3">
            {categories.map((item) => (
              <div
                key={item.title}
                className="rounded-3xl bg-white p-10 text-center shadow-xl"
              >
                <div className="mb-8 text-7xl">
                  {item.icon}
                </div>

                <h2 className="mb-6 text-4xl font-bold">
                  {item.title}
                </h2>

                <p className="text-2xl leading-relaxed text-gray-700">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-[#06245c] px-8 py-24 text-white">
          <div className="mx-auto max-w-6xl text-center">
            <h2 className="mb-8 text-6xl font-extrabold">
              {t("knowledgeCenter.title", {
                namespace: "blogs",
              })}
            </h2>

            <p className="mb-12 text-3xl leading-relaxed text-gray-200">
              {t("knowledgeCenter.description", {
                namespace: "blogs",
              })}
            </p>

            <div className="flex flex-col justify-center gap-8 md:flex-row">
              <Link
                href="/entrepreneurs"
                className="rounded-2xl bg-green-600 px-12 py-5 text-2xl font-bold text-white transition hover:bg-white hover:text-[#06245c]"
              >
                {t(
                  "knowledgeCenter.entrepreneurResources",
                  {
                    namespace: "blogs",
                  },
                )}
              </Link>

              <Link
                href="/supporters"
                className="rounded-2xl bg-white px-12 py-5 text-2xl font-bold text-[#06245c] transition hover:bg-green-600 hover:text-white"
              >
                {t(
                  "knowledgeCenter.supporterResources",
                  {
                    namespace: "blogs",
                  },
                )}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}