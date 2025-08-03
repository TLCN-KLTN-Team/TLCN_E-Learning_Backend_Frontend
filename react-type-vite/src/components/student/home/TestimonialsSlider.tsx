import { useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";

interface Testimonial {
  avatar: string;
  name: string;
  content: string;
}

interface TestimonialsSliderProps {
  testimonials: Testimonial[];
}

const TestimonialsSlider = ({ testimonials }: TestimonialsSliderProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel(
    {
      loop: true,
      align: "start",
      slidesToScroll: 1,
      breakpoints: {
        "(min-width: 768px)": { slidesToScroll: 2 },
        "(min-width: 1024px)": { slidesToScroll: 3 },
      },
    },
    [Autoplay({ delay: 3000, stopOnInteraction: false })]
  );

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  useEffect(() => {
    if (emblaApi) {
      console.log("Embla carousel initialized");
    }
  }, [emblaApi]);

  return (
    <div className="px-10 container mx-auto relative z-10">
      <div className="relative">
        <div className="overflow-hidden" ref={emblaRef}>
          <div className="flex">
            {testimonials.map((testimonial, index) => (
              <div
                key={index}
                className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] px-3"
              >
                <div className="bg-white dark:bg-gray-700 p-6 rounded-lg border border-gray-200 dark:border-gray-600 text-center h-full">
                  <div className="w-16 h-16 mx-auto mb-4">
                    <img
                      src={testimonial.avatar}
                      alt={testimonial.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <h6 className="font-semibold text-[#24292d] dark:text-white mb-4 text-sm">
                    {testimonial.name}
                  </h6>
                  <blockquote className="text-[#747579] dark:text-gray-300 text-sm leading-relaxed">
                    <span className="text-xs mr-1">"</span>
                    {testimonial.content}
                    <span className="text-xs ml-1">"</span>
                  </blockquote>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Navigation buttons */}
        <button
          className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-white dark:bg-gray-700 shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-[#066ac9] dark:text-[#066ac9] hover:bg-[#f5f7f9] dark:hover:bg-gray-600 transition-colors z-10"
          onClick={scrollPrev}
          aria-label="Previous testimonial"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
          </svg>
        </button>

        <button
          className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-white dark:bg-gray-700 shadow-lg rounded-full w-10 h-10 flex items-center justify-center text-[#066ac9] dark:text-[#066ac9] hover:bg-[#f5f7f9] dark:hover:bg-gray-600 transition-colors z-10"
          onClick={scrollNext}
          aria-label="Next testimonial"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M8.59 16.59L10 18l6-6-6-6-1.41 1.41L13.17 12z" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default TestimonialsSlider;
