"use client";

import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Navbar from "@/app/components/Navbar";
import Footer from "@/app/components/Footer";
import { useLanguage } from "@/app/components/enterprise/language/useLanguage";

const APPLICATION_OPENING_DATE = new Date(
  "2026-07-29T00:00:00-04:00",
);

type Countdown = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  isOpen: boolean;
};

type TranslationFunction = (
  key: string,
) => string;

type IconCardDefinition = {
  icon: string;
  titleKey: string;
  textKey: string;
};

type PillarDefinition = {
  icon: string;
  name: string;
  subtitleKey: string;
  textKey: string;
};

type TextCardDefinition = {
  titleKey: string;
  textKey: string;
};

const PREVIEW_CARDS: IconCardDefinition[] = [
  {
    icon: "📘",
    titleKey:
      "homepage.preview.cards.program.title",
    textKey:
      "homepage.preview.cards.program.text",
  },
  {
    icon: "🎥",
    titleKey:
      "homepage.preview.cards.introduction.title",
    textKey:
      "homepage.preview.cards.introduction.text",
  },
  {
    icon: "💡",
    titleKey:
      "homepage.preview.cards.idea.title",
    textKey:
      "homepage.preview.cards.idea.text",
  },
];

const MODEL_CARDS: IconCardDefinition[] = [
  {
    icon: "💡",
    titleKey:
      "homepage.model.steps.idea.title",
    textKey:
      "homepage.model.steps.idea.text",
  },
  {
    icon: "🏛️",
    titleKey:
      "homepage.model.steps.development.title",
    textKey:
      "homepage.model.steps.development.text",
  },
  {
    icon: "💰",
    titleKey:
      "homepage.model.steps.funding.title",
    textKey:
      "homepage.model.steps.funding.text",
  },
  {
    icon: "🌍",
    titleKey:
      "homepage.model.steps.ecosystem.title",
    textKey:
      "homepage.model.steps.ecosystem.text",
  },
  {
    icon: "⚙️",
    titleKey:
      "homepage.model.steps.ibos.title",
    textKey:
      "homepage.model.steps.ibos.text",
  },
];

const PILLARS: PillarDefinition[] = [
  {
    icon: "🏛️",
    name: "EPEW",
    subtitleKey:
      "homepage.pillars.epew.subtitle",
    textKey:
      "homepage.pillars.epew.text",
  },
  {
    icon: "🌍",
    name: "EDE",
    subtitleKey:
      "homepage.pillars.ede.subtitle",
    textKey:
      "homepage.pillars.ede.text",
  },
  {
    icon: "⚙️",
    name: "IBOS",
    subtitleKey:
      "homepage.pillars.ibos.subtitle",
    textKey:
      "homepage.pillars.ibos.text",
  },
];

const WHY_CARDS: TextCardDefinition[] = [
  {
    titleKey:
      "homepage.why.cards.development.title",
    textKey:
      "homepage.why.cards.development.text",
  },
  {
    titleKey:
      "homepage.why.cards.support.title",
    textKey:
      "homepage.why.cards.support.text",
  },
  {
    titleKey:
      "homepage.why.cards.funding.title",
    textKey:
      "homepage.why.cards.funding.text",
  },
  {
    titleKey:
      "homepage.why.cards.growth.title",
    textKey:
      "homepage.why.cards.growth.text",
  },
];

const LEADERSHIP_LINES = [
  "homepage.leadership.owner",
  "homepage.leadership.decisions",
  "homepage.leadership.vision",
  "homepage.leadership.notRun",
  "homepage.leadership.ecosystem",
];

const PROMISE_LINES = [
  "homepage.promise.vision",
  "homepage.promise.develop",
  "homepage.promise.ecosystem",
  "homepage.promise.funding",
];

function getCountdown(): Countdown {
  const difference =
    APPLICATION_OPENING_DATE.getTime() -
    Date.now();

  if (difference <= 0) {
    return {
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isOpen: true,
    };
  }

  return {
    days: Math.floor(
      difference /
        (1000 * 60 * 60 * 24),
    ),
    hours: Math.floor(
      (difference /
        (1000 * 60 * 60)) %
        24,
    ),
    minutes: Math.floor(
      (difference /
        (1000 * 60)) %
        60,
    ),
    seconds: Math.floor(
      (difference / 1000) %
        60,
    ),
    isOpen: false,
  };
}

