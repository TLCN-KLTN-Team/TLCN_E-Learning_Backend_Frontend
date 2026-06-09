import { motion } from "framer-motion";

/**
 * Nền trang trí dùng chung cho các trang auth:
 * 2 khối mờ chuyển động chậm + lưới chấm tạo chiều sâu.
 * Đặt phía sau nội dung (absolute, pointer-events-none).
 */
const AuthBackdrop = () => {
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      <motion.div
        className="absolute -top-32 -left-24 h-80 w-80 rounded-full bg-blue-200/40 blur-3xl"
        animate={{ y: [0, 26, 0], x: [0, 18, 0] }}
        transition={{ duration: 13, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute bottom-[-8rem] right-[-6rem] h-96 w-96 rounded-full bg-indigo-200/40 blur-3xl"
        animate={{ y: [0, -30, 0], x: [0, -20, 0] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        className="absolute inset-0 opacity-[0.35]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgb(148 163 184 / 0.25) 1px, transparent 1px)",
          backgroundSize: "22px 22px",
        }}
      />
    </div>
  );
};

export default AuthBackdrop;
