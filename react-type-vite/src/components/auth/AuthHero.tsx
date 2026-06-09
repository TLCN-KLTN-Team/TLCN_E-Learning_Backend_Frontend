import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, Star, Users } from "lucide-react";

import welcome from "../../assets/images/element/02.svg";
import ava1 from "../../assets/images/avatar/01.jpg";
import ava2 from "../../assets/images/avatar/02.jpg";
import ava3 from "../../assets/images/avatar/03.jpg";
import ava4 from "../../assets/images/avatar/04.jpg";

const avatars = [ava1, ava2, ava3, ava4];

// Các từ xoay vòng trong tiêu đề
const rotatingWords = ["kiến thức", "kỹ năng", "đam mê", "tương lai"];

const AuthHero = () => {
  const [wordIndex, setWordIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => {
      setWordIndex((prev) => (prev + 1) % rotatingWords.length);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden rounded-3xl bg-slate-50 ring-1 ring-slate-200/70 ml-4">
      {/* Lớp nền trang trí: các khối mờ chuyển động nhẹ */}
      <motion.div
        aria-hidden
        className="absolute -top-24 -left-16 h-72 w-72 rounded-full bg-blue-200/40 blur-3xl"
        animate={{ y: [0, 24, 0], x: [0, 16, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden
        className="absolute bottom-[-6rem] right-[-4rem] h-80 w-80 rounded-full bg-indigo-200/40 blur-3xl"
        animate={{ y: [0, -28, 0], x: [0, -18, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Lưới chấm mờ tạo chiều sâu */}
      <div
        aria-hidden
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(148 163 184 / 0.25) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />

      <div className="relative z-10 flex flex-col justify-between w-full p-10 xl:p-12">
        {/* Khối chữ động phía trên */}
        <div className="space-y-5">
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-blue-700 ring-1 ring-blue-100 shadow-sm"
          >
            <GraduationCap className="h-4 w-4" />
            Nền tảng học tập trực tuyến
          </motion.div>

          <h1 className="text-4xl xl:text-[2.75rem] font-bold leading-tight text-slate-800">
            {"Khơi nguồn".split(" ").map((word, i) => (
              <motion.span
                key={word}
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 + i * 0.12, duration: 0.5 }}
                className="inline-block mr-2"
              >
                {word}
              </motion.span>
            ))}
            <br />
            {/* Từ xoay vòng */}
            <span className="relative inline-flex h-[1.2em] overflow-hidden align-bottom">
              <AnimatePresence mode="wait">
                <motion.span
                  key={rotatingWords[wordIndex]}
                  initial={{ y: "100%", opacity: 0 }}
                  animate={{ y: "0%", opacity: 1 }}
                  exit={{ y: "-100%", opacity: 0 }}
                  transition={{ duration: 0.45, ease: "easeInOut" }}
                  className="text-blue-600"
                >
                  {rotatingWords[wordIndex]}
                </motion.span>
              </AnimatePresence>
            </span>{" "}
            <span className="text-slate-800">mỗi ngày</span>
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6, duration: 0.6 }}
            className="max-w-sm text-base text-slate-500"
          >
            Học cùng OpenEdu — nơi hàng nghìn học viên cùng nhau chinh phục
            những điều mới mỗi ngày.
          </motion.p>
        </div>

        {/* Ảnh minh hoạ động + thẻ nổi */}
        <div className="relative my-4 flex items-center justify-center">
          <motion.img
            src={welcome}
            alt="Học tập cùng OpenEdu"
            className="w-full max-w-sm object-contain drop-shadow-xl"
            animate={{ y: [0, -12, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          />

          {/* Thẻ đánh giá nổi */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
            transition={{
              opacity: { delay: 0.8, duration: 0.4 },
              scale: { delay: 0.8, duration: 0.4 },
              y: { duration: 4, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute top-2 left-0 flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-lg ring-1 ring-slate-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-800">4.9 / 5</p>
              <p className="text-[11px] text-slate-400">Đánh giá học viên</p>
            </div>
          </motion.div>

          {/* Thẻ số lượng học viên nổi */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1, y: [0, 10, 0] }}
            transition={{
              opacity: { delay: 1, duration: 0.4 },
              scale: { delay: 1, duration: 0.4 },
              y: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
            }}
            className="absolute bottom-2 right-0 flex items-center gap-2 rounded-2xl bg-white px-3.5 py-2.5 shadow-lg ring-1 ring-slate-100"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
              <Users className="h-5 w-5 text-blue-600" />
            </span>
            <div className="leading-tight">
              <p className="text-sm font-bold text-slate-800">4.000+</p>
              <p className="text-[11px] text-slate-400">Học viên</p>
            </div>
          </motion.div>
        </div>

        {/* Avatars phía dưới */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1, duration: 0.5 }}
          className="flex items-center gap-3"
        >
          <div className="flex -space-x-3">
            {avatars.map((src, i) => (
              <motion.img
                key={src}
                src={src}
                alt={`Học viên ${i + 1}`}
                className="h-10 w-10 rounded-full border-2 border-white shadow-sm object-cover"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.2 + i * 0.1, duration: 0.35 }}
              />
            ))}
          </div>
          <p className="text-sm text-slate-500">
            Hơn{" "}
            <span className="font-semibold text-slate-700">4.000+ sinh viên</span>{" "}
            đã tham gia
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default AuthHero;
