import { Users, Briefcase, Calendar, Network } from "lucide-react";
import alumni1 from "@/assets/alumni1.jpg";
import alumni2 from "@/assets/alumni2.jpg";
import alumni3 from "@/assets/alumni3.jpg";
import alumni4 from "@/assets/alumni4.jpg";
import alumni5 from "@/assets/alumni5.jpg";
import alumni6 from "@/assets/alumni6.jpg";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

const features = [
  { icon: Users, title: "Mentorship", desc: "Mentorship on mentorship" },
  { icon: Briefcase, title: "Career Support", desc: "Make your support" },
  { icon: Calendar, title: "Events", desc: "Events and students" },
  { icon: Network, title: "Networking", desc: "Research networking" },
];

const spotlights = [
  { name: "Navnid Parastal", img: alumni1, desc: "Graphic Era alumni, researcher in Data Science at IIT Delhi. Published 15+ papers in AI/ML." },
  { name: "Asanti Sirosmam", img: alumni2, desc: "Graphic Era alumni, Senior Software Engineer at Google. Leading cloud infrastructure projects." },
  { name: "Rohit Mehra", img: alumni3, desc: "Graphic Era alumni, Co-founder of a fintech startup. Forbes 30 Under 30 Asia 2024 honoree." },
  { name: "Priya Sharma", img: alumni4, desc: "Graphic Era alumni, Data Scientist at Microsoft. Specializing in NLP and computer vision." },
  { name: "Arjun Kapoor", img: alumni5, desc: "Graphic Era alumni, Product Manager at Amazon. Building next-gen e-commerce experiences." },
  { name: "Deepa Nair", img: alumni6, desc: "Graphic Era alumni, VP of Engineering at Deloitte. Mentoring 200+ aspiring engineers." },
];

const FeaturesSection = () => {
  return (
    <section className="bg-muted py-10 px-4">
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Feature Cards */}
        <div className="grid grid-cols-2 gap-3">
          {features.map((f) => (
            <div key={f.title} className="bg-card rounded-lg p-4 shadow-sm border border-border flex flex-col items-start gap-2">
              <f.icon className="h-6 w-6 text-primary" />
              <h4 className="font-heading font-semibold text-sm text-foreground">{f.title}</h4>
              <p className="text-muted-foreground text-xs">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* Alumni Spotlights Carousel */}
        <div>
          <h3 className="text-secondary font-heading font-semibold text-lg mb-3">Featured Alumni Spotlights</h3>
          <Carousel opts={{ loop: true }} className="w-full">
            <CarouselContent>
              {spotlights.map((s) => (
                <CarouselItem key={s.name} className="basis-1/2">
                  <div className="bg-card rounded-lg overflow-hidden shadow-sm border border-border h-full">
                    <img src={s.img} alt={s.name} className="w-full h-32 object-cover" />
                    <div className="p-3">
                      <h5 className="font-heading font-semibold text-sm text-foreground">{s.name}</h5>
                      <p className="text-muted-foreground text-[11px] mt-1 line-clamp-3">{s.desc}</p>
                      <a href="#" className="text-accent text-xs font-semibold mt-1 inline-block">Profile</a>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="-left-4" />
            <CarouselNext className="-right-4" />
          </Carousel>
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
