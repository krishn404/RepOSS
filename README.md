# reposs

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Vercel](https://vercel.com/button)](https://reposs.krishnx.tech/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repo-blue.svg)](https://github.com/krishn404/reposs)
[![Sponsor This](https://img.shields.io/badge/Made%20with-%E2%9D%A4-red.svg)](https://github.com/sponsors/krishn404)

**reposs** is a web application designed to help you discover, explore, and contribute to open-source GitHub repositories. It provides a user-friendly interface to search, filter, and sort repositories based on various criteria, making it easier to find projects that align with your interests and skills.

## Features

- **Search and Filter:** Easily search for repositories by name and filter them by programming language.
- **Sort Repositories:** Sort repositories by stars, forks, or recent updates to find the most relevant projects.
- **Trending Repositories:** Discover trending repositories on a daily, monthly, or yearly basis.
- **Discover Section:** Explore recently active repositories to find new and emerging projects.
- **User-Friendly Interface:** A clean and intuitive interface built with Radix UI and Tailwind CSS.

## Tech Stack

- **Framework:** [Next.js](https://nextjs.org/)
- **Styling:** [Tailwind CSS](https://tailwindcss.com/)
- **UI Components:** [Radix UI](https://www.radix-ui.com/) and [Lucide React](https://lucide.dev/)
- **Authentication:** [NextAuth]
- **GitHub Integration:** [Octokit](https://github.com/octokit/rest.js)
- **Deployment:** [Vercel](https://vercel.com/)

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
   - You will need to create a `.env.local` file in the root of the project and add the necessary environment variables for Clerk and Convex.

5. **Run the development server**
   ```sh
   pnpm dev
   ```

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
