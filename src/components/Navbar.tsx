import { Search } from "lucide-react";
import geuLogo from "@/assets/geu-logo.png";

const Navbar = () => {
  return (
    <nav className="bg-card shadow-sm px-4 md:px-8 py-3 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <img src={geuLogo} alt="GEU Logo" className="h-10 w-10" />
        <div className="font-heading">
          <span className="text-secondary font-bold text-lg">GEU</span>
          <span className="text-foreground font-semibold text-sm"> - Graphic Era</span>
          <p className="text-muted-foreground text-[10px] leading-tight">Deemed to be University</p>
        </div>
      </div>

      <div className="hidden md:flex items-center gap-6">
        <a href="#" className="text-foreground text-sm font-medium hover:text-primary transition-colors">About</a>
        <a href="#" className="text-foreground text-sm font-medium hover:text-primary transition-colors">Events</a>
        <a href="#" className="text-foreground text-sm font-medium hover:text-primary transition-colors">Directory</a>
        <div className="flex items-center">
          <input
            type="text"
            placeholder="Search"
            className="border border-border rounded-l-md px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          <button className="bg-primary text-primary-foreground px-3 py-1.5 rounded-r-md text-sm font-semibold hover:opacity-90 transition-opacity">
            SEARCH
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
