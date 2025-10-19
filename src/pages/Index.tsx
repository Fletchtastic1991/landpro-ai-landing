import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Sparkles, Calendar, Users, Megaphone, Trees, Scissors, Home, CheckCircle, LayoutDashboard } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-landscape.jpg";

const Index = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    email: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Thanks for joining the waitlist! We'll be in touch soon.");
    setFormData({ name: "", company: "", email: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation Bar */}
      <nav className="absolute top-0 left-0 right-0 z-50 bg-gradient-to-b from-primary/20 to-transparent backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary-foreground">LandPro AI</h1>
          <Button 
            onClick={() => navigate("/dashboard")}
            variant="outline"
            className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 backdrop-blur-sm gap-2"
          >
            <LayoutDashboard className="h-4 w-4" />
            View Dashboard
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroImage})` }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-background" />
        </div>
        
        <div className="relative z-10 container mx-auto px-4 text-center animate-fade-in">
          <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6">
            Work Smarter. Manage Land Better.
          </h1>
          <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto">
            LandPro AI helps landscapers and land management pros automate quotes, 
            organize jobs, and win more clients — all in one simple AI-powered tool.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-accent hover:bg-accent/90 text-accent-foreground text-lg px-8 py-6 transition-transform hover:scale-105"
            >
              Get Early Access
            </Button>
            <Button 
              size="lg" 
              variant="outline" 
              className="bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30 text-lg px-8 py-6 transition-transform hover:scale-105 backdrop-blur-sm"
            >
              Watch Demo
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground animate-slide-up">
            Powerful Features for Pro Results
          </h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <Card className="border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-2 animate-fade-in">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-2xl">AI Job Quoting</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Instantly generate accurate quotes from job descriptions or property sizes. 
                  No more manual calculations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-2 animate-fade-in [animation-delay:100ms]">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-2xl">Smart Scheduling</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Automatically plan your week and notify clients of updates. 
                  Stay organized effortlessly.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-2 animate-fade-in [animation-delay:200ms]">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Users className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-2xl">Customer Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Keep all your client info and messages in one place. 
                  Never lose track of a customer again.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-border hover:shadow-lg transition-all duration-300 hover:-translate-y-2 animate-fade-in [animation-delay:300ms]">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-accent/10 flex items-center justify-center mb-4">
                  <Megaphone className="w-6 h-6 text-accent" />
                </div>
                <CardTitle className="text-2xl">Marketing Made Easy</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base">
                  Generate posts, emails, and ads to grow your business. 
                  AI-powered marketing that works.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Use Cases Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground">
            Perfect for Every Land Professional
          </h2>
          
          <div className="grid md:grid-cols-3 gap-12 max-w-5xl mx-auto">
            <div className="text-center animate-slide-up">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Trees className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Landscaping Companies</h3>
              <p className="text-muted-foreground">
                From design to maintenance, manage every aspect of your landscaping business.
              </p>
            </div>

            <div className="text-center animate-slide-up [animation-delay:100ms]">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Scissors className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Land Clearing Services</h3>
              <p className="text-muted-foreground">
                Quote big jobs fast and manage complex clearing projects with confidence.
              </p>
            </div>

            <div className="text-center animate-slide-up [animation-delay:200ms]">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                <Home className="w-10 h-10 text-primary" />
              </div>
              <h3 className="text-2xl font-semibold mb-3 text-foreground">Property Maintenance Pros</h3>
              <p className="text-muted-foreground">
                Keep properties beautiful year-round with smart scheduling and client communication.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-16 text-foreground">
            Trusted by Land Professionals
          </h2>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-lg italic mb-4 text-foreground">
                  "LandPro AI cut my quoting time in half."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <span className="text-primary font-semibold">JT</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Jake T.</p>
                    <p className="text-sm text-muted-foreground">JT Landworks</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-lg italic mb-4 text-foreground">
                  "I finally have everything in one place. Game changer."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <span className="text-primary font-semibold">ML</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Marcus L.</p>
                    <p className="text-sm text-muted-foreground">GreenEdge Landscaping</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <p className="text-lg italic mb-4 text-foreground">
                  "This is the AI I didn't know I needed."
                </p>
                <div className="flex items-center">
                  <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                    <span className="text-primary font-semibold">SP</span>
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">Sarah P.</p>
                    <p className="text-sm text-muted-foreground">ProCut Outdoors</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">
            Simple, Transparent Pricing
          </h2>
          <p className="text-xl text-center text-muted-foreground mb-16">
            Choose the plan that fits your business
          </p>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <Card className="border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-2xl">Starter</CardTitle>
                <CardDescription>For solo owner-operators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-foreground">$29</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">AI job quoting</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Basic scheduling</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Up to 25 clients</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Email support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Get Started
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-accent border-2 hover:shadow-xl transition-all duration-300 hover:-translate-y-1 relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-semibold">
                Most Popular
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Pro</CardTitle>
                <CardDescription>For growing teams</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-foreground">$79</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Everything in Starter</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Advanced scheduling</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Unlimited clients</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Marketing automation</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Priority support</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground">
                  Get Started
                </Button>
              </CardFooter>
            </Card>

            <Card className="border-border hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <CardTitle className="text-2xl">Business</CardTitle>
                <CardDescription>For full-service companies</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-6">
                  <span className="text-5xl font-bold text-foreground">$149</span>
                  <span className="text-muted-foreground">/month</span>
                </div>
                <ul className="space-y-3">
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Everything in Pro</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Team collaboration</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Custom integrations</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Advanced analytics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 text-accent mr-2 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">Dedicated account manager</span>
                  </li>
                </ul>
              </CardContent>
              <CardFooter>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  Get Started
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </section>

      {/* Waitlist Form Section */}
      <section className="py-24 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-bold text-center mb-4 text-foreground">
              Join the Waitlist
            </h2>
            <p className="text-xl text-center text-muted-foreground mb-12">
              Be among the first to experience LandPro AI
            </p>
            
            <Card className="border-border">
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-foreground mb-2">
                      Name *
                    </label>
                    <Input
                      id="name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label htmlFor="company" className="block text-sm font-medium text-foreground mb-2">
                      Company *
                    </label>
                    <Input
                      id="company"
                      type="text"
                      required
                      value={formData.company}
                      onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                      className="w-full"
                      placeholder="Smith Landscaping"
                    />
                  </div>

                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email *
                    </label>
                    <Input
                      id="email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className="w-full"
                      placeholder="john@smithlandscaping.com"
                    />
                  </div>

                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Message (Optional)
                    </label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full min-h-[100px]"
                      placeholder="Tell us about your business..."
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-lg py-6"
                  >
                    Join Waitlist
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 bg-primary text-primary-foreground">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <h3 className="text-2xl font-bold mb-4">LandPro AI</h3>
            <p className="text-primary-foreground/80 mb-6">
              Built for the Pros Who Build the Land
            </p>
            <div className="flex justify-center gap-8 mb-6 text-sm">
              <a href="#features" className="hover:text-accent transition-colors">Features</a>
              <a href="#pricing" className="hover:text-accent transition-colors">Pricing</a>
              <a href="#about" className="hover:text-accent transition-colors">About</a>
              <a href="#contact" className="hover:text-accent transition-colors">Contact</a>
            </div>
            <p className="text-primary-foreground/60 text-sm">
              © 2025 LandPro AI — Built for the Pros Who Build the Land.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
