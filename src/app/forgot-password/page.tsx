import { AuthShell } from "@/components/auth/AuthShell";

export const metadata = {
  title: "Reset Password — VIRA",
  description: "Reset your VIRA account password.",
};

export default function ForgotPasswordPage() {
  return <AuthShell initialMode="forgot" />;
}
