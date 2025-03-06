import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-3xl font-bold">Next.js S3 Storage</h1>
      <Link href="/upload">
        <Button className="mt-4">Upload File</Button>
      </Link>
    </main>
  );
}
