import { Link } from "react-router-dom";
import geuLogo from "@/assets/geu-logo.png";

const Navbar = () => {
  const scrollTo = (id: string) => (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <nav className="bg-card shadow-sm px-4 md:px-8 py-3 flex items-center justify-between sticky top-0 z-50">
      <Link to="/" className="flex items-center gap-2">
        <img src={geuLogo} alt="GEU Logo" className="h-10 w-10" />
        <div className="font-heading">
          <span className="text-secondary font-bold text-lg">GEU</span>
          <span className="text-foreground font-semibold text-sm"> - Graphic Era</span>
          <p className="text-muted-foreground text-[10px] leading-tight">Deemed to be University</p>
        </div>
      </Link>

      <div className="hidden md:flex items-center gap-6">
        <a href="#features" onClick={scrollTo("features")}
          className="text-foreground text-sm font-medium hover:text-primary transition-colors">About</a>
        <a href="#features" onClick={scrollTo("features")}
          className="text-foreground text-sm font-medium hover:text-primary transition-colors">Features</a>
        <a href="#partners" onClick={scrollTo("partners")}
          className="text-foreground text-sm font-medium hover:text-primary transition-colors">Partners</a>
        <Link to="/login"
          className="bg-primary text-primary-foreground px-4 py-1.5 rounded-md text-sm font-semibold hover:opacity-90 transition-opacity">
          Login
        </Link>
      </div>
    </nav>
  );
};

export default Navbar;
