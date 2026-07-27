export type AboutCardDefinition = {
  icon: string;
  titleKey: string;
  textKey: string;
};

export type AboutStepDefinition = {
  number: string;
  titleKey: string;
  textKey: string;
};

export type AboutLinkDefinition = {
  href: string;
  labelKey: string;
};

export const WHO_WE_ARE_CARDS: AboutCardDefinition[] = [
  {
    icon: "📘",
    titleKey: "about.whoWeAre.cards.education.title",
    textKey: "about.whoWeAre.cards.education.text",
  },
  {
    icon: "🤝",
    titleKey: "about.whoWeAre.cards.coaching.title",
    textKey: "about.whoWeAre.cards.coaching.text",
  },
  {
    icon: "🏗️",
    titleKey: "about.whoWeAre.cards.development.title",
    textKey: "about.whoWeAre.cards.development.text",
  },
  {
    icon: "🧭",
    titleKey: "about.whoWeAre.cards.guidance.title",
    textKey: "about.whoWeAre.cards.guidance.text",
  },
  {
    icon: "🌍",
    titleKey: "about.whoWeAre.cards.community.title",
    textKey: "about.whoWeAre.cards.community.text",
  },
];

export const WHAT_WE_DO_CARDS: AboutCardDefinition[] = [
  {
    icon: "💡",
    titleKey: "about.whatWeDo.cards.entrepreneurs.title",
    textKey: "about.whatWeDo.cards.entrepreneurs.text",
  },
  {
    icon: "🎓",
    titleKey: "about.whatWeDo.cards.coaches.title",
    textKey: "about.whatWeDo.cards.coaches.text",
  },
  {
    icon: "🤲",
    titleKey: "about.whatWeDo.cards.supporters.title",
    textKey: "about.whatWeDo.cards.supporters.text",
  },
  {
    icon: "🧰",
    titleKey: "about.whatWeDo.cards.partners.title",
    textKey: "about.whatWeDo.cards.partners.text",
  },
];

export const APPROACH_STEPS: AboutStepDefinition[] = [
  {
    number: "01",
    titleKey: "about.approach.steps.qualification.title",
    textKey: "about.approach.steps.qualification.text",
  },
  {
    number: "02",
    titleKey: "about.approach.steps.coaching.title",
    textKey: "about.approach.steps.coaching.text",
  },
  {
    number: "03",
    titleKey: "about.approach.steps.structure.title",
    textKey: "about.approach.steps.structure.text",
  },
  {
    number: "04",
    titleKey: "about.approach.steps.campaign.title",
    textKey: "about.approach.steps.campaign.text",
  },
  {
    number: "05",
    titleKey: "about.approach.steps.funding.title",
    textKey: "about.approach.steps.funding.text",
  },
  {
    number: "06",
    titleKey: "about.approach.steps.launch.title",
    textKey: "about.approach.steps.launch.text",
  },
];

export const MODEL_CARDS: AboutCardDefinition[] = [
  {
    icon: "🤝",
    titleKey: "about.model.cards.participation.title",
    textKey: "about.model.cards.participation.text",
  },
  {
    icon: "🌱",
    titleKey: "about.model.cards.sustainability.title",
    textKey: "about.model.cards.sustainability.text",
  },
];

export const VALUE_CARDS: AboutCardDefinition[] = [
  {
    icon: "🤝",
    titleKey: "about.values.cards.collaboration.title",
    textKey: "about.values.cards.collaboration.text",
  },
  {
    icon: "📊",
    titleKey: "about.values.cards.accountability.title",
    textKey: "about.values.cards.accountability.text",
  },
  {
    icon: "🌱",
    titleKey: "about.values.cards.sustainability.title",
    textKey: "about.values.cards.sustainability.text",
  },
  {
    icon: "🧭",
    titleKey: "about.values.cards.integrity.title",
    textKey: "about.values.cards.integrity.text",
  },
  {
    icon: "🚀",
    titleKey: "about.values.cards.empowerment.title",
    textKey: "about.values.cards.empowerment.text",
  },
  {
    icon: "🌍",
    titleKey: "about.values.cards.impact.title",
    textKey: "about.values.cards.impact.text",
  },
];

export const JOIN_LINKS: AboutLinkDefinition[] = [
  {
    href: "/entrepreneur",
    labelKey: "about.join.buttons.entrepreneur",
  },
  {
    href: "/supporter",
    labelKey: "about.join.buttons.supporter",
  },
  {
    href: "/partner",
    labelKey: "about.join.buttons.partner",
  },
];