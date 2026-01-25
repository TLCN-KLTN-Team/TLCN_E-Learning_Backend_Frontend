import { Outlet } from "react-router-dom";
import Header from "@/components/student/home/Header";
import Footer from "@/components/student/home/Footer";
import BackToTop from "@/components/ui/BackToTop";

const ForumLayout = () => {
    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Header />
            <main className="flex-grow pt-16 lg:pt-20">
                <Outlet />
            </main>
            <Footer />
            <BackToTop />
        </div>
    );
};

export default ForumLayout;
