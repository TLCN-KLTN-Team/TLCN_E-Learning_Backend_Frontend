import { useEffect, useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { MapPin, Star, Check, ChevronLeft, ChevronRight } from "lucide-react";

interface College {
  id: string;
  name: string;
  image: string;
  logo: string;
  location: string;
  admissionStatus: "open" | "closed";
  type: "Private" | "Public";
  rating: number;
  programs: string[];
  facilities: string[];
}

interface EducationalUnitLinkedProps {
  colleges?: College[];
}

const defaultColleges: College[] = [
  {
    id: "1",
    name: "American Century University, New Mexico",
    image: "/src/assets/images/university/02.jpg",
    logo: "/src/assets/images/client/uni-logo-01.svg",
    location: "4502 Colonial Drive Anderson, IN",
    admissionStatus: "closed",
    type: "Private",
    rating: 4.5,
    programs: ["BSC", "BBA", "Engineer", "BCA", "MBBS"],
    facilities: ["Canteen", "Stationary", "Hostel", "Library", "Playground"],
  },
  {
    id: "2",
    name: "Indiana College of - Bloomington",
    image: "/src/assets/images/university/04.jpg",
    logo: "/src/assets/images/client/uni-logo-03.svg",
    location: "Bloomington, IN",
    admissionStatus: "open",
    type: "Public",
    rating: 4.5,
    programs: ["MBBS", "Engineer", "BBA", "BCA", "BSC"],
    facilities: ["Playground", "Library", "Canteen", "Stationary", "Hostel"],
  },
  {
    id: "3",
    name: "College of South Florida",
    image: "/src/assets/images/university/01.jpg",
    logo: "/src/assets/images/client/uni-logo-02.svg",
    location: "4653 Linda Street Newark, PA",
    admissionStatus: "open",
    type: "Private",
    rating: 4.0,
    programs: ["BBA", "BCA", "BSC", "Engineer"],
    facilities: [
      "Gym",
      "Stationary",
      "Playground",
      "Canteen",
      "Library",
      "Hostel",
    ],
  },
  {
    id: "4",
    name: "Anderson Campus",
    image: "/src/assets/images/university/03.jpg",
    logo: "/src/assets/images/client/uni-logo-01.svg",
    location: "4502 Colonial Drive Anderson, IN",
    admissionStatus: "closed",
    type: "Public",
    rating: 4.5,
    programs: ["Engineer", "BBA", "BCA", "BSC", "MBBS"],
    facilities: ["Library", "Canteen", "Stationary", "Hostel", "Playground"],
  },
];

const EducationalUnitLinked = ({
  colleges = defaultColleges,
}: EducationalUnitLinkedProps) => {
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

  useEffect(() => {
    if (emblaApi) {
      console.log("Educational Units carousel initialized");
    }
  }, [emblaApi]);

  const renderStars = (rating: number) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    for (let i = 0; i < fullStars; i++) {
      stars.push(
        <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
      );
    }

    if (hasHalfStar) {
      stars.push(
        <div key="half" className="relative w-3 h-3">
          <Star className="w-3 h-3 text-yellow-400" />
          <div className="absolute inset-0 overflow-hidden w-1/2">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          </div>
        </div>
      );
    }

    const remainingStars = 5 - Math.ceil(rating);
    for (let i = 0; i < remainingStars; i++) {
      stars.push(
        <Star key={`empty-${i}`} className="w-3 h-3 text-yellow-400" />
      );
    }

    return stars;
  };

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
            <div className="flex">
              {colleges.map((college) => (
                <div
                  key={college.id}
                  className="flex-[0_0_100%] md:flex-[0_0_50%] lg:flex-[0_0_33.333%] px-3"
                >
                  <div className="bg-card border rounded-lg mb-4 bg-transparent h-full">
                    {/* Card image */}
                    <img
                      className="w-full h-48 object-cover rounded-t-lg"
                      src={college.image}
                      alt="College image"
                    />

                    {/* Card body */}
                    <div className="p-6">
                      <div className="flex justify-between items-center -mt-12 mb-6 relative z-10">
                        {/* Logo image */}
                        <div className="bg-white p-2 rounded-lg shadow-md">
                          <img
                            className="rounded h-15 w-15"
                            src={college.logo}
                            alt="university logo"
                          />
                        </div>
                        {/* Badge */}
                        <div className="text-lg font-medium">
                          <span
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                              college.admissionStatus === "open"
                                ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                            }`}
                          >
                            {college.admissionStatus === "open"
                              ? "Admission Open"
                              : "Admission Closed"}
                          </span>
                        </div>
                      </div>

                      {/* Badge and rating */}
                      <div className="flex justify-between mb-6">
                        {/* Type Badge */}
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300">
                          {college.type}
                        </span>
                        {/* Rating stars */}
                        <div className="flex items-center space-x-1">
                          <div className="flex items-center">
                            {renderStars(college.rating)}
                          </div>
                          <span className="text-sm font-light text-muted-foreground ml-2">
                            ({college.rating})
                          </span>
                        </div>
                      </div>

                      {/* Title */}
                      <h5 className="text-lg font-semibold text-foreground mb-6">
                        <a
                          href="#"
                          className="hover:text-primary transition-colors"
                        >
                          {college.name}
                        </a>
                      </h5>

                      <p className="mb-6 text-muted-foreground flex items-center">
                        <MapPin className="w-4 h-4 mr-2" />
                        {college.location}
                      </p>

                      {/* Programs */}
                      <div className="flex flex-wrap gap-2 mb-6">
                        {college.programs.map((program, index) => (
                          <span
                            key={index}
                            className="text-sm font-light text-muted-foreground"
                          >
                            {program}
                            {index < college.programs.length - 1 && (
                              <span className="mx-2">•</span>
                            )}
                          </span>
                        ))}
                      </div>

                      {/* Facilities */}
                      <div className="grid grid-cols-2 gap-4 mb-6">
                        <div>
                          <ul className="space-y-2">
                            {college.facilities
                              .slice(
                                0,
                                Math.ceil(college.facilities.length / 2)
                              )
                              .map((facility, index) => (
                                <li
                                  key={index}
                                  className="flex items-center text-sm text-muted-foreground"
                                >
                                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                  {facility}
                                </li>
                              ))}
                          </ul>
                        </div>
                        <div>
                          <ul className="space-y-2">
                            {college.facilities
                              .slice(Math.ceil(college.facilities.length / 2))
                              .map((facility, index) => (
                                <li
                                  key={index}
                                  className="flex items-center text-sm text-muted-foreground"
                                >
                                  <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                                  {facility}
                                </li>
                              ))}
                          </ul>
                        </div>
                      </div>

                      {/* Button */}
                      <div className="mt-6">
                        <a
                          href="#"
                          className="inline-flex items-center px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors text-sm font-medium"
                        >
                          View more
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Navigation buttons */}
          <button
            className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 bg-card shadow-bs rounded-full w-10 h-10 flex items-center justify-center text-bs-primary hover:bg-muted transition-colors z-10"
            onClick={scrollPrev}
            aria-label="Previous college"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <button
            className="absolute right-0 top-1/2 transform -translate-y-1/2 translate-x-4 bg-card shadow-bs rounded-full w-10 h-10 flex items-center justify-center text-bs-primary hover:bg-muted transition-colors z-10"
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
