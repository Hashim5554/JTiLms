# LGS JTI Learning Management System

A comprehensive Learning Management System built for LGS JTI school using React, Vite, Supabase, and Tailwind CSS. This application provides a complete digital learning environment for students, teachers, and administrators.

## Features

- **User Management**: Student, teacher, and admin roles with profile management
- **Class Management**: Create and manage classes with assignments and materials
- **Subject Management**: Organize subjects with folders and file uploads
- **Announcements**: School-wide announcements with real-time updates
- **Outstanding Achievers**: Showcase student achievements with certificates
- **File Management**: Upload and organize educational materials
- **Real-time Updates**: Live notifications and updates using Supabase
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Dark/Light Theme**: Toggle between themes for better user experience

## Tech Stack

- **Frontend**: React 18, Vite, TypeScript
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Real-time)
- **State Management**: Zustand
- **UI Components**: Custom components with modern design

## Prerequisites

- Node.js 18 or higher
- npm or yarn
- Supabase account

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Getting Started

1. Clone the repository:
```bash
git clone https://github.com/yourusername/lgs-lms.git
cd lgs-lms
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Set up your Supabase project:
   - Create a new Supabase project
   - Run the migration files in `supabase/migrations/` in order
   - Configure storage buckets and policies
   - Update environment variables

4. Run the development server:
```bash
npm run dev
# or
yarn dev
```

5. Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
├── src/
│   ├── components/          # Reusable UI components
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

## Key Features

### For Students
- View classes and assignments
- Access subject materials
- Submit assignments
- View announcements
- Track achievements

### For Teachers
- Create and manage classes
- Upload educational materials
- Create assignments
- Post announcements
- Manage student achievements

### For Administrators
- User management
- System-wide announcements
- Content moderation
- Analytics and reporting

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.