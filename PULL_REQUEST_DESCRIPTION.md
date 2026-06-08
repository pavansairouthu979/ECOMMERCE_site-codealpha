This Pull Request merges the frontend scaffold from the add-frontend-structure branch into the repository's default branch (main). The frontend files include Vite + React setup, Tailwind CSS, Redux store, placeholder components, and pages. No backend changes were made in this PR.

How to test:
1. Checkout the main branch locally: git checkout main
2. Pull latest changes: git pull origin main
3. Install dependencies: npm install
4. Start dev server: npm run dev

Notes:
- Environment variables: copy .env.example to .env and set VITE_API_BASE_URL
- Files were added on add-frontend-structure branch. This PR merges them into main.
