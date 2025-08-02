import { useState } from "react";

interface Subject {
  id: string;
  name: string;
  image: string;
  icon: string;
  description: string;
  courseCount: number;
}

interface SubjectsSectionProps {
  subjects: Subject[];
}

const SubjectsSection = ({ subjects }: SubjectsSectionProps) => {
  const [activeTab, setActiveTab] = useState<string>(subjects[0]?.id || "");

  return (
    <section className="py-16 lg:py-24">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Khám phá chương trình học
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Chọn chuyên ngành phù hợp với đam mê và sở thích của bạn
          </p>
        </div>

        {/* Subject Tabs */}
        <div className="flex flex-wrap justify-center gap-4 mb-12">
          {subjects.map((subject) => (
            <button
              key={subject.id}
              onClick={() => setActiveTab(subject.id)}
              className={`px-6 py-3 rounded-lg font-medium transition-all duration-300 ${
                activeTab === subject.id
                  ? "bg-bs-primary text-white shadow-lg"
                  : "bg-card text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <span className="flex items-center gap-2">
                <img src={subject.icon} alt="" className="w-5 h-5" />
                {subject.name}
              </span>
            </button>
          ))}
        </div>

        {/* Active Subject Content */}
        {subjects
          .filter((subject) => subject.id === activeTab)
          .map((subject) => (
            <div
              key={subject.id}
              className="bg-card rounded-2xl overflow-hidden shadow-lg"
            >
              <div className="grid lg:grid-cols-2 gap-0">
                {/* Content */}
                <div className="p-8 lg:p-12 flex flex-col justify-center">
                  <div className="flex items-center gap-3 mb-6">
                    <img src={subject.icon} alt="" className="w-8 h-8" />
                    <h3 className="text-2xl font-bold text-foreground">
                      {subject.name}
                    </h3>
                  </div>

                  <p className="text-muted-foreground text-lg mb-8 leading-relaxed">
                    {subject.description}
                  </p>

                  <div className="flex items-center gap-6 mb-8">
                    <div className="flex items-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-bs-warning"
                      >
                        <path
                          d="M12 2L3.09 8.26L12 14.5L20.91 8.26L12 2Z"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3.09 15.74L12 22L20.91 15.74"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        <path
                          d="M3.09 8.26L12 14.5L20.91 8.26"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-foreground font-medium">
                        {subject.courseCount} khóa học
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg
                        width="20"
                        height="20"
                        viewBox="0 0 24 24"
                        fill="none"
                        className="text-bs-success"
                      >
                        <path
                          d="M20 6L9 17L4 12"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <span className="text-foreground font-medium">
                        Chứng chí được công nhận
                      </span>
                    </div>
                  </div>

                  <button className="bg-bs-primary text-white px-8 py-3 rounded-lg font-medium hover:bg-bs-primary-dark transition-colors self-start">
                    Khám phá ngay
                  </button>
                </div>

                {/* Image */}
                <div className="relative overflow-hidden">
                  <img
                    src={subject.image}
                    alt={subject.name}
                    className="w-full h-full object-cover min-h-[400px]"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                </div>
              </div>
            </div>
          ))}
      </div>
    </section>
  );
};

export default SubjectsSection;
