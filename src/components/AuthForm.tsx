import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { Loader2, Scissors, ShieldCheck } from "lucide-react";
import { AppHeader } from "@/components/AppHeader";

interface AuthFormProps {
  adminMode?: boolean;
}

export function AuthForm({ adminMode = false }: AuthFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { signIn, signUp, signInWithGoogle } = useAuth();

  const handleSubmit = async (action: "signin" | "signup") => {
    if (!email || !password) return;
    setIsSubmitting(true);
    try {
      if (action === "signin") await signIn(email, password);
      else await signUp(email, password);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogle = async () => {
    setIsSubmitting(true);
    try {
      await signInWithGoogle(
        window.location.origin + (adminMode ? "/admin" : "/dashboard")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader title={adminMode ? "Admin Login" : "Salon Owner Login"} backTo="/" />
      <div className="flex items-center justify-center p-4 pt-12">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-primary/10 rounded-full">
                {adminMode ? (
                  <ShieldCheck className="w-8 h-8 text-primary" />
                ) : (
                  <Scissors className="w-8 h-8 text-primary" />
                )}
              </div>
            </div>
            <CardTitle className="text-2xl">
              {adminMode ? "Admin Console" : "Salon Owner Portal"}
            </CardTitle>
            <CardDescription>
              {adminMode
                ? "Restricted — sign in with an admin account to review salons."
                : "Sign in or register your salon. New salons need admin approval before going live."}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              type="button"
              variant="outline"
              className="w-full mb-4"
              onClick={handleGoogle}
              disabled={isSubmitting}
            >
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.83z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
              Continue with Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">or email</span>
              </div>
            </div>

            <Tabs defaultValue="signin" className="w-full">
              <TabsList className={`grid w-full ${adminMode ? "grid-cols-1" : "grid-cols-2"}`}>
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                {!adminMode && <TabsTrigger value="signup">Register</TabsTrigger>}
              </TabsList>
              <TabsContent value="signin" className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="signin-email">Email</Label>
                  <Input id="signin-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signin-password">Password</Label>
                  <Input id="signin-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
                </div>
                <Button className="w-full" onClick={() => handleSubmit("signin")} disabled={isSubmitting || !email || !password}>
                  {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Signing in...</> : "Sign In"}
                </Button>
              </TabsContent>
              {!adminMode && (
                <TabsContent value="signup" className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input id="signup-password" type="password" placeholder="Min 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} disabled={isSubmitting} />
                  </div>
                  <Button className="w-full" onClick={() => handleSubmit("signup")} disabled={isSubmitting || !email || password.length < 6}>
                    {isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Creating account...</> : "Create Owner Account"}
                  </Button>
                </TabsContent>
              )}
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
