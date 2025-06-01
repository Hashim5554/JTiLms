# News Management System

A modern news management system built with Next.js, Supabase, and Tailwind CSS. This application allows users to create, read, update, and delete news articles with real-time updates.

## Features

- Real-time news updates using Supabase subscriptions
- Modern UI with Tailwind CSS
- Responsive design
- CRUD operations for news articles
- Optimistic updates for better user experience
- Error handling and loading states

## Tech Stack

- Next.js 14
- Supabase
- Tailwind CSS
- TypeScript
- React Query

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account

## Environment Variables

Create a `.env.local` file in the root directory with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/news-management-system.git
cd news-management-system
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Project Structure

```
├── app/
│   ├── components/
│   │   ├── NewsCard.tsx
│   │   ├── NewsForm.tsx
│   │   └── NewsList.tsx
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   └── supabase.ts
├── types/
│   └── index.ts
└── public/
    └── images/
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.