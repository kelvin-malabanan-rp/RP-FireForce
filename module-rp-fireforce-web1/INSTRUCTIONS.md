# FireForce Web Application

A modern React web application built with Vite, TailwindCSS, shadcn/ui, and Framer Motion for animations. This project provides a solid foundation for building scalable web applications with a clean architecture and developer-friendly setup.

## 🚀 Tech Stack

- **React 18** - Modern React with hooks and concurrent features
- **Vite** - Lightning-fast build tool and development server
- **TypeScript** - Type-safe JavaScript with excellent IDE support
- **TailwindCSS** - Utility-first CSS framework for rapid UI development
- **shadcn/ui** - High-quality, accessible component library
- **Framer Motion** - Production-ready motion library for React
- **Axios** - Promise-based HTTP client for API requests
- **Lucide React** - Beautiful, customizable icons

## 📁 Project Structure

```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── animations/      # Animation components and variants
│   ├── layout/          # Layout components
│   ├── LoginForm.tsx    # Authentication forms
│   └── LoadingState.tsx # Loading and error states
├── pages/               # Page components
│   └── HomePage.tsx     # Landing page
├── hooks/               # Custom React hooks
│   ├── useApi.ts        # API request hook
│   ├── useStorage.ts    # localStorage/sessionStorage hooks
│   └── useUtils.ts      # Utility hooks
├── services/            # API service layer
│   ├── apiService.ts    # Base API service with interceptors
│   └── index.ts         # Specific API endpoints
├── utils/               # Utility functions
│   └── index.ts         # Common helper functions
├── types/               # TypeScript type definitions
│   └── index.ts         # Shared types and interfaces
├── context/             # React context providers
└── lib/                 # External library configurations
```

## 🛠 Setup Instructions

### Prerequisites

- Node.js (version 18 or higher)
- npm or yarn package manager

### Installation

1. **Clone and navigate to the project:**
   ```bash
   cd your-project-directory
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up environment variables:**
   ```bash
   cp .env.example .env
   ```
   
   Edit the `.env` file with your configuration:
   ```env
   VITE_API_BASE_URL=http://localhost:3000/api
   VITE_APP_TITLE=Your App Name
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

   The application will be available at `http://localhost:5173`

### Building for Production

```bash
npm run build
```

## 🔧 API Service Usage

The project includes a centralized API service layer that handles all HTTP requests with proper error handling and authentication.

### Basic Usage

```jsx
import { services } from '@/services';

// Using the API service in a component
function UserProfile() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await services.user.getUserById('123');
        setUser(response.data);
      } catch (error) {
        console.error('Failed to fetch user:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  if (loading) return <LoadingSpinner />;
  
  return <div>{user?.name}</div>;
}
```

### Using the useApi Hook

```jsx
import { useApi } from '@/hooks/useApi';
import { services } from '@/services';

function UserList() {
  const { data: users, loading, error, refetch } = useApi(
    () => services.user.getUsers(),
    {
      onSuccess: (data) => console.log('Users loaded:', data),
      onError: (error) => console.error('Failed to load users:', error)
    }
  );

  if (loading) return <LoadingState loading={true} />;
  if (error) return <LoadingState loading={false} error={error.message} />;

  return (
    <LoadingState loading={loading} error={error?.message}>
      <div>
        {users?.map(user => (
          <div key={user.id}>{user.name}</div>
        ))}
        <button onClick={refetch}>Refresh</button>
      </div>
    </LoadingState>
  );
}
```

### Authentication

The API service automatically handles authentication tokens:

```jsx
import { authService } from '@/services';

// Login
const handleLogin = async (credentials) => {
  try {
    const response = await authService.login(credentials);
    // Token is automatically stored and added to future requests
    console.log('Logged in:', response.data.user);
  } catch (error) {
    console.error('Login failed:', error.message);
  }
};

// Logout
const handleLogout = async () => {
  await authService.logout();
  // Token is automatically removed
};
```

## 🎨 Component Usage

### Animation Components

```jsx
import { AnimatedContainer, StaggeredContainer, fadeInUp } from '@/components/animations/variants';

function MyPage() {
  return (
    <StaggeredContainer>
      <AnimatedContainer variant={fadeInUp}>
        <h1>Animated Title</h1>
      </AnimatedContainer>
      <AnimatedContainer variant={fadeInUp} delay={0.1}>
        <p>Animated paragraph with delay</p>
      </AnimatedContainer>
    </StaggeredContainer>
  );
}
```

### Page Transitions

```jsx
import { PageTransition } from '@/components/animations/PageTransition';

function MyPage() {
  return (
    <PageTransition>
      <div>Your page content</div>
    </PageTransition>
  );
}
```

### Loading States

```jsx
import { LoadingState, LoadingSpinner } from '@/components/LoadingState';

function DataComponent() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  return (
    <LoadingState
      loading={loading}
      error={error}
      loadingComponent={<LoadingSpinner size="lg" />}
    >
      <div>{/* Your data content */}</div>
    </LoadingState>
  );
}
```

## 🎯 Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint (if configured)

## 🚀 Adding New Features

### Adding a New Page

1. Create a new component in `src/pages/`:
   ```jsx
   // src/pages/AboutPage.tsx
   import { PageTransition } from '@/components/animations/PageTransition';
   
   export function AboutPage() {
     return (
       <PageTransition>
         <div>
           <h1>About Us</h1>
           <p>Your content here</p>
         </div>
       </PageTransition>
     );
   }
   ```

2. Add routing (if using React Router):
   ```jsx
   // In your router configuration
   import { AboutPage } from '@/pages/AboutPage';
   ```

### Adding New API Endpoints

1. Define types in `src/types/index.ts`:
   ```typescript
   export interface Product {
     id: string;
     name: string;
     price: number;
   }
   ```

2. Add service methods in `src/services/index.ts`:
   ```typescript
   export const productService = {
     getProducts: () => apiService.get<Product[]>('/products'),
     getProduct: (id: string) => apiService.get<Product>(`/products/${id}`),
     createProduct: (data: CreateProductData) => apiService.post<Product>('/products', data),
   };
   ```

### Adding New Components

1. Create component in appropriate folder:
   ```jsx
   // src/components/ProductCard.tsx
   import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
   import { Button } from './ui/button';
   
   interface ProductCardProps {
     product: Product;
     onAddToCart: (product: Product) => void;
   }
   
   export function ProductCard({ product, onAddToCart }: ProductCardProps) {
     return (
       <Card>
         <CardHeader>
           <CardTitle>{product.name}</CardTitle>
         </CardHeader>
         <CardContent>
           <p>${product.price}</p>
           <Button onClick={() => onAddToCart(product)}>
             Add to Cart
           </Button>
         </CardContent>
       </Card>
     );
   }
   ```

## 🎨 Customization

### Styling

The project uses TailwindCSS for styling. You can customize the design system by editing:

- `tailwind.config.js` - Tailwind configuration
- `src/index.css` - Global styles and CSS variables
- `components.json` - shadcn/ui configuration

### Animations

Custom animations are defined in `src/components/animations/variants.tsx`. You can:

- Add new animation variants
- Modify existing animations
- Create component-specific animations

### API Configuration

Modify `src/services/apiService.ts` to:

- Change base URL and timeout settings
- Add custom request/response interceptors
- Implement different authentication methods
- Add request/response logging

## 🤝 Contributing

1. Follow the existing code structure and naming conventions
2. Use TypeScript for type safety
3. Add proper error handling for API calls
4. Include loading states for async operations
5. Use the established animation patterns
6. Write reusable components when possible

## 📝 License

This project is licensed under the MIT License.

---

Happy coding! 🚀
