import dataScienceIcon from "@/assets/images/element/data-science.svg";
import onlineIcon from "@/assets/images/element/online.svg";
import engineeringIcon from "@/assets/images/element/engineering.svg";
import codingIcon from "@/assets/images/element/coding.svg";
import profitIcon from "@/assets/images/element/profit.svg";
import medicalIcon from "@/assets/images/element/medical.svg";
import homeIcon from "@/assets/images/element/home.svg";
import artistIcon from "@/assets/images/element/artist.svg";

const SubjectsSection = () => {
  const subjects = [
    {
      icon: dataScienceIcon,
      title: "Data Science",
      courses: "15 Course",
      color:
        "bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30",
    },
    {
      icon: onlineIcon,
      title: "Computer Science",
      courses: "22 Course",
      color:
        "bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30",
    },
    {
      icon: engineeringIcon,
      title: "Engineering",
      courses: "53 Course",
      color:
        "bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30",
    },
    {
      icon: codingIcon,
      title: "Web Development",
      courses: "25 Course",
      color:
        "bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30",
    },
    {
      icon: profitIcon,
      title: "Marketing",
      courses: "20 Course",
      color:
        "bg-pink-50 dark:bg-pink-900/20 hover:bg-pink-100 dark:hover:bg-pink-900/30",
    },
    {
      icon: medicalIcon,
      title: "Medical",
      courses: "10 Course",
      color:
        "bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30",
    },
    {
      icon: homeIcon,
      title: "Architecture",
      courses: "30 Course",
      color:
        "bg-indigo-50 dark:bg-indigo-900/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/30",
    },
    {
      icon: artistIcon,
      title: "Art & Design",
      courses: "35 Course",
      color:
        "bg-yellow-50 dark:bg-yellow-900/20 hover:bg-yellow-100 dark:hover:bg-yellow-900/30",
    },
  ];

  return (
    <section className="py-12 lg:py-16 px-6 lg:px-8 bg-white dark:bg-[#1a1f23]">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-[#24292d] dark:text-white mb-4">
            Top Listed{" "}
            <span className="text-[#066ac9] dark:text-[#066ac9]">Subjects</span>
          </h2>
          <p className="text-base text-[#747579] dark:text-gray-300 max-w-2xl mx-auto">
            Perceived end knowledge certainly day sweetness why cordially
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
          {subjects.map((subject, index) => (
            <div
              key={index}
              className={`${subject.color} rounded-xl p-5 text-center hover:shadow-lg transition-all duration-300 hover:-translate-y-2 group cursor-pointer border border-gray-100 dark:border-gray-700`}
            >
              <div className="w-14 h-14 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3 shadow-md group-hover:shadow-lg transition-shadow duration-300">
                <img
                  src={subject.icon}
                  alt={subject.title}
                  className="w-7 h-7"
                />
              </div>
              <h5 className="text-base font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                {subject.title}
              </h5>
              <span className="text-sm text-gray-600 dark:text-gray-300 font-medium">
                {subject.courses}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SubjectsSection;
