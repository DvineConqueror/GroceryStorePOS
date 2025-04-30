import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Eye } from 'lucide-react'
import { EyeOff } from 'lucide-react'

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [type, setType] = useState('password');
  const [icon, setIcon] = useState(<EyeOff />);
  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState('');
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  const togglePasswordVisibility = () => {
    if (type === 'password') {
      setType('text');
      setIcon(<Eye />);
    } else {
      setType('password');
      setIcon(<EyeOff />);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (isSignUp) {
        await signUp(email, password, fullName);
        // After signup, sign in automatically
        await signIn(email, password);
      } else {
        await signIn(email, password);
      }
      navigate('/');
    } catch (error) {
      console.error('Authentication error:', error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pos-primary/20 to-pos-background">
      <div className="container mx-auto flex items-center justify-center px-4">
        <div className="grid md:grid-cols-2 gap-8 w-full max-w-[1000px] bg-white rounded-2xl shadow-2xl p-8">
          {/* Left side - Image/Logo Section */}
          <div className="hidden md:flex flex-col items-center justify-center p-8 bg-pos-primary/10 rounded-xl">
            <div className="w-48 h-48 mb-8 bg-pos-primary/20 rounded-full flex items-center justify-center">
              {/* Placeholder for logo */}
              <img
                src="/images/BlesseStoreIcon.png"
                alt="Store Logo"
                className="w-40 h-40 object-contain mix-blend-multiply contrast-125"
              />
            </div>
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-bold text-pos-primary">Welcome to Grocery POS</h2>
              <p className="text-gray-600">Manage your store with ease and efficiency</p>
            </div>
          </div>

          {/* Right side - Login Form */}
          <div className="flex flex-col justify-center">
            <Card className="border-0 shadow-none">
              <CardHeader className="space-y-2">
                <CardTitle className="text-3xl font-bold text-pos-primary">
                  {isSignUp ? 'Create Account' : 'Welcome Back'}
                </CardTitle>
                <CardDescription className="text-base">
                  {isSignUp 
                    ? 'Create a new account to get started' 
                    : 'Sign in to continue to your dashboard'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName" className="text-sm font-medium">
                        Full Name
                      </Label>
                      <Input
                        id="fullName"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="h-11 px-4 border-gray-200 focus:border-pos-primary focus:ring-pos-primary/20"
                        placeholder="John Doe"
                        required
                      />
                    </div>
                  )}
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-sm font-medium">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-11 px-4 border-gray-200 focus:border-pos-primary focus:ring-pos-primary/20"
                      placeholder="you@example.com"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-sm font-medium">
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="password"
                        type={type}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="h-11 px-4 pr-10 border-gray-200 focus:border-pos-primary focus:ring-pos-primary/20"
                        placeholder="••••••••"
                        required
                      />
                      <button 
                        type="button"
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-pos-primary transition-colors duration-300"
                        onClick={togglePasswordVisibility}
                      >
                        {icon}
                      </button>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-pos-primary hover:bg-pos-primary/90 duration-500 text-white font-medium"
                  >
                    {isSignUp ? 'Create Account' : 'Sign In'}
                  </Button>
                  <Button
                    type="button"
                    variant="link"
                    className="w-full text-pos-primary hover:text-pos-primary/80 duration-500"
                    onClick={() => setIsSignUp(!isSignUp)}
                  >
                    {isSignUp 
                      ? 'Already have an account? Sign in' 
                      : "Don't have an account? Sign up"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}