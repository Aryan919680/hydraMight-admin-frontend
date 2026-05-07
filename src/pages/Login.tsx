import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Lock, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast({ title: "Missing credentials", description: "Enter email and password to continue." });
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast({ title: "Welcome back", description: "Signed in successfully." });
      navigate("/");
    }, 600);
  };

  return (
    <div className="relative grid min-h-screen w-full lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-gradient-to-br from-primary via-primary/80 to-primary/40 lg:flex">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,hsl(var(--primary-foreground)/0.15),transparent_60%)]" />
        <div className="relative z-10 flex flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <ShieldCheck className="h-6 w-6" />
            Admin Console
          </div>
          <div className="space-y-4">
            <h1 className="text-4xl font-bold leading-tight">
              Manage your storefront with confidence.
            </h1>
            <p className="max-w-md text-primary-foreground/80">
              Orders, inventory, pricing and people — all in one secure command center.
            </p>
          </div>
          <p className="text-sm text-primary-foreground/70">
            © {new Date().getFullYear()} Commerce CMS. All rights reserved.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center bg-background p-6 sm:p-12">
        <Card className="w-full max-w-md border-border/60 shadow-lg">
          <CardHeader className="space-y-2">
            <CardTitle className="text-2xl">Sign in</CardTitle>
            <CardDescription>
              Use your admin credentials to access the control panel.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@company.com"
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <button type="button" className="text-xs text-primary hover:underline">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox id="remember" />
                <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground">
                  Keep me signed in for 30 days
                </Label>
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-center text-xs text-muted-foreground">
                Protected area. Access is monitored and logged.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}