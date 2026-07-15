import { GravatarService } from '../../gravatar/gravatar.service';

const gravatarService = new GravatarService();

export function resolveProfileImageFromEmail(email: string): string {
  return gravatarService.getGravatarUrl(email.trim().toLowerCase());
}

export function applySignupProfileImage<
  T extends { email?: string; image?: string | null },
>(user: T): T {
  if (user.image?.trim()) {
    return user;
  }

  const email = user.email?.trim();
  if (!email) {
    return user;
  }

  return {
    ...user,
    image: resolveProfileImageFromEmail(email),
  };
}
