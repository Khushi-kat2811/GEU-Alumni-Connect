import { Link } from "react-router-dom";
import heroBg from "@/assets/hero-bg.jpg";

const HeroSection = () => {
  return (
    <section
      className="relative bg-cover bg-center py-16 md:py-24 px-4"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      <div className="absolute inset-0 bg-gradient-to-r from-primary/80 to-secondary/60" />
      <div className="relative z-10 text-center max-w-2xl mx-auto">
        <p className="text-secondary font-heading font-bold text-xl md:text-3xl mb-3">
          GEU Alumni Connect
        </p>
        <h1 className="font-heading font-bold text-2xl md:text-4xl text-foreground leading-tight mb-3">
          Connect, Engage, and Grow with Graphic Era Alumni Network
        </h1>
        <p className="text-card text-sm md:text-base mb-8">
          Join a thriving community of over 50,000+ graduates making an impact worldwide.
        </p>

        <div className="bg-card rounded-xl shadow-lg p-6 max-w-sm mx-auto">
          <h3 className="text-secondary font-heading font-semibold text-lg mb-4">Get Started</h3>
          <div className="flex gap-3">
            <Link to="/login" className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-md font-semibold text-sm hover:opacity-90 transition-opacity text-center">
              LOGIN
            </Link>
            <Link to="/signup" className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-md font-semibold text-sm hover:opacity-90 transition-opacity text-center">
              SIGN UP
            </Link>
          </div>
          <div className="flex justify-between mt-2 text-[11px] text-muted-foreground">
            <span>Already a member? Log in</span>
            <span>New here? Register to connect.</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
