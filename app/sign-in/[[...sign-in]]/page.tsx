import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-6 py-14">
      <SignIn
        path="/sign-in"
        signUpUrl="/sign-up"
        fallbackRedirectUrl="/"
      />
    </main>
  );
}

