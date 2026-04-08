import logoGoogle from "@/assets/logo-google.png";
import logoMicrosoft from "@/assets/logo-microsoft.png";
import logoAmazon from "@/assets/logo-amazon.png";
import logoDeloitte from "@/assets/logo-deloitte.png";
import logoCapgemini from "@/assets/logo-capgemini.png";
import logoInfosys from "@/assets/logo-infosys.png";
import logoWipro from "@/assets/logo-wipro.png";
import logoHcl from "@/assets/logo-hcl.png";

const partners = [
  { name: "Google", logo: logoGoogle },
  { name: "Microsoft", logo: logoMicrosoft },
  { name: "Amazon", logo: logoAmazon },
  { name: "Deloitte", logo: logoDeloitte },
  { name: "Capgemini", logo: logoCapgemini },
  { name: "Infosys", logo: logoInfosys },
  { name: "Wipro", logo: logoWipro },
  { name: "HCL", logo: logoHcl },
];

const PartnersSection = () => {
  return (
    <section className="bg-card py-10 px-4">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-accent font-heading font-semibold text-lg md:text-xl mb-6">
          Our Prestigious Recruiters & Industry Partners
        </h2>
        <div className="grid grid-cols-4 gap-4 max-w-2xl mx-auto">
          {partners.map((p) => (
            <div
              key={p.name}
              className="bg-card border border-border rounded-lg p-2 flex items-center justify-center shadow-sm aspect-[3/2]"
            >
              <img src={p.logo} alt={p.name} className="w-full h-full object-contain p-1" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnersSection;
