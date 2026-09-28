import Image from "next/image";
import Link from "next/link";

interface AuthPageProps {
  title: string;
  image: string;
  alternateText: string;
  alternateLink: string;
  alternateHref: string;
  children: React.ReactNode;
}

/**
 * Show the shared layout for public auth pages.
 * @param props - Page content and link to the other auth page.
 * @returns A responsive page with a decorative image.
 */
export function AuthPage({
  title,
  image,
  alternateText,
  alternateLink,
  alternateHref,
  children,
}: AuthPageProps) {
  return (
    <main className="grid min-h-screen lg:grid-cols-[39%_61%]">
      <section className="flex min-h-screen flex-col bg-background px-6 py-10 sm:px-10 lg:px-8 lg:py-20">
        <Link href="/" aria-label="Abricot, accueil" className="mx-auto block">
          <Image
            src="/abricot-logo.svg"
            alt=""
            width={250}
            height={34}
            priority
          />
        </Link>

        <div className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center py-12">
          <h1 className="mb-7 text-center font-heading text-4xl font-semibold text-link">
            {title}
          </h1>
          {children}
        </div>

        <p className="text-center text-sm">
          {alternateText}{" "}
          <Link
            href={alternateHref}
            className="font-medium text-link underline underline-offset-4 focus-visible:rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-link"
          >
            {alternateLink}
          </Link>
        </p>
      </section>
      <div className="relative hidden lg:block" aria-hidden="true">
        <Image src={image} alt="" fill sizes="61vw" className="object-cover" />
      </div>
    </main>
  );
}
