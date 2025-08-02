import React, { useState } from "react";
import { useAuth } from "../../context/auth-context";
import { useErrorHandler } from "../../hooks/useErrorHandler";
import { ErrorDisplay } from "../ui/ErrorDisplay";
import { Button } from "../ui/button";
import { Input } from "../ui/input";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, isLoading } = useAuth();
  const { error, errors, handleError, clearErrors } = useErrorHandler();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    try {
      await login(email, password);
      // Login thành công - có thể redirect hoặc thông báo
    } catch (error) {
      handleError(error);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-md mx-auto">
      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="mt-1"
          disabled={isLoading}
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="block text-sm font-medium text-gray-700"
        >
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="mt-1"
          disabled={isLoading}
        />
      </div>

      <ErrorDisplay error={error} errors={errors} />

      <Button type="submit" disabled={isLoading} className="w-full">
        {isLoading ? "Logging in..." : "Login"}
      </Button>
    </form>
  );
};
