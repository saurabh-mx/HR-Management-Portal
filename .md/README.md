# HR Management Portal

The **HR Management Portal** is a comprehensive, modern, and scalable application designed to manage personnel, handle HR requests, coordinate meetings, and enforce disciplinary actions (strikes). It serves as a central hub for administrators, High Command, and regular personnel.

## Features

- **Role-Based Access Control (RBAC)**: Secure routes and UI components restricted by user roles (e.g., Admin, High Command, HR, Employee).
- **Personnel Directory**: View and search all active personnel.
- **Leave of Absence (LOA) Management**: Submit and review LOA requests.
- **Disciplinary System**: Manage and track strikes against personnel.
- **Rank Management**: Handle promotions, demotions, and department transfers.
- **Meetings & Communications**: Schedule meetings and post global announcements.
- **Audit Logs**: Track sensitive administrative actions for accountability.

## Tech Stack

- **Frontend Framework**: React 18 with Vite
- **Language**: TypeScript
- **Styling**: Tailwind CSS & `shadcn/ui` components
- **Routing**: React Router v6
- **Database & Authentication**: Supabase
- **Icons**: Lucide React

## Setup Instructions

1. **Clone the repository** and install dependencies:
   ```bash
   npm install
   ```

2. **Environment Variables**: Create a `.env` file in the root directory and add your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```

## Folder Structure

Please see [ARCHITECTURE.md](./ARCHITECTURE.md) for a detailed breakdown of the project's Feature-Sliced Architecture.
