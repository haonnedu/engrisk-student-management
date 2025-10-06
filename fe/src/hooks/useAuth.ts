import { useMutation } from "@tanstack/react-query";
import api from "@/lib/api";
import type { LoginDto, RegisterDto, LoginResponse } from "@/types";

export function useLogin() {
  return useMutation({
    mutationFn: async (data: LoginDto): Promise<LoginResponse> => {
      const response = await api.post("/auth/login", data);
      return response.data;
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: async (data: RegisterDto): Promise<LoginResponse> => {
      const response = await api.post("/auth/register", data);
      return response.data;
    },
  });
}
