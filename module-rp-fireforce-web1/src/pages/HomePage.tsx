import { motion } from "framer-motion";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { AnimatedContainer, StaggeredContainer, fadeInUp } from "../components/animations/variants";
import { ArrowRight, Sparkles, Zap, Shield } from "lucide-react";

export function HomePage() {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <AnimatedContainer className="text-center space-y-6">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="inline-flex items-center px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium"
        >
          <Sparkles className="mr-2 h-4 w-4" />
          Welcome to Your App
        </motion.div>
        
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
          Build Amazing
          <motion.span
            initial={{ backgroundPosition: "0% 50%" }}
            animate={{ backgroundPosition: "100% 50%" }}
            transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
            className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent bg-300% ml-4"
          >
            Experiences
          </motion.span>
        </h1>
        
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Create stunning web applications with React, TailwindCSS, and shadcn/ui. 
          Built for performance, designed for developers.
        </p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="lg" className="group">
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </Button>
          </motion.div>
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </motion.div>
        </div>
      </AnimatedContainer>

      {/* Features Section */}
      <StaggeredContainer className="grid md:grid-cols-3 gap-6">
        <AnimatedContainer variant={fadeInUp}>
          <Card className="h-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Lightning Fast</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Built with Vite for incredibly fast development and production builds.
              </p>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer variant={fadeInUp}>
          <Card className="h-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Type Safe</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Full TypeScript support with strict type checking and IntelliSense.
              </p>
            </CardContent>
          </Card>
        </AnimatedContainer>

        <AnimatedContainer variant={fadeInUp}>
          <Card className="h-full hover:shadow-lg transition-shadow duration-300">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <CardTitle>Beautiful UI</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">
                Stunning components powered by shadcn/ui and smooth animations.
              </p>
            </CardContent>
          </Card>
        </AnimatedContainer>
      </StaggeredContainer>

      {/* CTA Section */}
      <AnimatedContainer className="text-center bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 p-12 rounded-2xl">
        <h2 className="text-3xl font-bold mb-4">Ready to get started?</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
          Start building your next amazing project with our modern tech stack and developer-friendly tools.
        </p>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button size="lg">
            Start Building
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </AnimatedContainer>
    </div>
  );
}
