# rankCentral

A modern AI-powered document ranking application built with Next.js that allows users to compare and rank documents based on customizable criteria or prompts.

## About rankCentral

rankCentral is a web application designed for the Central Provident Fund Board that enables users to:

- Upload PDF documents for comparison
- Define custom ranking criteria or use predefined rubrics
- Generate AI-powered document rankings and comparisons
- View comprehensive results with detailed justifications
- Organize documents and rankings in projects
- Export results in CSV format for further analysis

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with React 19
- **Authentication**: NextAuth.js
- **Database**: MongoDB
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Radix UI
- **Containerization**: Docker
- **Deployment**: GovTech Airbase platform
- **AI Integration**: OpenAI API
- **File Processing**: PDF-lib, JSZip

## Quick Start

### Prerequisites

- Node.js (v20 or higher)
- npm (v10 or higher)
- Docker and Docker Compose (for containerization)
- Access to GovTech Airbase platform (for deployment)
- MongoDB instance (local or remote)

### Installation

1. Clone the repository:

```bash
git clone <https://github.com/szelingtan/rankCentral-2.0.git>
cd rankCentral-2.0/rankcentral-next
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

Create a `.env` file in the root directory with the following variables:

```env
# MongoDB Connection
MONGODB_URI=mongodb://localhost:27017/rankcentral

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your_nextauth_secret

# OpenAI API Key (for AI ranking)
OPENAI_API_KEY=your_openai_api_key
```

The .env file is intentionally gitignored to prevent committing sensitive environment variables. Please maintain this configuration.

4. Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`.

## npm Commands

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint (Check for ESLint)

## Development Workflow

### Pushing Changes to GitHub

1. Create a new branch for your feature:

```bash
git checkout -b feature/your-feature-name
```

2. Make your changes and commit:

```bash
git add .
git commit -m "feat: add your feature description"
```

3. Push your changes:

```bash
git push origin feature/your-feature-name
```

4. Create a pull request for review

### Deployment to Airbase

The application uses GovTech's Airbase platform for production deployment. Use the `deploy.sh` script:

```bash
./deploy.sh
```

This script:

1. Builds the Docker image optimized for Linux/AMD64
2. Pushes the image to Docker Hub
3. Deploys to Airbase using the Airbase CLI

For a full production setup with SSL and additional configurations, use:

```bash
./prod-deploy.sh
```

This script sets up the production environment with:

- GitLab Container Registry integration
- SSL certificate handling via Let's Encrypt
- Production-specific environment variables

## Database Management

### MongoDB Setup

rankCentral uses MongoDB for data storage. The application will automatically create the required collections when first connecting to the database.

Main collections:

- `users`: User accounts and authentication information
- `projects`: Document projects with metadata (in-progress)
- `reports`: Generated ranking reports and results

## Important Notes

1. **Environment Variables**:
   `.env` - for local development (when running without Docker)
   `.env.docker` - for Docker-specific environment variables

2. **TypeScript and ESLint**: The project has some TypeScript and ESLint errors that are currently suppressed during the build process (see `next.config.ts`). Consider addressing these issues in future updates. Run `npm run lint` to see the ESLint errors.

3. **Authentication**: User authentication is handled by NextAuth.js with a custom credentials provider. Password hashing is managed with bcrypt.

4. **Airbase Integration**: The project is configured for Airbase deployment through the `.airbase/airbase.link.json` configuration file.

## Areas for Improvement

1. Implement new Project Feature: Users may categorise their reports under Projects (e.g. all internship reports for a certain team / dept can be classified under one project)
2. Improve the ranking algorithm - Think of how we can achieve greater relevance of the ranking results against what users are looking for
3. Improve user experience - Display pairwise comparisons in the application so users can view the results in the app instead of downloading the CSV files

## Project Skeleton Structure

```
rankcentral-next/
├── src/                  # Source code
│   ├── app/              # Next.js App Router pages
│   ├── components/       # Reusable UI components
│   ├── lib/              # Utilities and business logic
│   └── models/           # MongoDB schema models
├── public/               # Static assets
├── docker-compose.yml    # Docker Compose configuration
├── Dockerfile            # Docker build configuration
├── deploy.sh             # Airbase deployment script
└── prod-deploy.sh        # Production deployment script
```

### Example Mergesort Process:

**Initial Setup:**
Documents: A, B, C, D, E

**Mergesort Process:**
Step 1: Divide into pairs and single elements

Pair 1: A, B

Pair 2: C, D

Single: E

Step 2: Sort the pairs

Compare A vs B → B wins

Compare C vs D → D wins

Sorted pairs: [B, A] and [D, C], plus single element E

Step 3: Merge pairs with single element

First merge [B, A] with E:

Compare B vs E → E wins

Result: [E, B, A]

Step 4: Merge [E, B, A] with remaining pair [D, C]

Compare E vs D → E wins (E is first in final ranking)

Compare B vs D → D wins

Compare B vs C → B wins

Compare A vs C → C wins

Final Ranking: E, D, B, C, A
