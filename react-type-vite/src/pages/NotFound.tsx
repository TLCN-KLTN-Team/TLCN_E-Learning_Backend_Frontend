import Footer from "@/components/student/home/Footer";
import Header from "@/components/student/home/Header";
import error404 from "../assets/images/element/error404-01.svg";
import { NavLink } from "react-router-dom";

const NotFound = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex flex-col items-center justify-center min-h-screen px-4">
        <section className="pt-5">
          <div className="text-center">
            <img src={error404} alt="Not found image" />
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mt-12 mb-2 text-red-700">
              404 - Not Found
            </h1>
            <h2 className="text-2xl md:text-3xl lg:text-4xl text-black font-bold mt-4">
              Oh no! Something went wrong.
            </h2>
            <p className="text-muted-foreground mt-4 mb-8">
              Either the went wrong or the page you are looking for does not
              exist.
            </p>
            <NavLink
              to="/"
              className="mt-12 bg-bs-primary text-white px-6 py-3 rounded-lg font-medium hover:bg-bs-primary-dark transition-colors"
            >
              Go to Home
            </NavLink>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default NotFound;
