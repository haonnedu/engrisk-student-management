"use client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useLogin } from "../../hooks/useAuth";
import type { LoginResponse } from "@/types";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Email or phone is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = (values: LoginFormValues): void => {
    loginMutation.mutate(values, {
      onSuccess: (data: LoginResponse) => {
        toast.success("Login successful!");
        localStorage.setItem("token", data.access_token);
        localStorage.setItem("user", JSON.stringify(data.user));
        // Use window.location.href for successful login to ensure proper redirect
        window.location.href = "/";
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.message || "Login failed");
        reset(); // Clear form fields after failed login
      },
    });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sign in
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
            <div className="space-y-2">
              <Label htmlFor="emailOrPhone">Email or Phone</Label>
              <Input
                id="emailOrPhone"
                type="text"
                placeholder="admin@example.com or +84123456789"
                {...register("emailOrPhone")}
                disabled={loginMutation.isPending}
              />
              {errors.emailOrPhone && (
                <p className="text-sm text-red-500">
                  {errors.emailOrPhone.message}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                {...register("password")}
                disabled={loginMutation.isPending}
              />
              {errors.password && (
                <p className="text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
            <Button
              type="submit"
              className="w-full"
              disabled={loginMutation.isPending}
            >
              {loginMutation.isPending ? "Signing in..." : "Sign in"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-gray-600">
            <p>Demo credentials:</p>
            <p className="font-mono text-xs">admin@example.com / password123</p>
            <p className="font-mono text-xs">+84123456789 / password123</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
