import Hero from "@/components/Hero";
import Feed from "@/components/Feed";

export const dynamic = "force-dynamic";

export default function Home() {
  return (
    <>
      <Hero />
      <Feed />
    </>
  );
}
