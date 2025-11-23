"use client"

import Link from "next/link"

export default function CTASection() {
  return (
    <div className="w-full relative overflow-hidden flex flex-col justify-center items-center gap-2">
      {/* Content */}
      <div className="self-stretch px-6 md:px-24 py-12 md:py-12 border-t border-b border-[rgba(255,255,255,0.1)] flex justify-center items-center gap-6 relative z-10">
        <div className="absolute inset-0 w-full h-full overflow-hidden">
          <div className="w-full h-full relative">
            {Array.from({ length: 300 }).map((_, i) => (
              <div
                key={i}
                className="absolute h-4 w-full rotate-[-45deg] origin-top-left outline outline-[0.5px] outline-[rgba(255,255,255,0.05)] outline-offset-[-0.25px]"
                style={{
                  top: `${i * 16 - 120}px`,
                  left: "-100%",
                  width: "300%",
                }}
              ></div>
            ))}
          </div>
        </div>

        <div className="w-full max-w-[586px] px-6 py-5 md:py-8 overflow-hidden rounded-lg flex flex-col justify-start items-center gap-6 relative z-20">
          <div className="self-stretch flex flex-col justify-start items-start gap-3">
            <div className="self-stretch text-center flex justify-center flex-col text-[#d9d9d9] text-3xl md:text-5xl font-semibold leading-tight md:leading-[56px] font-sans tracking-tight">
              Ready to level up your open source?
            </div>
            <div className="self-stretch text-center text-[#a0a0a0] text-base leading-7 font-sans font-medium">
              Use gitOSS to discover the right GitHub projects faster,
              <br />
              track what matters, and focus your time where it counts.
            </div>
          </div>
          <div className="w-full max-w-[497px] flex flex-col justify-center items-center gap-12">
            <div className="flex justify-start items-center gap-4">
              <Link href="/auth/signin">
                <div className="cursor-pointer h-10 sm:h-11 md:h-12 px-6 sm:px-8 md:px-10 lg:px-12 py-2 sm:py-[6px] relative bg-[#d9d9d9] shadow-[0px_0px_0px_2.5px_rgba(0,0,0,0.1)_inset] overflow-hidden rounded-full flex justify-center items-center">
                  <div className="w-20 sm:w-24 md:w-28 lg:w-44 h-[41px] absolute left-0 top-[-0.5px] bg-gradient-to-b from-[rgba(255,255,255,0)] to-[rgba(0,0,0,0.10)] mix-blend-multiply"></div>
                  <div className="flex flex-col justify-center text-[#1a1a1a] text-sm sm:text-base md:text-[15px] font-medium leading-5 font-sans">
                    Start for free
                  </div>
                </div>
              </Link>

            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
