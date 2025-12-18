import dynamic from "next/dynamic";

const LoginForm = dynamic(() => import("@/components/auth/LoginForm").then(mod => ({ default: mod.LoginForm })), {
  ssr: false,
});

export default function LoginPage() {
  return <LoginForm />;
}
