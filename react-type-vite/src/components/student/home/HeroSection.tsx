import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";
import element05 from "@/assets/images/element/05.svg";
import {
  heroTitleVariant,
  heroSubtitleVariant,
  heroImageVariant,
  staggerContainerVariant,
} from "@/motion/variants";
import { useNavigate } from "react-router-dom";

const HeroSection = () => {
  const navigate = useNavigate();

  return (
    <motion.section
      className="relative overflow-hidden bg-background py-12 lg:px-10 lg:py-16"
      initial="hidden"
      animate="visible"
      variants={staggerContainerVariant}
    >
      {/* Background decorative elements with enhanced blinking */}
      <div className="absolute inset-0 pointer-events-none z-0">
        {/* Large floating particles */}
        <motion.div
          className="absolute top-20 left-10 w-3 h-3 bg-bs-warning rounded-full animate-blink delay-75"
          animate={{
            y: [-5, 5, -5],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute top-32 right-20 w-2 h-2 bg-bs-success rounded-full animate-twinkle delay-150"
          animate={{
            y: [-3, 3, -3],
          }}
          transition={{
            duration: 2.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 0.5,
          }}
        />
        <motion.div
          className="absolute bottom-40 left-20 w-4 h-4 bg-bs-primary rounded-full animate-glow delay-300"
          animate={{
            y: [-6, 6, -6],
          }}
          transition={{
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1,
          }}
        />

        {/* Small twinkling stars */}
        <div className="absolute top-24 left-1/4 w-1 h-1 bg-bs-primary rounded-full animate-twinkle opacity-70"></div>
        <div className="absolute top-36 right-1/4 w-1 h-1 bg-bs-success rounded-full animate-blink delay-75 opacity-70"></div>
        <div className="absolute bottom-32 left-3/4 w-1 h-1 bg-bs-danger rounded-full animate-sparkle delay-150 opacity-70"></div>

        {/* Floating geometric shapes */}
        <motion.div
          className="absolute top-16 right-16 w-6 h-6 border-2 border-bs-warning rotate-45 opacity-60"
          animate={{
            y: [-4, 4, -4],
            rotate: [45, 90, 45],
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Larger glowing orbs */}
        <motion.div
          className="absolute top-12 left-1/2 w-8 h-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full opacity-40 blur-sm"
          animate={{
            y: [-8, 8, -8],
            scale: [1, 1.1, 1],
          }}
          transition={{
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />

        {/* Pulsing rings */}
        <div className="absolute top-28 right-28 w-12 h-12 border-2 border-bs-info rounded-full animate-ping opacity-30"></div>
        <div className="absolute bottom-28 left-28 w-10 h-10 border-2 border-bs-purple rounded-full animate-ping delay-150 opacity-40"></div>
      </div>

      {/* Background decoration */}
      <div className="absolute top-1/2 right-0 transform translate-y-[-50%] translate-x-8 opacity-10 z-0">
        <svg
          width="1360.5px"
          height="793px"
          viewBox="0 0 1360.5 793"
          className="fill-bs-primary"
        >
          <path d="M33.5,766.3c75.3-24.2,124.5-20.3,155.2-62.8c35.4-49,53.1-184.7,138-191.2s100.9,55.6,208.8-21.2 s44.5-134.3,166.4-174.9c121.8-40.6,177,80.1,279.6,36s122.1-248.4,178.8-290.9c49.3-37,171.2-56.7,200.2-61.1v793H33.5 C33.5,793-41.9,790.4,33.5,766.3z" />
        </svg>
      </div>

      <div className="container mx-auto px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="order-2 lg:order-1">
            <motion.h1
              className="text-3xl md:text-4xl lg:text-5xl font-bold text-foreground mb-4 leading-tight"
              variants={heroTitleVariant}
            >
              Chúng tôi sẽ giúp bạn{" "}
              <motion.span
                className="text-bs-primary relative"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.2 }}
              >
                Phát triển
                <motion.div
                  className="absolute -top-2 -right-2 w-3 h-3 bg-bs-warning rounded-full"
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.8, 1, 0.8],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                  }}
                />
              </motion.span>{" "}
              Kiến thức và Kỹ năng
            </motion.h1>

            <motion.h6
              className="text-lg lg:text-xl text-muted-foreground mb-6 font-medium"
              variants={heroSubtitleVariant}
            >
              Hơn 1000 khóa học chuyên nghiệp cho sự nghiệp của bạn
            </motion.h6>

            <Button
              className="bg-bs-primary text-white px-6 py-3 text-base font-medium rounded-lg shadow-bs transition-all duration-300 relative group"
              onClick={() => {
                navigate("/courses");
              }}
            >
              <span className="relative z-10">Khám phá ngay</span>
            </Button>
          </div>

          <motion.div
            className="order-1 lg:order-2 relative"
            variants={heroImageVariant}
          >
            <div className="relative z-10">
              <motion.img
                src={element05}
                alt="Minh họa giáo dục"
                className="w-full h-auto max-w-lg mx-auto"
                whileHover={{ scale: 1.02 }}
                transition={{ duration: 0.3 }}
              />
            </div>

            {/* Enhanced floating decorative elements around illustration */}
            <motion.div
              className="absolute -top-4 -left-4 w-8 h-8 bg-bs-warning rounded-full animate-glow opacity-60"
              animate={{
                y: [-4, 4, -4],
              }}
              transition={{
                duration: 2.8,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute -top-2 -right-2 w-6 h-6 bg-bs-success rounded-full animate-blink delay-75 opacity-70"
              animate={{
                y: [-3, 3, -3],
              }}
              transition={{
                duration: 3.2,
                repeat: Infinity,
                ease: "easeInOut",
                delay: 0.5,
              }}
            />

            {/* Additional blinking elements */}
            <motion.div
              className="absolute top-10 right-10 w-4 h-4 bg-bs-warning rounded-full opacity-80"
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.6, 1, 0.6],
              }}
              transition={{
                duration: 1.8,
                repeat: Infinity,
                delay: 0.2,
              }}
            />

            {/* Orbiting elements */}
            <motion.div
              className="absolute top-1/4 -left-8 w-4 h-4 border-2 border-bs-info rounded-full"
              animate={{
                rotate: 360,
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                ease: "linear",
              }}
            />
            <motion.div
              className="absolute top-3/4 -right-8 w-3 h-3 border-2 border-bs-danger rotate-45"
              animate={{
                rotate: [45, 405],
              }}
              transition={{
                duration: 10,
                repeat: Infinity,
                ease: "linear",
                delay: 1,
              }}
            />
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

export default HeroSection;
