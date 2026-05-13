import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-14">
      <SignUp
        path="/sign-up"
        signInUrl="/sign-in"
        fallbackRedirectUrl="/"
      />
    </main>
  );
}
