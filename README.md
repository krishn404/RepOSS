# reposs

![reposs - Discover Open Source](https://reposs.xyz/og-image.jpg)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vercel](https://vercel.com/button)](https://reposs.xyz/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-blue.svg)](https://github.com/krishn404/reposs)
[![Sponsor This](https://img.shields.io/badge/Made%20with-%E2%9D%A4-red.svg)](https://github.com/sponsors/krishn404)

**reposs** makes open source discovery easy and quick. It's a modern web application that helps developers, students, and teams discover, explore, and track open-source GitHub repositories. Built with a focus on clarity and speed, reposs layers powerful search, filters, and curated views on top of GitHub's data so you can find projects that match your interests and skills.

## Features

### Core Functionality

- **🔍 Advanced Search & Filtering:** Search repositories by name, filter by programming language (JavaScript, Python, TypeScript, Go, Rust, Java, C++, PHP, and more), and set minimum star thresholds
- **📊 Multiple Views:**
  - **Home:** Clean starting point for filtered search and exploration
  - **Trending:** Discover fast-growing repositories over different time ranges (daily, monthly, yearly)
  - **Staff Picked:** Curated selection of high-quality repositories handpicked by the team
  - **Discover:** Explore recently active repositories to find maintainers who are still engaged
- **⭐ Smart Sorting:** Sort repositories by stars, forks, or recent activity to find the most relevant projects
- **🔖 Bookmarks:** Save repositories for later. Works seamlessly for both guest users (local storage) and authenticated users (cloud sync)
- **👥 Authentication:** Optional GitHub authentication unlocks personalized experiences and cloud bookmark sync

### Admin Features

- **🛡️ Admin Panel:** Manage staff picks with custom badges and notes
- **🏷️ Badge System:** Categorize staff picks with predefined badges (Startup, Bug Bounty, GSSoC, AI, DevTools) or custom labels
- **📈 Analytics Dashboard:** Track staff picks, badges, and repository statistics

### User Experience

- **🎨 Modern UI:** Clean, intuitive interface built with Radix UI and Tailwind CSS
- **🌙 Dark Theme:** Beautiful dark theme optimized for extended browsing sessions
- **⚡ Fast Performance:** Optimized queries and caching for quick repository discovery
- **📱 Responsive Design:** Works seamlessly across desktop, tablet, and mobile devices

## Tech Stack

### Frontend
- **Framework:** [Next.js 15](https://nextjs.org/) with App Router
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) and [Lucide React](https://lucide.dev/)
- **Animations:** [Framer Motion](https://www.framer.com/motion/)
- **3D Graphics:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction) & [Three.js](https://threejs.org/)

### Backend & Data
- **Database:** [Convex](https://www.convex.dev/) for real-time data and bookmarks
- **Authentication:** [NextAuth.js](https://next-auth.js.org/) with GitHub OAuth
- **GitHub Integration:** [Octokit](https://github.com/octokit/rest.js) with retry and throttling plugins
- **Caching:** Built-in caching layer for repository data

### Deployment & Analytics
- **Hosting:** [Vercel](https://vercel.com/)
- **Analytics:** [Vercel Analytics](https://vercel.com/analytics)

## Getting Started

To get a local copy up and running, follow these simple steps.

### Prerequisites

- [Node.js](https://nodejs.org/en/) (version 18 or higher)
- [pnpm](https://pnpm.io/installation)

### Installation

1. **Clone the repo**
   ```sh
   git clone https://github.com/krishn404/reposs.git
   ```
2. **Navigate to the project directory**
   ```sh
   cd reposs
   ```
3. **Install dependencies**
   ```sh
   pnpm install
   ```
4. **Set up environment variables**
   
   Create a `.env.local` file in the root of the project with the following variables:
   
   ```env
   # NextAuth.js
   NEXTAUTH_URL=http://localhost:3000
   NEXTAUTH_SECRET=your-nextauth-secret-here
   
   # GitHub OAuth (for authentication)
   GITHUB_CLIENT_ID=your-github-client-id
   GITHUB_CLIENT_SECRET=your-github-client-secret
   
   # Convex (for database and bookmarks)
   CONVEX_DEPLOYMENT=your-convex-deployment-url
   NEXT_PUBLIC_CONVEX_URL=your-convex-url
   
   # Optional: Google Analytics
   NEXT_PUBLIC_GOOGLE_TAG_ID=your-ga-id
   ```
   
   You'll need to:
   - Create a GitHub OAuth App at [GitHub Developer Settings](https://github.com/settings/developers)
   - Set up a Convex project at [convex.dev](https://www.convex.dev/)
   - Generate a NextAuth secret (you can use `openssl rand -base64 32`)

5. **Run the development server**
   ```sh
   pnpm dev
   ```

## What's Next

I'm currently focusing on:

- **🔍 Enhanced Search:** Improved search algorithms and better relevance ranking
- **📊 Contribution Insights:** Track your contributions and get personalized recommendations
- **💾 Saved Views:** Save and share custom filter combinations for quick access
- **🔔 Notifications:** Get notified when bookmarked repositories have new releases or activity
- **📈 Repository Analytics:** Deeper insights into repository health, activity trends, and contributor patterns
- **🌐 Social Features:** Share discoveries and collaborate with teams
- **⚡ Performance:** Further optimizations for faster load times and smoother interactions

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".

Don't forget to give the project a star! Thanks again!

1. **Fork the Project**
2. **Create your Feature Branch** (`git checkout -b feature/AmazingFeature`)
3. **Commit your Changes** (`git commit -m 'Add some AmazingFeature'`)
4. **Push to the Branch** (`git push origin feature/AmazingFeature`)
5. **Open a Pull Request**

## License

Distributed under the MIT License. See `LICENSE` for more information.
