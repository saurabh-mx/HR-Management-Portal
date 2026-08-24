import { ShieldCheck, Scale, Crosshair } from "lucide-react";

export const landingData = {
  hero: {
    titleTop: "San Andreas",
    titleBottom: "State Police",
    subtitle: "Upholding Law. Preserving Order. Protecting the Community.",
    btnPrimary: "Join the Force",
    btnSecondary: "Community Resources"
  },
  intro: {
    quote: "“To protect and to serve!”",
    description: "Welcome to the official portal of the San Andreas State Police (SASP). We give the utmost importance to law and order, standing as the frontline of defense across the state. Our commitment is unwavering, and our mission is clear:"
  },
  about: {
    label: "Our Mission",
    title: "Our Prime Objective",
    description: "Every individual in the SASP department works towards one unified goal: to provide elite, professional Law Enforcement to the entire community within our jurisdiction. We believe that justice, integrity, and rapid response are the cornerstones of a safe society.",
    features: [
      {
        icon: Scale,
        title: "Statewide Jurisdiction",
        description: "From city streets to county highways, our troopers are equipped to handle complex emergencies and maintain peace across all of San Andreas.",
        theme: "blue"
      },
      {
        icon: ShieldCheck,
        title: "Unwavering Integrity",
        description: "We hold our officers to the highest ethical standards, ensuring transparent and fair treatment for all citizens we are sworn to protect.",
        theme: "emerald"
      },
      {
        icon: Crosshair,
        title: "Tactical Excellence",
        description: "Highly trained units stand ready to intercept and investigate criminal activity to keep our streets safe from advanced threats.",
        theme: "brand"
      }
    ]
  },
  community: {
    label: "Community Outreach",
    title: "Beyond the Badge: Community First",
    paragraphs: [
      "Law enforcement is only one side of the coin; prevention is the other. Alternatively, we don't just react to crime—we actively work to stop it before it starts.",
      "The SASP regularly organizes awareness programs and law/order campaigns designed to keep the city out of future crimes. By engaging directly with the citizens we protect, we build the mutual trust and education necessary for a thriving, secure community."
    ]
  },
  recruitment: {
    title: "Step Up. Stand Out. Join SASP.",
    description: "Are you ready to make a difference? We are looking for dedicated individuals with a strong moral compass and a drive for public service. As a State Police Trooper, you will receive rigorous training, dynamic career advancement opportunities, and the chance to serve on the frontlines of justice.",
    link: "https://saspftd.web.app/",
    btnText: "Apply to the Academy"
  }
};
