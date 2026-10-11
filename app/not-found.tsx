import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="wrap grid min-h-[60vh] place-items-center py-20 text-center">
      <div>
        <p className="label mb-3">404</p>
        <h1 className="display text-[clamp(2.6rem,7vw,5rem)]">Nothing on record here.</h1>
        <p className="mx-auto mt-4 max-w-[44ch] text-ink-soft">That page does not exist. The three real ones are below.</p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-ink">Rehearse a stage</Link>
          <Link href="/today" className="btn">Today&rsquo;s brief</Link>
          <Link href="/receipt" className="btn">Verify a receipt</Link>
        </div>
      </div>
    </div>
  );
}
