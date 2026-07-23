/* eslint-disable @next/next/no-img-element */
/**
 * VESTRIPPN brand mark — the logo asset at public/vestrippn-3.png.
 * Plain <img> (not next/image) so it works in a fully static deploy without an
 * image optimizer. The PNG has transparent padding, so object-contain sizes it
 * cleanly on both light and dark headers.
 */
export function BrandMark({ className = "h-10 w-10" }: { className?: string }) {
  return <img src="/vestrippn-3.png" alt="VESTRIPPN" className={`${className} object-contain`} />;
}
