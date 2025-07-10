"use client";

import { useRouter } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import Button from "@/components/ui/Button";
import Image from "next/image";

export default function LandingPage() {
  const router = useRouter();

  const handleGetStarted = () => {
    router.push("/write");
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header />

      {/* Main Content */}
      <main className="px-4 py-12 sm:px-6 lg:px-8 flex-1 border-gray-300 border">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            {/* Left Side - Illustration Area */}
            <div className="flex justify-center lg:justify-end">
              <div className="relative">
                {/* Background Circle */}
                <Image
                  src="/vectors/hand-writing.gif"
                  alt="Logo"
                  width={600}
                  height={600}
                />
              </div>
            </div>

            {/* Right Side - Content */}
            <div className="text-center lg:text-center">
              <h1 className="text-5xl sm:text-6xl lg:text-8xl font-bold text-primary mb-6 animate-fade-in">
                Wryte.
              </h1>

              <p className="text-xl sm:text-2xl geist font-medium tracking-wide mb-8 max-w-md mx-auto  text-center leading-relaxed">
                The pen&apos;s yours. Leave your mark.
              </p>

              <div className="flex flex-col sm:flex-row gap-4 pt-2 justify-center lg:justify-center">
                {/* Primary CTA Button - Accent filled */}
                <Button
                  variant="accent"
                  style="filled"
                  size="lg"
                  onClick={handleGetStarted}
                  className="geist font-bold tracking-wide"
                >
                  Begin your first Wryte
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
