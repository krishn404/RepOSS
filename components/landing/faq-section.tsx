"use client"

import { useState } from "react"

interface FAQItem {
  question: string
  answer: string
}

const faqData: FAQItem[] = [
  {
    question: "What is reposs and who is it for?",
    answer:
      "reposs is a web app that helps you discover, explore, and track open source GitHub repositories. It’s built for developers, students, and teams who want a faster way to find projects that match their interests and skills.",
  },
  {
    question: "Where does reposs get its data from?",
    answer:
      "All repository data comes directly from the GitHub API via Octokit. reposs layers search, filters, and curated views on top of GitHub so you always see live stars, forks, activity, and metadata.",
  },
  {
    question: "What can I do with the Trending, Home, and Discover views?",
    answer:
      "Trending shows fast-growing repos over different time ranges, Home gives you a clean starting point for filtered search, and Discover highlights recently active projects so you can find maintainers who are still engaged.",
  },
  {
    question: "Is reposs free to use?",
    answer:
      "Yes. Today reposs is free to use while we iterate on the product. In the future we may add optional pro features for heavy contributors and teams, but searching and browsing open source projects will remain free.",
  },
  {
    question: "Do I need a GitHub account or extra setup?",
    answer:
      "You can browse public repositories without logging in. Connecting your GitHub account unlocks more personalized experiences and will power upcoming features like saved views and contribution insights.",
  },
  {
    question: "How do I get started with reposs?",
    answer:
      "Open the app, choose a view (Home, Trending, or Discover), apply a few filters like language or stars, and start exploring. When you find something you like, click through to GitHub to star, fork, or open your first issue.",
  },
]

function ChevronDownIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<number[]>([])

  const toggleItem = (index: number) => {
    setOpenItems((prev) => (prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]))
  }

  return (
    <div className="w-full flex justify-center items-start">
      <div className="flex-1 px-4 md:px-12 py-16 md:py-20 flex flex-col lg:flex-row justify-start items-start gap-6 lg:gap-12">
        {/* Left Column - Header */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-start gap-4 lg:py-5">
          <div className="w-full flex flex-col justify-center text-[#d9d9d9] font-semibold leading-tight md:leading-[44px] font-sans text-4xl tracking-tight">
            Frequently Asked Questions
          </div>
          <div className="w-full text-[#a0a0a0] text-base font-normal leading-7 font-sans">
            Discover new projects, track what’s trending,
            <br className="hidden md:block" />
            and find your next contribution with less guesswork.
          </div>
        </div>

        {/* Right Column - FAQ Items */}
        <div className="w-full lg:flex-1 flex flex-col justify-center items-center">
          <div className="w-full flex flex-col">
            {faqData.map((item, index) => {
              const isOpen = openItems.includes(index)

              return (
                <div key={index} className="w-full border-b border-[rgba(255,255,255,0.1)] overflow-hidden">
                  <button
                    onClick={() => toggleItem(index)}
                    className="w-full px-5 py-[18px] flex justify-between items-center gap-5 text-left hover:bg-[rgba(255,255,255,0.05)] transition-colors duration-200"
                    aria-expanded={isOpen}
                  >
                    <div className="flex-1 text-[#d9d9d9] text-base font-medium leading-6 font-sans">
                      {item.question}
                    </div>
                    <div className="flex justify-center items-center">
                      <ChevronDownIcon
                        className={`w-6 h-6 text-[#a0a0a0] transition-transform duration-300 ease-in-out ${isOpen ? "rotate-180" : "rotate-0"
                          }`}
                      />
                    </div>
                  </button>

                  <div
                    className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
                      }`}
                  >
                    <div className="px-5 pb-[18px] text-[#a0a0a0] text-sm font-normal leading-6 font-sans">
                      {item.answer}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
