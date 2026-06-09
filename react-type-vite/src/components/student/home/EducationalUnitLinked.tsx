import { useCallback } from "react";
import { useNavigate } from "react-router-dom";
import useEmblaCarousel from "embla-carousel-react";
import { MapPin, ChevronLeft, ChevronRight } from "lucide-react";
import type { EducationalUnitCardResponse } from "@/types/educational-unit.types";

interface EducationalUnitLinkedProps {
  educationalUnits?: EducationalUnitCardResponse[];
  loading?: boolean;
}

const EducationalUnitLinked = ({
  educationalUnits = [],
  loading = false,
}: EducationalUnitLinkedProps) => {
  const navigate = useNavigate();
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    breakpoints: {
      "(min-width: 768px)": { slidesToScroll: 2 },
      "(min-width: 1024px)": { slidesToScroll: 3 },
    },
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <section className="px-12 lg:px-16">
      <div className="container mx-auto px-4 lg:px-8">
        {/* Title */}
        <div className="row mb-12">
          <div className="lg:w-2/3 mx-auto text-center">
            <h2 className="text-3xl font-bold text-foreground mb-4">
              Các đơn vị liên kết giáo dục
            </h2>
            <p className="text-muted-foreground mb-0">
              Việc cảm nhận rõ ràng kiến thức cuối cùng chắc chắn mang lại sự
              ngọt ngào trong ngày – vì sao ư? Vì đó là sự chân thành.
            </p>
          </div>
        </div>

        <div className="relative px-6 lg:px-8">
          {/* Carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            {loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="flex">
                {educationalUnits.map((unit) => (
                  <div
                    key={unit.id}
                    className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] px-3"
                  >
                    <div className="bg-card border border-border rounded-xl mb-4 h-full flex flex-col overflow-hidden shadow-sm hover:shadow-md hover:border-primary/30 transition-all duration-300">
                      {/* Branded banner */}
                      <div className="relative w-full h-24 bg-gradient-to-br from-primary via-primary to-secondary-foreground" />

                      {/* Card body */}
                      <div className="px-6 pb-6 flex-1 flex flex-col">
                        {/* Logo image with fixed size */}
                        <div className="flex justify-center -mt-10 mb-4 relative z-10">
                          <div className="bg-white p-2 rounded-xl shadow-md ring-1 ring-border w-20 h-20 overflow-hidden">
                            <img
                              className="w-full h-full object-contain"
                              src={unit.logo}
                              alt={`${unit.name} logo`}
                            />
                          </div>
                        </div>

                        {/* Title */}
                        <h5 className="text-lg font-semibold text-foreground mb-3 text-center uppercase">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/educational-units/${unit.id}`)
                            }
                            className="no-hover-effect bg-transparent hover:text-primary hover:underline underline-offset-4 transition-colors"
                          >
                            {unit.name}
                          </button>
                        </h5>

                        {/* Address */}
                        <p className="mb-4 text-muted-foreground flex items-center justify-center text-sm">
                          <MapPin className="w-4 h-4 mr-2 flex-shrink-0" />
                          <span className="line-clamp-2">{unit.address}</span>
                        </p>

                        {/* Type and Established Year */}
                        <div className="mb-4 flex justify-center gap-2 flex-wrap">
                          {unit.type && (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                              {unit.type}
                            </span>
                          )}
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-accent/15 text-accent-foreground border border-accent/30">
                            Thành lập: {unit.establishedYear}
                          </span>
                        </div>

                        {/* Departments */}
                        {unit.departments && unit.departments.length > 0 && (
                          <div className="mb-4">
                            <h6 className="text-sm font-semibold text-foreground mb-2">
                              Khoa/Ngành:
                            </h6>
                            <div className="flex flex-wrap gap-2">
                              {unit.departments
                                .slice(0, 5)
                                .map((dept, index) => (
                                  <span
                                    key={index}
                                    className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20"
                                  >
                                    {dept}
                                  </span>
                                ))}
                              {unit.departments.length > 5 && (
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                                  +{unit.departments.length - 5} khác
                                </span>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Button - Always at bottom */}
                        <div className="mt-auto pt-4">
                          <button
                            onClick={() =>
                              navigate(`/educational-units/${unit.id}`)
                            }
                            className="no-hover-effect inline-flex items-center justify-center w-full px-4 py-2.5 bg-[hsl(var(--primary))] rounded-lg hover:bg-[hsl(172_66%_24%)] hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200 text-sm font-semibold shadow-sm"
                            style={{ color: "white" }}
                          >
                            Xem chi tiết
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation buttons */}
          <button
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-card border border-border shadow-md rounded-full w-10 h-10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors z-10"
            onClick={scrollPrev}
            aria-label="Previous college"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-card border border-border shadow-md rounded-full w-10 h-10 flex items-center justify-center text-primary hover:bg-primary hover:text-primary-foreground transition-colors z-10"
            onClick={scrollNext}
            aria-label="Next college"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};

export default EducationalUnitLinked;
