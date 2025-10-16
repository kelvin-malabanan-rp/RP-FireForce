import { motion } from "framer-motion";
import { useState } from "react";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Eye, EyeOff, Loader2, ArrowRight, Lock, User } from "lucide-react";
import { AnimatedContainer, fadeInUp } from "../components/animations/variants";
import { ParticleNetwork } from "../components/animations/ParticleNetwork";
import { authService } from "../services/auth-service";

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
            console.log('🔐 Submitting login form...');
            const response = await authService.login({ email, password });

            if (response.success) {
                console.log("✅ Login successful!");
                onLogin();
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

    const handleGoogleLogin = () => {
        console.log('🔵 Starting Google OAuth...');
        authService.initiateGoogleLogin();
    };

    const handleGithubLogin = () => {
        console.log('⚫ Starting GitHub OAuth...');
        authService.initiateGithubLogin();
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col relative overflow-hidden">
            <ParticleNetwork />

            <div className="fixed inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-red-500/5" style={{ zIndex: 3 }} />
            <div className="fixed inset-0 bg-gradient-to-b from-transparent via-purple-900/10 to-transparent" style={{ zIndex: 3 }} />

            <div className="relative z-10 flex flex-col min-h-screen">
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
                                <span className="text-xs text-white/50 -mt-1">Incident Management</span>
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

                <div className="flex-1 flex items-center justify-center px-4 py-12">
                    <div className="w-full max-w-6xl grid lg:grid-cols-2 gap-12 items-center">

                        <AnimatedContainer variant={fadeInUp} className="text-center lg:text-left relative">
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.6, delay: 0.2 }}
                                className="mb-8 relative"
                            >
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
                                        <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-red-500 to-pink-500 bg-clip-text text-transparent blur-sm opacity-50 animate-pulse" />
                                    </motion.span>
                                </motion.h1>

                                <motion.p
                                    className="text-xl text-white/70 mb-8 max-w-2xl leading-relaxed"
                                    initial={{ y: 20, opacity: 0 }}
                                    animate={{ y: 0, opacity: 1 }}
                                    transition={{ delay: 0.8 }}
                                >
                                    Experience the power of real-time incident management. Login to access your dashboard and manage incidents with ease.
                                </motion.p>
                            </motion.div>
                        </AnimatedContainer>

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
                                                    placeholder="your@rocketpartners.io"
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
                                            className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white font-medium shadow-lg hover:shadow-xl transition-all duration-200"
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

                                        {/* OAuth Divider */}
                                        <div className="relative">
                                            <div className="absolute inset-0 flex items-center">
                                                <div className="w-full border-t border-white/20"></div>
                                            </div>
                                            <div className="relative flex justify-center text-sm">
                                                <span className="px-4 bg-transparent text-white/50">
                                                    Or continue with
                                                </span>
                                            </div>
                                        </div>

                                        {/* OAuth Buttons */}
                                        <div className="space-y-3">
                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Button
                                                    type="button"
                                                    onClick={handleGoogleLogin}
                                                    disabled={loading}
                                                    className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium h-12 rounded-xl transition-all duration-200"
                                                >
                                                    <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                                                        <path
                                                            fill="currentColor"
                                                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                                                        />
                                                        <path
                                                            fill="currentColor"
                                                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                                        />
                                                        <path
                                                            fill="currentColor"
                                                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                                        />
                                                        <path
                                                            fill="currentColor"
                                                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                                        />
                                                    </svg>
                                                    Continue with Google
                                                </Button>
                                            </motion.div>

                                            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                                                <Button
                                                    type="button"
                                                    onClick={handleGithubLogin}
                                                    disabled={loading}
                                                    className="w-full bg-white/10 hover:bg-white/20 text-white border border-white/20 font-medium h-12 rounded-xl transition-all duration-200"
                                                >
                                                    <svg className="mr-3 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                                        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                                                    </svg>
                                                    Continue with GitHub
                                                </Button>
                                            </motion.div>
                                        </div>

                                        <div className="text-center mt-4">
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