export default function HomePage() {
  const {
    t,
    formatDate,
  } = useLanguage();

  const [countdown, setCountdown] =
    useState<Countdown>({
      days: 0,
      hours: 0,
      minutes: 0,
      seconds: 0,
      isOpen: false,
    });

  useEffect(() => {
    function updateCountdown(): void {
      setCountdown(getCountdown());
    }

    updateCountdown();

    const interval =
      window.setInterval(
        updateCountdown,
        1000,
      );

    return () => {
      window.clearInterval(interval);
    };
  }, []);

  const openingDateLabel = useMemo(
    () =>
      formatDate(
        APPLICATION_OPENING_DATE,
        {
          weekday: "long",
          month: "long",
          day: "numeric",
          year: "numeric",
          timeZone:
            "America/New_York",
        },
      ),
    [formatDate],
  );

  const text = {
    banner: {
      title: t(
        "homepage.banner.title",
      ),
      description: t(
        "homepage.banner.description",
      ),
    },

    launch: {
      cohort: t(
        "homepage.launch.cohort",
      ),
      applicationsOpen: t(
        "homepage.launch.applicationsOpen",
      ),
      openDescription: t(
        "homepage.launch.openDescription",
      ),
      countdownTitle: t(
        "homepage.launch.countdownTitle",
      ),
      description: t(
        "homepage.launch.description",
      ),
    },

    countdown: {
      days: t(
        "homepage.countdown.days",
      ),
      hours: t(
        "homepage.countdown.hours",
      ),
      minutes: t(
        "homepage.countdown.minutes",
      ),
      seconds: t(
        "homepage.countdown.seconds",
      ),
    },

    buttons: {
      startJourney: t(
        "homepage.buttons.startJourney",
      ),
      applicationsOpen: t(
        "homepage.buttons.applicationsOpen",
      ),
      exploreEcosystem: t(
        "homepage.buttons.exploreEcosystem",
      ),
      learnMore: t(
        "homepage.buttons.learnMore",
      ),
    },

    hero: {
      titleLine1: t(
        "homepage.hero.titleLine1",
      ),
      titleLine2: t(
        "homepage.hero.titleLine2",
      ),
      titleLine3: t(
        "homepage.hero.titleLine3",
      ),
      lead: t(
        "homepage.hero.lead",
      ),
      description: t(
        "homepage.hero.description",
      ),
      imageAlt: t(
        "homepage.hero.imageAlt",
      ),
    },

    preview: {
      eyebrow: t(
        "homepage.preview.eyebrow",
      ),
      title: t(
        "homepage.preview.title",
      ),
      description: t(
        "homepage.preview.description",
      ),
    },

    idea: {
      title: t(
        "homepage.idea.title",
      ),
      description: t(
        "homepage.idea.description",
      ),
    },

    model: {
      title: t(
        "homepage.model.title",
      ),
      description: t(
        "homepage.model.description",
      ),
    },

    pillars: {
      title: t(
        "homepage.pillars.title",
      ),
      description: t(
        "homepage.pillars.description",
      ),
    },

    ecosystem: {
      title: t(
        "homepage.ecosystem.title",
      ),
      description: t(
        "homepage.ecosystem.description",
      ),
      imageAlt: t(
        "homepage.ecosystem.imageAlt",
      ),
    },

    journey: {
      title: t(
        "homepage.journey.title",
      ),
      description: t(
        "homepage.journey.description",
      ),
      imageAlt: t(
        "homepage.journey.imageAlt",
      ),
    },

    video: {
      title: t(
        "homepage.video.title",
      ),
      description: t(
        "homepage.video.description",
      ),
      frameTitle: t(
        "homepage.video.frameTitle",
      ),
    },

    why: {
      title: t(
        "homepage.why.title",
      ),
    },

    leadership: {
      title: t(
        "homepage.leadership.title",
      ),
    },

    global: {
      title: t(
        "homepage.global.title",
      ),
      description: t(
        "homepage.global.description",
      ),
    },

    promise: {
      title: t(
        "homepage.promise.title",
      ),
      conclusion: t(
        "homepage.promise.conclusion",
      ),
    },
  };

  return (
    <>
      <Navbar />

      <main className="bg-white text-[#06245c]">
        <section className="bg-[#06245c] px-6 py-4 text-center text-white">
          <p className="text-lg font-extrabold md:text-2xl">
            {text.banner.title}
          </p>

          <p className="mt-1 text-sm font-semibold text-blue-100 md:text-lg">
            {text.banner.description}
          </p>
        </section>

        <section className="bg-white py-16 md:py-20">
          <div className="mx-auto max-w-7xl px-6 text-center md:px-8">
            <div className="mb-12 flex justify-center md:mb-14">
              <Image
                src="/images/hero-main.png"
                alt={text.hero.imageAlt}
                width={1300}
                height={760}
                className="rounded-3xl shadow-2xl"
                priority
              />
            </div>

            <div className="mx-auto mb-14 max-w-6xl rounded-3xl border-4 border-amber-400 bg-gradient-to-r from-[#06245c] via-blue-900 to-green-700 p-8 text-white shadow-2xl md:p-12">
              <p className="text-lg font-extrabold uppercase tracking-[0.25em] text-lime-300 md:text-2xl">
                {text.launch.cohort}
              </p>

              {countdown.isOpen ? (
                <>
                  <h2 className="mt-5 text-4xl font-black md:text-7xl">
                    {
                      text.launch
                        .applicationsOpen
                    }
                  </h2>

                  <p className="mx-auto mt-5 max-w-3xl text-xl leading-relaxed text-blue-100 md:text-2xl">
                    {
                      text.launch
                        .openDescription
                    }
                  </p>
                </>
              ) : (
                <>
                  <h2 className="mt-5 text-4xl font-black md:text-6xl">
                    {
                      text.launch
                        .countdownTitle
                    }
                  </h2>

                  <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-6">
                    <CountdownCard
                      value={
                        countdown.days
                      }
                      label={
                        text.countdown
                          .days
                      }
                    />

                    <CountdownCard
                      value={
                        countdown.hours
                      }
                      label={
                        text.countdown
                          .hours
                      }
                    />

                    <CountdownCard
                      value={
                        countdown.minutes
                      }
                      label={
                        text.countdown
                          .minutes
                      }
                    />

                    <CountdownCard
                      value={
                        countdown.seconds
                      }
                      label={
                        text.countdown
                          .seconds
                      }
                    />
                  </div>

                  <p className="mt-8 text-xl font-bold text-lime-200 md:text-3xl">
                    {openingDateLabel}
                  </p>
                </>
              )}

              <p className="mx-auto mt-8 max-w-4xl text-lg leading-relaxed text-white/90 md:text-2xl">
                {text.launch.description}
              </p>

              <div className="mt-9 flex flex-col items-center justify-center gap-5 md:flex-row">
                <ApplicationButton
                  isOpen={
                    countdown.isOpen
                  }
                  openLabel={
                    text.buttons
                      .startJourney
                  }
                  closedLabel={
                    text.buttons
                      .applicationsOpen
                  }
                  variant="gold"
                />

                <Link
                  href="/entrepreneurs"
                  className="w-full rounded-2xl border-2 border-white px-10 py-5 text-xl font-extrabold text-white transition hover:bg-white hover:text-[#06245c] md:w-auto md:text-2xl"
                >
                  {
                    text.buttons
                      .exploreEcosystem
                  }
                </Link>
              </div>
            </div>

            <h1 className="mb-8 text-5xl font-extrabold leading-tight md:text-7xl">
              {text.hero.titleLine1}
              <br />
              {text.hero.titleLine2}
              <br />
              {text.hero.titleLine3}
            </h1>

            <div className="mx-auto mb-12 max-w-6xl space-y-6 text-2xl leading-relaxed text-gray-700 md:text-3xl">
              <p className="font-bold text-[#06245c]">
                {text.hero.lead}
              </p>

              <p>
                {text.hero.description}
              </p>
            </div>

            <div className="flex flex-col items-center justify-center gap-6 md:flex-row">
              <ApplicationButton
                isOpen={
                  countdown.isOpen
                }
                openLabel={
                  text.buttons
                    .startJourney
                }
                closedLabel={
                  text.buttons
                    .applicationsOpen
                }
                variant="green"
              />

              <Link
                href="/about"
                className="rounded-2xl border-2 border-[#06245c] px-12 py-5 text-2xl font-bold text-[#06245c] transition hover:bg-[#06245c] hover:text-white"
              >
                {text.buttons.learnMore}
              </Link>
            </div>
          </div>
        </section>

        <section className="bg-[#f5f7fb] py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <p className="text-xl font-extrabold uppercase tracking-widest text-green-700">
              {text.preview.eyebrow}
            </p>

            <h2 className="mt-3 text-5xl font-extrabold md:text-6xl">
              {text.preview.title}
            </h2>

            <p className="mx-auto mt-8 max-w-5xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
              {text.preview.description}
            </p>

            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {PREVIEW_CARDS.map(
                (card) => (
                  <PreviewCard
                    key={card.titleKey}
                    icon={card.icon}
                    title={t(
                      card.titleKey,
                    )}
                    text={t(
                      card.textKey,
                    )}
                  />
                ),
              )}
            </div>
          </div>
        </section>

        <TextSection
          title={text.idea.title}
          description={
            text.idea.description
          }
          background="white"
        />

        <section className="bg-[#f5f7fb] py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <SectionHeading
              title={text.model.title}
              description={
                text.model.description
              }
            />

            <div className="grid gap-6 md:grid-cols-5">
              {MODEL_CARDS.map(
                (card) => (
                  <ModelCard
                    key={card.titleKey}
                    icon={card.icon}
                    title={t(
                      card.titleKey,
                    )}
                    text={t(
                      card.textKey,
                    )}
                  />
                ),
              )}
            </div>
          </div>
        </section>

        <section className="bg-white py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <SectionHeading
              title={
                text.pillars.title
              }
              description={
                text.pillars
                  .description
              }
            />

            <div className="grid gap-10 md:grid-cols-3">
              {PILLARS.map(
                (pillar) => (
                  <PillarCard
                    key={pillar.name}
                    icon={pillar.icon}
                    title={pillar.name}
                    subtitle={t(
                      pillar.subtitleKey,
                    )}
                    text={t(
                      pillar.textKey,
                    )}
                  />
                ),
              )}
            </div>
          </div>
        </section>

        <ImageSection
          title={
            text.ecosystem.title
          }
          description={
            text.ecosystem.description
          }
          imageSrc="/images/ecosystem.png"
          imageAlt={
            text.ecosystem.imageAlt
          }
          background="gray"
        />

        <ImageSection
          title={text.journey.title}
          description={
            text.journey.description
          }
          imageSrc="/images/epew-process.png"
          imageAlt={
            text.journey.imageAlt
          }
          background="white"
        />

        <section className="bg-[#f5f7fb] py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <SectionHeading
              title={text.video.title}
              description={
                text.video.description
              }
            />

            <div className="mx-auto max-w-6xl overflow-hidden rounded-3xl shadow-2xl">
              <iframe
                className="aspect-video w-full"
                src="https://www.youtube.com/embed/ZR_L6Vx0p-U"
                title={
                  text.video.frameTitle
                }
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        </section>

        <section className="bg-[#06245c] py-24">
          <div className="mx-auto max-w-7xl px-8 text-center">
            <h2 className="mb-16 text-5xl font-bold text-white md:text-6xl">
              {text.why.title}
            </h2>

            <div className="grid gap-8 md:grid-cols-4">
              {WHY_CARDS.map(
                (card) => (
                  <WhyCard
                    key={card.titleKey}
                    title={t(
                      card.titleKey,
                    )}
                    text={t(
                      card.textKey,
                    )}
                  />
                ),
              )}
            </div>
          </div>
        </section>

        <section className="bg-green-50 py-24">
          <div className="mx-auto max-w-7xl px-8">
            <div className="rounded-3xl border-4 border-green-500 bg-white p-12 text-center shadow-2xl">
              <h2 className="mb-10 text-5xl font-extrabold text-green-900 md:text-6xl">
                {
                  text.leadership
                    .title
                }
              </h2>

              <div className="space-y-4 text-2xl font-bold text-green-950 md:text-3xl">
                {LEADERSHIP_LINES.map(
                  (key) => (
                    <p key={key}>
                      {t(key)}
                    </p>
                  ),
                )}
              </div>
            </div>
          </div>
        </section>

        <TextSection
          title={text.global.title}
          description={
            text.global.description
          }
          background="white"
        />

        <section className="bg-[#06245c] py-24 text-white">
          <div className="mx-auto max-w-6xl px-8 text-center">
            <h2 className="mb-12 text-5xl font-extrabold md:text-6xl">
              {text.promise.title}
            </h2>

            <div className="space-y-5 text-3xl font-black text-lime-300 md:text-4xl">
              {PROMISE_LINES.map(
                (key) => (
                  <p key={key}>
                    {t(key)}
                  </p>
                ),
              )}
            </div>

            <p className="mt-12 text-2xl leading-relaxed text-blue-100 md:text-3xl">
              {
                text.promise
                  .conclusion
              }
            </p>

            <div className="mt-14">
              <ApplicationButton
                isOpen={
                  countdown.isOpen
                }
                openLabel={
                  text.buttons
                    .startJourney
                }
                closedLabel={
                  text.buttons
                    .applicationsOpen
                }
                variant="green"
              />
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}

function ApplicationButton({
  isOpen,
  openLabel,
  closedLabel,
  variant,
}: {
  isOpen: boolean;
  openLabel: string;
  closedLabel: string;
  variant: "gold" | "green";
}) {
  if (isOpen) {
    const openClassName =
      variant === "gold"
        ? "w-full rounded-2xl bg-amber-400 px-10 py-5 text-xl font-extrabold text-[#06245c] transition hover:bg-amber-300 md:w-auto md:text-2xl"
        : "inline-flex rounded-2xl bg-green-600 px-12 py-5 text-2xl font-bold text-white transition hover:bg-green-700";

    return (
      <Link
        href="/entrepreneurs/enroll"
        className={openClassName}
      >
        {openLabel}
      </Link>
    );
  }

  const closedClassName =
    variant === "gold"
      ? "w-full cursor-not-allowed rounded-2xl bg-amber-400 px-10 py-5 text-xl font-extrabold text-[#06245c] opacity-90 md:w-auto md:text-2xl"
      : "cursor-not-allowed rounded-2xl bg-amber-400 px-12 py-5 text-2xl font-bold text-[#06245c]";

  return (
    <button
      type="button"
      disabled
      className={closedClassName}
    >
      {closedLabel}
    </button>
  );
}

function CountdownCard({
  value,
  label,
}: {
  value: number;
  label: string;
}) {
  return (
    <div className="rounded-2xl border border-white/30 bg-white/10 p-5 backdrop-blur-sm md:p-7">
      <p className="text-4xl font-black text-white md:text-6xl">
        {String(value).padStart(
          2,
          "0",
        )}
      </p>

      <p className="mt-2 text-sm font-extrabold uppercase tracking-widest text-lime-300 md:text-lg">
        {label}
      </p>
    </div>
  );
}

function SectionHeading({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <>
      <h2 className="mb-10 text-5xl font-extrabold md:text-6xl">
        {title}
      </h2>

      <p className="mx-auto mb-16 max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
        {description}
      </p>
    </>
  );
}

function TextSection({
  title,
  description,
  background,
}: {
  title: string;
  description: string;
  background: "white" | "gray";
}) {
  const backgroundClass =
    background === "gray"
      ? "bg-[#f5f7fb]"
      : "bg-white";

  return (
    <section
      className={`${backgroundClass} py-24`}
    >
      <div className="mx-auto max-w-7xl px-8 text-center">
        <h2 className="mb-10 text-5xl font-extrabold md:text-6xl">
          {title}
        </h2>

        <p className="mx-auto max-w-6xl text-2xl leading-relaxed text-gray-700 md:text-3xl">
          {description}
        </p>
      </div>
    </section>
  );
}

function ImageSection({
  title,
  description,
  imageSrc,
  imageAlt,
  background,
}: {
  title: string;
  description: string;
  imageSrc: string;
  imageAlt: string;
  background: "white" | "gray";
}) {
  const backgroundClass =
    background === "gray"
      ? "bg-[#f5f7fb]"
      : "bg-white";

  return (
    <section
      className={`${backgroundClass} py-24`}
    >
      <div className="mx-auto max-w-7xl px-8 text-center">
        <SectionHeading
          title={title}
          description={description}
        />

        <Image
          src={imageSrc}
          alt={imageAlt}
          width={1300}
          height={850}
          className="mx-auto rounded-3xl shadow-2xl"
        />
      </div>
    </section>
  );
}

function PreviewCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-8 text-center shadow-xl">
      <div
        className="text-6xl"
        aria-hidden="true"
      >
        {icon}
      </div>

      <h3 className="mt-5 text-3xl font-extrabold">
        {title}
      </h3>

      <p className="mt-4 text-xl leading-relaxed text-gray-700">
        {text}
      </p>
    </div>
  );
}

