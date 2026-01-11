import Navbar from './components/Navbar';
import Hero from './components/sections/Hero';
import TrustFoundation from './components/sections/TrustFoundation';
import About from './components/sections/About';
import Features from './components/sections/Features';
import HowItWorks from './components/sections/HowItWorks';
import FAQ from './components/sections/FAQ';
import Trust from './components/sections/Trust';
import CTA from './components/sections/CTA';
import Footer from './components/sections/Footer';

export default function Home() {
  return (
    <main className="w-full bg-black">
      <Navbar />
      <Hero />
      <TrustFoundation />
      <About />
      <Features />
      <HowItWorks />
      <FAQ />
      <Trust />
      <CTA />
      <Footer />
    </main>
  );
}
