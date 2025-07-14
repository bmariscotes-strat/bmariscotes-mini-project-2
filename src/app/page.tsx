"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Button from "@/components/ui/Button";
import Image from "next/image";
import Link from "next/link";

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/write");
  };

  return (
    <div className="h-screen flex flex-col background overflow-hidden">
      <Header />
      {/* Main Content */}
      <main className="flex-1 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
        <div className="max-w-7xl mx-auto w-full">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-center h-full">
            {/* Left Side - Illustration Area */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Background Circle */}
                <Image
                  src="/vectors/hand-writing.gif"
                  alt="Logo"
                  width={500}
                  height={500}
                  className="lg:w-[600px] lg:h-[600px]"
                />
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="text-center lg:text-center">
              <h1 className="baskervville text-4xl sm:text-5xl lg:text-7xl xl:text-8xl font-bold text-primary mb-4 lg:mb-6 animate-fade-in">
                Wryte.
              </h1>

              <p className="text-lg sm:text-xl geist font-medium tracking-wide mb-6 lg:mb-8 max-w-md mx-auto text-center leading-relaxed">
                The pen&apos;s yours. Leave your mark.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-center">
                {/* Primary CTA Button - Accent filled */}
                <Link href="/sign-up">
                  <Button
                    variant="accent"
                    style="filled"
                    size="lg"
                    onClick={handleGetStarted}
                    className="geist font-semibold tracking-wide"
                  >
                    Begin your first Wryte
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
