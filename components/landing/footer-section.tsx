export default function FooterSection() {
  return (
    <div className="w-full pt-10 flex flex-col items-stretch">
      <div className="w-full flex flex-col md:flex-row justify-between items-center px-4 py-6 gap-6">

        {/* Left: Socials */}
        <div className="flex items-center gap-4">
          <a className="w-6 h-6 flex items-center justify-center cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#d9d9d9">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>

          <a className="w-6 h-6 flex items-center justify-center cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#d9d9d9">
              <path d="M20.5 2h-17A1.5 1.5 0 002 3.5v17A1.5 1.5 0 003.5 22h17a1.5 1.5 0 001.5-1.5v-17A1.5 1.5 0 0020.5 2zM8 19H5v-9h3zM6.5 8.25A1.75 1.75 0 118.3 6.5a1.78 1.78 0 01-1.8 1.75zM19 19h-3v-4.74c0-1.42-.6-1.93-1.38-1.93A1.74 1.74 0 0013 14.19v.14V19h-3v-9h2.9v1.3a3.11 3.11 0 012.7-1.4c1.55 0 3.36.86 3.36 3.66z" />
            </svg>
          </a>

          <a className="w-6 h-6 flex items-center justify-center cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="#d9d9d9">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.8 8.21 11.39.6.11.79-.26.79-.58v-2.23c-3.34.73-4.03-1.42-4.03-1.42-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.49.99.11-.78.42-1.31.76-1.61C7.96 17 5.16 15.97 5.16 11.37c0-1.31.47-2.38 1.24-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23.98-.27 2-.4 3.02-.4s2.04.14 3 .4c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.77.84 1.24 1.91 1.24 3.22 0 4.61-2.81 5.62-5.48 5.92.43.37.82 1.1.82 2.22v3.29c0 .32.19.69.8.58C20.56 21.8 24 17.3 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
          </a>
        </div>

        {/* Center: Brand */}
        <div className="text-[#d9d9d9] text-lg font-semibold font-sans">
          reposs
        </div>

        {/* Right: Credit */}
        <a
          href="https://github.com/krishn404/reposs"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[#d9d9d9] text-sm font-medium font-sans hover:text-[#a0a0a0] transition-colors"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="#d9d9d9"
          >
            <path d="M12 .587l3.668 7.568 8.332 1.151-6.064 5.634 1.48 8.06L12 18.897l-7.416 4.103 1.48-8.06L0 9.306l8.332-1.151z" />
          </svg>
          Star us
        </a>

      </div>

      <div className="w-full border-t border-[rgba(255,255,255,0.1)]" />
    </div>
  )
}
