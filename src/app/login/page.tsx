import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = {
  title: "Authentication — VIRA",
  description: "Sign in or create your VIRA account to organize your academic and daily life.",
};

export default function LoginPage() {
  return <AuthShell initialMode="signin" />;
}
