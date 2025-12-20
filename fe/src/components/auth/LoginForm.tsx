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
import { useAuth } from "@/contexts/AuthContext";

const loginSchema = z.object({
  emailOrPhone: z.string().min(1, "Required"),
  password: z.string().min(1, "Required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export function LoginForm() {
  const { login } = useAuth();
  const loginMutation = useLogin();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: "",
      password: "",
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    try {
      const data = await loginMutation.mutateAsync(values);
      
      // Use AuthContext login to save user data
      login(data.user, data.access_token);
      
      toast.success("Login successful!");
      
      // Redirect based on user role
      let redirectUrl = "/dashboard";
      if (data.user.role === "STUDENT") {
        redirectUrl = "/parent/grades";
      } else if (data.user.role === "TEACHER") {
        redirectUrl = "/teacher/dashboard";
      }
      
      // Use window.location for full page reload to ensure auth state is refreshed
      window.location.href = redirectUrl;
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Login failed");
    }
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
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
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
                  autoComplete="username"
                  {...register("emailOrPhone")}
                  disabled={loginMutation.isPending || isSubmitting}
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
                  autoComplete="current-password"
                  {...register("password")}
                  disabled={loginMutation.isPending || isSubmitting}
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
                disabled={loginMutation.isPending || isSubmitting}
              >
                {loginMutation.isPending || isSubmitting ? "Signing in..." : "Sign in"}
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
