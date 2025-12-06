import { Button } from "@/components/ui/button"
import Link from "next/link"

export function Header() {
  return (
    <header className="w-full border-b border-[#37322f]/6 bg-[#f7f5f3]">
      <div className="max-w-[1060px] mx-auto px-4">
        <nav className="flex items-center justify-between py-4">
          <div className="flex items-center space-x-8">
            <div className="text-[#37322f] font-semibold text-lg">reposs</div>
            
          </div>
          <Link href="/auth/signin">
          <div className="cursor-pointer px-2 sm:px-3 md:px-[14px] py-1 sm:py-[6px] bg-white shadow-[0px_1px_2px_rgba(55,50,47,0.12)] overflow-hidden rounded-full flex justify-center items-center">
            <div className="text-[#37322F] text-xs md:text-[13px] font-medium leading-5 font-sans">
              Log in
            </div>
          </div>
        </Link>

        </nav>
      </div>
    </header>
  )
}
