import { Crown } from "lucide-react";

/**
 * Show the project owner mark above an avatar.
 * Put it in a `relative` parent that also holds the avatar.
 * The icon is decorative: the parent must give the owner role as text.
 */
export function OwnerCrown() {
  return (
    <Crown
      aria-hidden="true"
      className="absolute -top-4 left-1/2 size-3.5 -translate-x-1/2 text-link"
    />
  );
}
