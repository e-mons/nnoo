"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FaqSection() {
  const faqs = [
    {
      question: "What is NNOO?",
      answer: "NNOO is an AI Business Operating System designed specifically for African businesses. It helps turn everyday sales, expenses, stock, and customer activity into clear, organised business information.",
    },
    {
      question: "Who is NNOO for?",
      answer: "It is designed for market traders, pharmacies, restaurants, schools, farms, transport, and any modern small to medium business that wants to understand their performance better.",
    },
    {
      question: "Do I need accounting knowledge to use NNOO?",
      answer: "No. NNOO is built to be simple. You record what happened (e.g., 'Sold 5 items', 'Bought supplies'), and NNOO handles the organization so you can easily understand your numbers.",
    },
    {
      question: "Can NNOO help me understand sales and expenses?",
      answer: "Yes. It tracks money in and money out, providing a clear picture of your actual business performance rather than just what is in your bank account.",
    },
    {
      question: "Can NNOO help with stock?",
      answer: "Yes. You can manage your inventory, see what is running low, and understand what is moving fast so you never miss a sale.",
    },
    {
      question: "What is the Business Health Score?",
      answer: "It is a clear indicator that looks at your sales consistency, expense control, stock position, and record completeness to show how strong your business operations are.",
    },
    {
      question: "What is the Credit Passport?",
      answer: "The Credit Passport is a reliable history of your business activity over time, designed to help create a clearer business-readiness picture.",
    },
    {
      question: "Does the Credit Passport guarantee a loan?",
      answer: "No. The Credit Passport does not guarantee a loan or funding. It is a tool designed to provide a truthful, clear record of your business performance which you can use to build trust.",
    },
    {
      question: "Will NNOO work on mobile?",
      answer: "Yes. NNOO is designed to be mobile-first, ensuring you can manage your business from anywhere.",
    },
  ];

  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <section className="bg-white py-24" id="faq">
      <div className="container mx-auto px-4 md:px-8 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-5xl font-bold text-[#0A1C16] leading-tight tracking-tight mb-4">
            Frequently Asked Questions
          </h2>
          <p className="text-lg text-gray-600">
            Simple answers to help you get started.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div
              key={index}
              className={`border rounded-2xl overflow-hidden transition-colors duration-300 ${
                openIndex === index ? "border-[#143628] bg-[#F8F9F7]" : "border-gray-200 bg-white"
              }`}
            >
              <button
                className="w-full px-6 py-6 flex items-center justify-between text-left focus:outline-none"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
                aria-expanded={openIndex === index}
              >
                <span className={`font-semibold pr-8 ${openIndex === index ? "text-[#0A1C16]" : "text-gray-700"}`}>
                  {faq.question}
                </span>
                <ChevronDown
                  className={`w-5 h-5 flex-shrink-0 transition-transform duration-300 ${
                    openIndex === index ? "transform rotate-180 text-[#143628]" : "text-gray-400"
                  }`}
                />
              </button>
              <div
                className={`px-6 overflow-hidden transition-all duration-300 ease-in-out ${
                  openIndex === index ? "max-h-96 pb-6 opacity-100" : "max-h-0 opacity-0"
                }`}
              >
                <p className="text-gray-600 leading-relaxed">
                  {faq.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
