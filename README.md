# CodeAlpha Project Management Tool

## 🚀 Project Overview

A **collaborative project management tool** built as part of the CodeAlpha internship program. This full-stack application provides real-time project management capabilities with a modern Kanban board interface, user authentication, and team collaboration features.

## ✨ Features

### 🔐 Authentication & User Management
- User registration and login with JWT tokens
- Secure password hashing with bcrypt
- Protected routes and middleware

### 📋 Project Management
- Create and manage multiple projects
- Project descriptions and member management
- Real-time project statistics and progress tracking

### 📝 Task Management
- Kanban board with drag-and-drop functionality
- Task creation with priorities (Low, Medium, High)
- Due date assignment and status tracking
- Three columns: To Do, In Progress, Done

### 💬 Real-time Collaboration
- Live updates via Socket.io
- Team member notifications
- Real-time task status changes
- Comment system for tasks

### 🎨 Modern UI/UX
- Responsive design with Tailwind CSS
- Clean and intuitive interface
- Mobile-friendly layout
- Accessibility features (ARIA labels, keyboard navigation)

## 🛠️ Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for fast development and building
- **Tailwind CSS** for styling
- **React Router DOM** for navigation
- **Socket.io-client** for real-time communication
- **React Hook Form** for form handling
- **Lucide React** for icons
- **Date-fns** for date manipulation

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **MongoDB** with Mongoose ODM
- **Socket.io** for real-time features
- **JWT** for authentication
- **bcryptjs** for password hashing
- **Express Validator** for input validation

### Development Tools
- **ESLint** for code quality
- **Nodemon** for server auto-reload
- **ts-node** for TypeScript execution

## 📁 Project Structure

```
project-management-tool/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── contexts/      # React contexts (Auth, Socket)
│   │   ├── pages/         # Application pages
│   │   └── main.tsx       # Application entry point
│   ├── package.json
│   └── vite.config.ts
├── server/                 # Backend Node.js application
│   ├── src/
│   │   ├── models/        # MongoDB schemas
│   │   ├── routes/        # API endpoints
│   │   ├── middleware/    # Authentication middleware
│   │   ├── socket/        # Socket.io handlers
│   │   └── index.ts       # Server entry point
│   ├── package.json
│   └── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (v5 or higher)
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/ibrahim-warsame/CodeAlpha_ProjectManagementTool.git
   cd CodeAlpha_ProjectManagementTool
   ```

2. **Install dependencies**
   ```bash
   # Install backend dependencies
   cd server
   npm install
   
   # Install frontend dependencies
   cd ../client
   npm install
   ```

3. **Environment Setup**
   ```bash
   # In the server directory, copy env.example to .env
   cd ../server
   cp env.example .env
   ```
   
   Edit `.env` file:
   ```env
   PORT=5000
   MONGODB_URI=mongodb://localhost:27017/project-manager
   JWT_SECRET=your-super-secret-jwt-key-here
   NODE_ENV=development
   ```

4. **Start MongoDB**
   ```bash
   # Start MongoDB service
   mongod --dbpath "C:\data\db"
   ```

5. **Run the application**
   ```bash
   # Terminal 1: Start backend server
   cd server
   npm run dev
   
   # Terminal 2: Start frontend client
   cd client
   npm run dev
   ```

6. **Access the application**
   - Frontend: http://localhost:3000
   - Backend API: http://localhost:5000

## 📱 Usage

### 1. User Registration
- Navigate to the registration page
- Create a new account with email and password
- Automatically logged in after successful registration

### 2. Project Creation
- Click "New Project" button on dashboard
- Enter project name and description
- Project is created with default Kanban board

### 3. Task Management
- Click "Add Task" on any project board
- Fill in task details (title, description, priority, due date)
- Drag and drop tasks between columns
- Real-time updates for all team members

### 4. Team Collaboration
- Invite team members to projects
- Real-time notifications for task changes
- Comment system for task discussions

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Projects
- `GET /api/projects` - Get user's projects
- `POST /api/projects` - Create new project
- `GET /api/projects/:id` - Get project details
- `PUT /api/projects/:id` - Update project
- `DELETE /api/projects/:id` - Delete project

### Tasks
- `GET /api/tasks` - Get project tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Comments
- `GET /api/comments` - Get task comments
- `POST /api/comments` - Add comment
- `DELETE /api/comments/:id` - Delete comment

## 🌟 Key Features Implemented

### CodeAlpha Internship Requirements
- ✅ **Full-stack development** with modern technologies
- ✅ **Real-time functionality** using Socket.io
- ✅ **Database integration** with MongoDB
- ✅ **User authentication** and authorization
- ✅ **Responsive design** with modern UI/UX
- ✅ **TypeScript** for type safety
- ✅ **Clean code architecture** with proper separation of concerns
- ✅ **API documentation** and endpoint structure
- ✅ **Error handling** and validation
- ✅ **Real-time collaboration** features

## 🚀 Deployment

### Frontend (Vercel/Netlify)
```bash
cd client
npm run build
# Deploy the dist folder to your preferred hosting service
```

### Backend (Railway/Render)
```bash
cd server
npm run build
# Deploy the dist folder to your preferred hosting service
```

### Database (MongoDB Atlas)
- Create a free MongoDB Atlas cluster
- Update the MONGODB_URI in your environment variables

## 🤝 Contributing

This project was developed as part of the CodeAlpha internship program. For any questions or contributions, please contact the project maintainer.

## 📄 License

This project is part of the CodeAlpha internship program.

## 👨‍💻 Developer

**Ibrahim Warsame**
- CodeAlpha Intern
- Full-stack Developer
- [GitHub Profile](https://github.com/ibrahim-warsame)

## 🙏 Acknowledgments

- **CodeAlpha** for providing this internship opportunity
- **MongoDB** for the database solution
- **Socket.io** for real-time communication
- **Tailwind CSS** for the beautiful UI framework
- **React** team for the amazing frontend library

---

**Built with ❤️ for CodeAlpha Internship Program**
