import type { Metadata } from "next";
import BrutalReminderClient from "./BrutalReminderClient";

export const metadata: Metadata = {
  title: "Brutal Reminder — Daily Accountability Emails",
  description:
    "Turn one big goal into one small daily action. Brutal Reminder sends privacy-first accountability emails that ask if you actually did it.",
  alternates: {
    canonical: "/brutal-reminder",
  },
  openGraph: {
    title: "Brutal Reminder",
    description: "Set your goal. Take the small step. No excuses.",
    url: "/brutal-reminder",
    type: "website",
  },
  icons: {
    icon: "/symbol%20mark%202.png",
    apple: "/symbol%20mark%202.png",
  },
};

export default function BrutalReminderPage() {
  return <BrutalReminderClient />;
}