function ModelCard({
  icon,
  title,
  text,
}: {
  icon: string;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-6 text-center shadow-xl">
      <div
        className="mb-5 text-6xl"
        aria-hidden="true"
      >
        {icon}
      </div>

      <h3 className="mb-4 text-2xl font-extrabold">
        {title}
      </h3>

      <p className="text-lg leading-relaxed text-gray-700">
        {text}
      </p>
    </div>
  );
}

function PillarCard({
  icon,
  title,
  subtitle,
  text,
}: {
  icon: string;
  title: string;
  subtitle: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-[#f5f7fb] p-10 text-center shadow-xl">
      <div
        className="mb-6 text-7xl"
        aria-hidden="true"
      >
        {icon}
      </div>

      <h3 className="text-5xl font-extrabold">
        {title}
      </h3>

      <p className="mt-3 text-2xl font-bold text-green-700">
        {subtitle}
      </p>

      <p className="mt-6 text-2xl leading-relaxed text-gray-700">
        {text}
      </p>
    </div>
  );
}

function WhyCard({
  title,
  text,
}: {
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl">
      <h3 className="mb-6 text-3xl font-bold text-[#06245c]">
        {title}
      </h3>

      <p className="text-2xl leading-relaxed text-gray-700">
        {text}
      </p>
    </div>
  );
}