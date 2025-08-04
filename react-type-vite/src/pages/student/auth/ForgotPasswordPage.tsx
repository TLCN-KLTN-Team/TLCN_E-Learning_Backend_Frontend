import AuthLayout from "@/components/student/auth/AuthLayout";

const ForgotPasswordPage = () => {
  return (
    <AuthLayout
      title="Quên mật khẩu"
      subtitle="Nhập email của bạn để đặt lại mật khẩu."
    >
      <form className="space-y-6">
        <div className="space-y-2">
          <label
            htmlFor="email"
            className="block text-sm font-medium text-black"
          >
            Email <span>*</span>
          </label>
          <input
            type="email"
            id="email"
            name="email"
            required
            className="
              w-full px-4 py-3 
              bg-background border border-border rounded-lg
              text-foreground placeholder:text-muted-foreground
              focus:outline-none focus:ring-2 focus:ring-bs-primary/20 focus:border-bs-primary
              transition-all duration-200
              text-black
            "
            placeholder="Nhập địa chỉ email của bạn"
          />
        </div>

        <button
          type="submit"
          className="
            w-full px-6 py-3 
            bg-bs-primary text-white font-medium rounded-lg
            hover:bg-bs-primary-dark focus:outline-none focus:ring-2 focus:ring-bs-primary/20
            transition-all duration-200
            no-hover-effect
          "
        >
          Đặt lại mật khẩu
        </button>

        <div className="text-center">
          <a
            href="/login"
            className="
              text-sm text-bs-primary hover:text-bs-primary-dark 
              transition-colors duration-200 no-hover-effect
            "
          >
            Quay lại đăng nhập
          </a>
        </div>
      </form>
    </AuthLayout>
  );
};

export default ForgotPasswordPage;
