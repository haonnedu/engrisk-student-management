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
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md">
        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="space-y-1 pb-8">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-black rounded-full flex items-center justify-center">
                <span className="text-white text-2xl font-bold">E</span>
              </div>
            </div>
            <CardTitle className="text-2xl font-bold text-center text-gray-900">
              Welcome Back
            </CardTitle>
            <CardDescription className="text-center text-gray-600">
              Sign in to your EngRisk Student Management account
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
                <Label
                  htmlFor="emailOrPhone"
                  className="text-sm font-medium text-gray-700"
                >
                  Email or Phone
                </Label>
                <Input
                  id="emailOrPhone"
                  type="text"
                  placeholder="admin@example.com or +84123456789"
                  {...register("emailOrPhone")}
                  disabled={loginMutation.isPending}
                  className="h-11 border-gray-300 focus:border-black focus:ring-black"
                />
                {errors.emailOrPhone && (
                  <p className="text-sm text-red-500">
                    {errors.emailOrPhone.message}
                  </p>
                )}
              </div>
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700"
                >
                  Password
                </Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  {...register("password")}
                  disabled={loginMutation.isPending}
                  className="h-11 border-gray-300 focus:border-black focus:ring-black"
                />
                {errors.password && (
                  <p className="text-sm text-red-500">
                    {errors.password.message}
                  </p>
                )}
              </div>
              <Button
                type="submit"
                className="w-full h-11 bg-black hover:bg-gray-800 text-white font-medium"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? "Signing in..." : "Sign in"}
              </Button>
            </form>
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>EngRisk Student Management System</p>
              <p className="text-xs mt-1">
                Use your registered email/phone and password
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
