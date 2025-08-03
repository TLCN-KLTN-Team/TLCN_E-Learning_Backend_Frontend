import { Button } from "@/components/ui/button";
import element05 from "@/assets/images/element/05.svg";

const HeroSection = () => {
  return (
    <section className="pl-8 relative overflow-hidden bg-white dark:bg-gradient-to-br dark:from-[#24292d] dark:via-[#24292d] dark:to-[#1a1f23] py-12 lg:py-16">
      {/* Background decorative elements with enhanced blinking */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Large floating particles */}
        <div className="absolute top-20 left-10 w-3 h-3 bg-yellow-400 rounded-full animate-blink delay-75 animate-float"></div>
        <div className="absolute top-32 right-20 w-2 h-2 bg-green-500 rounded-full animate-twinkle delay-150"></div>
        <div className="absolute bottom-40 left-20 w-4 h-4 bg-blue-600 rounded-full animate-glow delay-300"></div>
        <div className="absolute top-40 right-40 w-2 h-2 bg-red-500 rounded-full animate-sparkle delay-500"></div>

        {/* Medium floating particles */}
        <div className="absolute top-60 left-1/3 w-3 h-3 bg-purple-600 rounded-full animate-blink animate-float delay-75"></div>
        <div className="absolute bottom-60 right-1/3 w-2 h-2 bg-cyan-500 rounded-full animate-twinkle delay-150"></div>
        <div className="absolute top-80 left-2/3 w-2 h-2 bg-yellow-500 rounded-full animate-glow delay-300"></div>

        {/* Small twinkling stars */}
        <div className="absolute top-24 left-1/4 w-1 h-1 bg-blue-400 rounded-full animate-twinkle"></div>
        <div className="absolute top-36 right-1/4 w-1 h-1 bg-green-400 rounded-full animate-blink delay-75"></div>
        <div className="absolute bottom-32 left-3/4 w-1 h-1 bg-red-400 rounded-full animate-sparkle delay-150"></div>
        <div className="absolute top-72 right-1/2 w-1 h-1 bg-purple-400 rounded-full animate-twinkle delay-300"></div>

        {/* Floating geometric shapes */}
        <div className="absolute top-16 right-16 w-6 h-6 border-2 border-yellow-400 rotate-45 animate-sparkle delay-75 opacity-60"></div>
        <div className="absolute bottom-20 left-16 w-4 h-4 border-2 border-green-500 animate-glow delay-150 opacity-70"></div>
        <div className="absolute top-56 left-1/2 w-5 h-5 border-2 border-blue-600 rounded-full animate-blink delay-300 opacity-50"></div>

        {/* Larger glowing orbs */}
        <div className="absolute top-12 left-1/2 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full animate-glow animate-float opacity-40 blur-sm"></div>
        <div className="absolute bottom-12 right-1/4 w-6 h-6 bg-gradient-to-r from-yellow-400 to-red-500 rounded-full animate-blink animate-float delay-150 opacity-50 blur-sm"></div>

        {/* Pulsing rings */}
        <div className="absolute top-28 right-28 w-12 h-12 border-2 border-cyan-400 rounded-full animate-ping opacity-30"></div>
        <div className="absolute bottom-28 left-28 w-10 h-10 border-2 border-purple-400 rounded-full animate-ping delay-150 opacity-40"></div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-1/2 right-0 transform translate-y-[-50%] translate-x-8 opacity-10 z-0">
        <svg
          width="1360.5px"
          height="793px"
          viewBox="0 0 1360.5 793"
          className="fill-[#066ac9]"
        >
          <path d="M33.5,766.3c75.3-24.2,124.5-20.3,155.2-62.8c35.4-49,53.1-184.7,138-191.2s100.9,55.6,208.8-21.2 s44.5-134.3,166.4-174.9c121.8-40.6,177,80.1,279.6,36s122.1-248.4,178.8-290.9c49.3-37,171.2-56.7,200.2-61.1v793H33.5 C33.5,793-41.9,790.4,33.5,766.3z" />
        </svg>
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="order-2 lg:order-1">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[#24292d] dark:text-white mb-4 leading-tight">
              We will help you{" "}
              <span className="text-[#066ac9] dark:text-[#066ac9] relative">
                Grow
                <div className="absolute -top-2 -right-2 w-3 h-3 bg-yellow-400 rounded-full animate-blink"></div>
              </span>{" "}
              your Knowledge and Skills
            </h1>
            <h6 className="text-lg lg:text-xl text-[#747579] dark:text-gray-300 mb-6 font-medium">
              1000+ professional Courses for Your Career
            </h6>
            <Button className="bg-[#066ac9] hover:bg-[#0555a1] text-white px-6 py-3 text-base font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105 relative group">
              <span className="relative z-10">Explore now</span>
              <div className="absolute top-1 right-1 w-2 h-2 bg-white rounded-full animate-twinkle opacity-60"></div>
            </Button>
          </div>

          <div className="order-1 lg:order-2 relative">
            <div className="relative z-10">
              <img
                src={element05}
                alt="Education illustration"
                className="w-full h-auto max-w-lg mx-auto"
              />
            </div>

            {/* Enhanced floating decorative elements around illustration */}
            <div className="absolute -top-4 -left-4 w-8 h-8 bg-yellow-400 rounded-full animate-float animate-glow opacity-60"></div>
            <div className="absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full animate-blink animate-float delay-75 opacity-70"></div>
            <div className="absolute -bottom-4 -left-2 w-5 h-5 bg-blue-600 rounded-full animate-twinkle animate-float delay-150 opacity-60"></div>
            <div className="absolute -bottom-2 -right-4 w-7 h-7 bg-purple-500 rounded-full animate-sparkle animate-float delay-300 opacity-50"></div>

            {/* Additional blinking elements */}
            <div className="absolute top-10 right-10 w-4 h-4 bg-[#f7c32e] rounded-full animate-blink delay-75 opacity-80"></div>
            <div className="absolute bottom-20 left-10 w-3 h-3 bg-[#0cbc87] rounded-full animate-twinkle delay-150 opacity-90"></div>
            <div className="absolute top-1/2 left-5 w-2 h-2 bg-[#066ac9] rounded-full animate-glow delay-300 opacity-75"></div>
            <div className="absolute top-16 left-16 w-2 h-2 bg-[#d6293e] rounded-full animate-sparkle delay-500 opacity-60"></div>
            <div className="absolute bottom-32 right-16 w-3 h-3 bg-[#6f42c1] rounded-full animate-blink delay-75 opacity-70"></div>
            <div className="absolute top-32 right-32 w-1 h-1 bg-[#f7c32e] rounded-full animate-twinkle delay-150 opacity-80"></div>
            <div className="absolute bottom-16 left-32 w-2 h-2 bg-[#17a2b8] rounded-full animate-glow delay-300 opacity-65"></div>

            {/* Orbiting elements */}
            <div className="absolute top-1/4 -left-8 w-4 h-4 border-2 border-cyan-400 rounded-full animate-spin duration-slow"></div>
            <div className="absolute top-3/4 -right-8 w-3 h-3 border-2 border-red-400 rotate-45 animate-spin duration-slow delay-150"></div>

            {/* Floating animation elements */}
            <div className="absolute top-8 left-8 w-6 h-6 border-2 border-[#066ac9] rounded-full animate-spin opacity-30 duration-slow"></div>
            <div className="absolute bottom-8 right-8 w-4 h-4 border border-[#0cbc87] rounded-full animate-pulse opacity-40"></div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
