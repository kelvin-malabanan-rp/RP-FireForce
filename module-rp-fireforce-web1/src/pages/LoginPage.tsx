import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Eye, EyeOff, Loader2, Zap, ArrowRight, Lock, User } from "lucide-react";
import { AnimatedContainer, fadeInUp } from "../components/animations/variants";
import { ParticleNetwork } from "../components/animations/ParticleNetwork";
import { authService } from "../services";
import { OAuthButtons } from "../components/auth/OAuthButtons";


interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    
    try {
      // Call the actual auth service
      const response = await authService.login({ email, password });
      
      if (response.success) {
        console.log("✅ Login successful!", response.data);
        onLogin(); // Navigate to dashboard
      } else {
        setError("Login failed. Please try again.");
      }
    } catch (err: any) {
      console.error("❌ Login error:", err);
      setError(err.message || "Invalid email or password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative overflow-hidden">
      {/* Particle Network Background */}
      <ParticleNetwork />
      
      {/* Background Gradient Overlays */}
      <div className="fixed inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-red-500/5" style={{ zIndex: 3 }} />
      <div className="fixed inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" style={{ zIndex: 3 }} />
      
      {/* Content Container */}
      <div className="relative z-10 flex flex-col min-h-screen">
        {/* Top Navigation */}
        <motion.nav
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="w-full border-b border-white/10 bg-black/30 backdrop-blur-2xl relative"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 to-red-500/5" />
          <div className="container mx-auto px-4 flex h-16 items-center justify-between relative z-10">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="flex items-center space-x-3 cursor-pointer"
            >
              <motion.img
                src="https://i.postimg.cc/Y9pP0btx/Gemini-Generated-Image-n40l9yn40l9yn40l-1.png"
                alt="FireForce Logo"
                className="w-10 h-10 rounded-xl shadow-lg shadow-orange-500/25"
                whileHover={{ rotate: 5 }}
                transition={{ duration: 0.3 }}
              />
              <div className="flex flex-col">
                <span className="text-2xl font-bold bg-gradient-to-r from-orange-400 to-red-500 bg-clip-text text-transparent">
                  FireForce
                </span>
                <span className="text-xs text-white/50 -mt-1">Neural Platform</span>
              </div>
            </motion.div>
            
            <div className="flex items-center space-x-6">
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                href="#"
                className="text-white/80 hover:text-white transition-all duration-200 text-sm font-medium relative group"
              >
                About
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 group-hover:w-full transition-all duration-200" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                href="#"
                className="text-white/80 hover:text-white transition-all duration-200 text-sm font-medium relative group"
              >
                Features
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 group-hover:w-full transition-all duration-200" />
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                href="#"
                className="text-white/80 hover:text-white transition-all duration-200 text-sm font-medium relative group"
              >
                Contact
                <div className="absolute -bottom-1 left-0 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-red-500 group-hover:w-full transition-all duration-200" />
              </motion.a>
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                <Button 
                  size="sm"
                  className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white shadow-lg shadow-orange-500/25"
                >
                  Get Started
                </Button>
              </motion.div>
            </div>
          </div>
        </motion.nav>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side - Branding */}
          <AnimatedContainer variant={fadeInUp} className="text-center lg:text-left relative">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mb-8 relative"
            >
              {/* Background decorative elements */}
              <div className="absolute -top-10 -left-10 w-20 h-20 bg-gradient-to-r from-orange-500/20 to-red-500/20 rounded-full blur-xl animate-pulse" />
              <div className="absolute top-20 -right-5 w-32 h-32 bg-gradient-to-r from-pink-500/10 to-purple-500/10 rounded-full blur-2xl animate-pulse" style={{ animationDelay: '1s' }} />
              
              <motion.h1 
                className="text-5xl lg:text-7xl font-bold mb-6 relative"
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
              >
                <span className="text-white/90">Power up with </span>
                <br />
                <motion.span 
                  className="bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent relative inline-block"
                  animate={{ 
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
                  }}
                  transition={{ 
                    duration: 3, 
                    repeat: Infinity, 
                    ease: "linear" 
                  }}
                  style={{ backgroundSize: '200% 200%' }}
                >
                  FireForce
                  {/* Glowing effect */}
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent blur-sm opacity-50 animate-pulse" />
                </motion.span>
              </motion.h1>
              
              <motion.p 
                className="text-xl text-white/70 mb-8 max-w-2xl leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
              >
                Experience the power of innovation. Login to access your dashboard and unleash the full potential of our platform.
              </motion.p>
              
            </motion.div>
          </AnimatedContainer>

          {/* Right Side - Login Form */}
          <AnimatedContainer variant={fadeInUp} delay={0.3}>
            <Card className="w-full max-w-md mx-auto bg-black/30 backdrop-blur-2xl border border-white/20 shadow-2xl shadow-orange-500/10 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 via-transparent to-red-500/5" />
              <div className="absolute top-0 left-0 w-full h-0.5 bg-gradient-to-r from-orange-500 to-red-500" />
              
              <CardHeader className="text-center relative z-10">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.5, type: "spring", stiffness: 200 }}
                  className="w-32 h-32 mx-auto mb-4"
                >
                  <img
                    src="https://i.postimg.cc/Y9pP0btx/Gemini-Generated-Image-n40l9yn40l9yn40l-1.png"
                    alt="FireForce Logo"
                    className="w-full h-full object-contain"
                  />
                </motion.div>
                <CardTitle className="text-3xl font-bold text-white mb-2">
                  Sign In
                </CardTitle>
                <p className="text-white/60">
                  Access your FireForce dashboard
                </p>
              </CardHeader>
              <CardContent className="relative z-10">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <User className="h-4 w-4 text-orange-400" />
                      Email Address
                    </label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder="your@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        disabled={loading}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-orange-500 focus:ring-orange-500 transition-all duration-200 pl-4 pr-4 h-12 rounded-xl group-hover:bg-white/15"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium text-white/80 flex items-center gap-2">
                      <Lock className="h-4 w-4 text-orange-400" />
                      Password
                    </label>
                    <div className="relative group">
                      <Input
                        id="password"
                        type={showPassword ? "text" : "password"}
                        placeholder="Enter your password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        disabled={loading}
                        className="bg-white/10 border-white/20 text-white placeholder:text-white/50 focus:border-orange-500 focus:ring-orange-500 transition-all duration-200 pl-4 pr-12 h-12 rounded-xl group-hover:bg-white/15"
                      />
                      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0 hover:bg-white/10 text-white/60 hover:text-white rounded-lg"
                        onClick={() => setShowPassword(!showPassword)}
                        disabled={loading}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="relative my-6">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-white/20"></div>
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-black/30 px-2 text-white/60">Or continue with</span>
                    </div>
                  </div>

                  <OAuthButtons
                    onError={(error) => setError(error)}
                    disabled={loading}
                  />

                  <div className="flex items-center justify-between">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        className="rounded border-white/20 bg-white/10 text-orange-500 focus:ring-orange-500"
                      />
                      <span className="text-sm text-white/60">Remember me</span>
                    </label>
                    <motion.a
                      whileHover={{ scale: 1.05 }}
                      href="#"
                      className="text-sm text-orange-400 hover:text-orange-300 transition-colors"
                    >
                      Forgot password?
                    </motion.a>
                  </div>

                  {error && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      className="text-sm text-red-400 bg-red-500/10 p-3 rounded-md border border-red-500/20"
                    >
                      {error}
                    </motion.div>
                  )}

                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium" 
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Signing in...
                      </>
                    ) : (
                      <>
                        Sign In
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </>
                    )}
                  </Button>

                  <div className="text-center">
                    <span className="text-white/60 text-sm">
                      Don't have an account?{" "}
                      <motion.a
                        whileHover={{ scale: 1.05 }}
                        href="#"
                        className="text-orange-400 hover:text-orange-300 transition-colors font-medium"
                      >
                        Sign up
                      </motion.a>
                    </span>
                  </div>
                </form>
              </CardContent>
            </Card>


          </AnimatedContainer>
        </div>
      </div>

      {/* Footer */}
      <motion.footer
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="border-t border-white/10 bg-black/20 backdrop-blur-xl"
      >
        <div className="container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <img 
                src="https://i.postimg.cc/Y9pP0btx/Gemini-Generated-Image-n40l9yn40l9yn40l-1.png"
                alt="FireForce Logo"
                className="w-6 h-6 rounded"
              />
              <span className="text-white/60 text-sm">
                © 2025 FireForce. All rights reserved.
              </span>
            </div>
            <div className="flex items-center space-x-6">
              <motion.a
                whileHover={{ scale: 1.05 }}
                href="#"
                className="text-white/60 hover:text-white/80 transition-colors text-sm"
              >
                Privacy Policy
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                href="#"
                className="text-white/60 hover:text-white/80 transition-colors text-sm"
              >
                Terms of Service
              </motion.a>
              <motion.a
                whileHover={{ scale: 1.05 }}
                href="#"
                className="text-white/60 hover:text-white/80 transition-colors text-sm"
              >
                Support
              </motion.a>
            </div>
          </div>
        </div>
      </motion.footer>
      </div>
    </div>
  );
}