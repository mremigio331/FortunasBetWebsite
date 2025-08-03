# FortunasBets React Website

This package contains the frontend React application for FortunasBets. Built with React, Ant Design, and React Query, it provides a modern, responsive web interface for room management, user authentication, and membership workflows.

## 🏗️ Architecture Overview

- **React 18**: Modern React with hooks and functional components
- **Ant Design**: Professional UI component library
- **React Router**: Client-side routing and navigation
- **React Query**: Server state management and caching
- **AWS Cognito**: User authentication and session management
- **Webpack**: Module bundling and development server

## 📋 Prerequisites

- Node.js 18+ and npm
- Access to FortunasBets API endpoints
- AWS Cognito User Pool configured
- Modern web browser with ES6+ support

## 🚀 Getting Started

### Install Dependencies

```bash
npm install
```

### Start Development Server

```bash
npm run dev
```

The development server will:

- Start at `http://localhost:8080`
- Enable hot module replacement
- Connect to configured API endpoints
- Use Cognito for authentication

### Build for Production

```bash
npm run build
```

Creates optimized production build in `dist/` directory.

### Start Production Server

```bash
npm start
```

Builds and serves the production version.

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.js       # Main navigation bar
│   └── PageNavigationBar.js  # Side/bottom navigation
├── pages/              # Page components
│   ├── home/           # Home page
│   ├── rooms/          # Room-related pages
│   │   ├── AllRooms.js
│   │   ├── Room.js
│   │   └── CreateRoom.js
│   └── user/           # User profile pages
├── hooks/              # Custom React Query hooks
│   ├── room/           # Room management hooks
│   └── membership/     # Membership hooks
├── provider/           # React context providers
│   └── UserAuthenticationProvider.js
├── configs/            # Configuration files
│   └── cognitoConfig.js
├── constants/          # Application constants
└── utility/            # Helper functions

webpack.config.js       # Webpack configuration
package.json           # Dependencies and scripts
```

## 🎨 UI Components & Features

### Responsive Design

- **Desktop**: Full sidebar navigation with table layouts
- **Mobile**: Bottom navigation with card-based layouts
- **Breakpoint**: 768px for mobile detection

### Authentication Flow

- **Cognito Integration**: Hosted UI for login/signup
- **JWT Token Management**: Automatic refresh and storage
- **Protected Routes**: Authentication-required pages
- **Session Persistence**: Cookie-based session storage

### Navigation

- **Desktop**: Collapsible sidebar with route highlighting
- **Mobile**: Bottom tab navigation
- **Breadcrumbs**: Clear navigation hierarchy
- **Deep Linking**: Direct URL access to all pages

## 🔧 Configuration

### Environment Configuration

The app automatically detects environment based on hostname:

```javascript
// Stage detection
const getStage = () => {
  if (window.location.hostname.includes("localhost")) return "dev";
  if (window.location.hostname.includes("testing")) return "testing";
  return "prod";
};
```

### Cognito Configuration

Edit `src/configs/cognitoConfig.js`:

```javascript
const COGNITO_CONSTANTS = {
  DEV: {
    domain: "fortunasbet-testing",
    clientId: "your-client-id",
    redirectUri: "http://localhost:8080/",
    region: "us-west-2",
  },
  PROD: {
    domain: "fortunasbet-prod",
    clientId: "your-prod-client-id",
    redirectUri: "https://fortunasbet.com/",
    region: "us-west-2",
  },
};
```

### API Configuration

API endpoints are automatically configured based on environment:

- **Development**: `http://localhost:5000`
- **Testing**: `https://api.testing.fortunasbet.com`
- **Production**: `https://api.fortunasbet.com`

## 📱 Mobile Optimization

### Responsive Features

- **Bottom Navigation**: Standard mobile app pattern
- **Card Layouts**: Touch-friendly room browsing
- **Stacked Buttons**: Better mobile accessibility
- **Touch Targets**: Minimum 44px touch areas
- **Viewport Optimization**: Proper mobile scaling

### Mobile-Specific Components

```javascript
// Detect mobile
const isMobile = window.innerWidth <= 768;

// Conditional rendering
{
  isMobile ? <CardView /> : <TableView />;
}

// Mobile-optimized navigation
<PageNavigationBar />; // Automatically adapts to screen size
```

## 🔌 API Integration

### React Query Hooks

All API interactions use React Query for:

- **Caching**: Automatic data caching and invalidation
- **Background Updates**: Stale-while-revalidate pattern
- **Error Handling**: Consistent error states
- **Loading States**: Built-in loading indicators

### Authentication Headers

```javascript
// Automatic JWT inclusion
const { idToken } = useContext(UserAuthenticationContext);

const headers = {
  "Content-Type": "application/json",
  ...(idToken && { Authorization: `Bearer ${idToken}` }),
};
```

## 🧪 Development Workflow

### Development Server

```bash
# Start with hot reload
npm run dev

# Access at http://localhost:8080
# API proxy configured for development
```

### Code Formatting

```bash
# Format all files
npm run format

# Uses Prettier for consistent code style
```

### Building

```bash
# Development build
npm run build

# Production optimization
# - Code splitting
# - Tree shaking
# - Minification
# - Asset optimization
```

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**: Check API Gateway CORS configuration
2. **Authentication Loops**: Verify Cognito redirect URIs
3. **Build Failures**: Clear node_modules and reinstall
4. **Hot Reload Issues**: Restart development server

### Debugging Tools

```bash
# Check React Dev Tools
# Install: https://react-dev-tools.netlify.app/

# Check React Query Dev Tools
# Enabled in development mode automatically

# Console debugging
console.log('Auth state:', { isAuthenticated, idToken });
```

### Network Debugging

```javascript
// API call debugging
const { data, error, isLoading } = useGetAllRooms();
console.log({ data, error, isLoading });

// Network tab in browser dev tools
// Check request/response details
```

## 📦 Dependencies

### Core Dependencies

- `react`: UI library
- `react-router-dom`: Routing
- `antd`: UI components
- `@tanstack/react-query`: Server state
- `js-cookie`: Cookie management
- `jwt-decode`: JWT token parsing

### Development Dependencies

- `webpack`: Module bundler
- `webpack-dev-server`: Development server
- `babel`: JavaScript transpilation
- `prettier`: Code formatting

## 🚨 Important Notes

### Performance

- Code splitting by route
- React Query caching reduces API calls
- Ant Design tree shaking for smaller bundles
- Image optimization for faster loading

### Security

- JWT tokens stored in secure cookies
- Automatic token refresh
- Protected route validation
- XSS protection with React
