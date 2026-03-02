import Navbar from "@/components/layout/Navbar";
import HeroSection from "@/components/landing/HeroSection";
import FeaturesSection from "@/components/landing/FeaturesSection";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <FeaturesSection />
      <footer className="py-12 border-t border-border">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground text-sm">
            © 2026 PlacePrep AI — AI-Powered College Placement Platform
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
