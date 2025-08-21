import { TrendingUp, Users, Globe, Zap } from "lucide-react";

const Stats = () => {
  const stats = [
    {
      icon: Users,
      value: "50K+",
      label: "Active Merchants",
      color: "text-blue-500"
    },
    {
      icon: Globe,
      value: "180+",
      label: "Countries Supported",
      color: "text-green-500"
    },
    {
      icon: TrendingUp,
      value: "$2.5B+",
      label: "Revenue Processed",
      color: "text-purple-500"
    },
    {
      icon: Zap,
      value: "99.9%",
      label: "Uptime Guarantee",
      color: "text-yellow-500"
    }
  ];

  return (
    <section className="py-16 bg-primary text-primary-foreground">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} className="text-center">
                <div className="flex justify-center mb-4">
                  <div className="bg-white/10 p-4 rounded-2xl">
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                </div>
                <div className="text-3xl md:text-4xl font-bold mb-2">{stat.value}</div>
                <div className="text-white/80 text-sm md:text-base">{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Stats;