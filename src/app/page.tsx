import Header from "@/components/HomePage/Header";
import Info from "@/components/HomePage/Info";

export default function Home() {
  return (
    <main className="flex-1 bg-[#f8f7f2] px-5 pt-2 pb-8 sm:px-7 dark:bg-[#132c24]">
      <Header />
      <Info />
    </main>
  );
}
