import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const faqs = [
  {
    question: "What is Strava Round Up?",
    answer:
      "Strava Round Up creates a polished snapshot of your recent Strava activities so you can stay motivated or share your highlights.",
  },
  {
    question: "How do I connect my Strava account?",
    answer:
      "From the landing page, click the Connect with Strava button and grant permissions. We will handle the rest and take you to your personalized dashboard.",
  },
  {
    question: "Is my data safe?",
    answer:
      "We use a read-only OAuth connection to Strava, which means we never change your workouts and only pull the data needed to generate your roundup.",
  },
  {
    question: "Who can I contact for support?",
    answer:
      "If you run into issues, send us a note at support@stravaroundup.com with a brief description and screenshots so we can help quickly.",
  },
];

export default function Help() {
  return (
    <main className="min-h-screen bg-gray-50">
      <section className="py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <header className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Help Center</h1>
            <p className="text-lg text-gray-600">
              Browse common questions or reach out if you need a hand getting started.
            </p>
          </header>

          <div className="grid gap-6 md:grid-cols-2">
            {faqs.map((faq) => (
              <Card key={faq.question} className="border border-gray-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-xl text-gray-900">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent className="text-gray-600 leading-relaxed">{faq.answer}</CardContent>
              </Card>
            ))}
          </div>

          <div className="mt-16 text-center">
            <Link to="/" className="text-orange-500 hover:text-orange-600 underline">
              Return to the landing page
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
