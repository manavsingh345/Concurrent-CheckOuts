import { auth, currentUser } from "@clerk/nextjs/server";

import { prisma } from "@/lib/prisma";
import { AppError } from "@/lib/http";

function getPrimaryEmail(user: NonNullable<Awaited<ReturnType<typeof currentUser>>>) {
  return (
    user.emailAddresses.find(
      (emailAddress) => emailAddress.id === user.primaryEmailAddressId,
    )?.emailAddress ?? user.emailAddresses[0]?.emailAddress
  );
}

export async function requireAppUser() {
  const { userId } = await auth();

  if (!userId) {
    throw new AppError(401, "Sign in to reserve inventory.", "UNAUTHORIZED");
  }

  const existing = await prisma.user.findUnique({
    where: {
      clerkUserId: userId,
    },
  });

  if (existing) {
    return existing;
  }

  const clerkUser = await currentUser();

  if (!clerkUser) {
    throw new AppError(401, "Sign in to continue.", "UNAUTHORIZED");
  }

  const email = getPrimaryEmail(clerkUser);

  if (!email) {
    throw new AppError(
      400,
      "Your account is missing an email address.",
      "MISSING_EMAIL",
    );
  }

  return prisma.user.upsert({
    where: {
      clerkUserId: userId,
    },
    update: {
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    },
    create: {
      clerkUserId: userId,
      email,
      firstName: clerkUser.firstName,
      lastName: clerkUser.lastName,
      imageUrl: clerkUser.imageUrl,
    },
  });
}

