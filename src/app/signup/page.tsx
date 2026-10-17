import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = {
  title: "Create Account — VIRA",
  description: "Create your VIRA account to organize your academic coursework, deadlines, and habits.",
};

export default function SignUpPage() {
  return <AuthShell initialMode="signup" />;
}
