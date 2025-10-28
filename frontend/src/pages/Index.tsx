import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GraduationCap, BookOpen, Users, Star } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-4" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto text-center text-white">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-white/10 backdrop-blur-sm">
              <GraduationCap className="w-16 h-16" />
            </div>
          </div>
          <h1 className="text-5xl md:text-6xl font-bold mb-6 animate-fade-in">
            TutorTrack
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-2xl mx-auto opacity-90">
            Connect with peer tutors, track your progress, and excel in your studies
          </p>
          <div className="flex gap-4 justify-center flex-wrap">
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className="bg-white text-primary  hover:bg-white/90 shadow-lg"
            >
              Get Started
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/auth")}
              className="border-white text-primary hover:bg-white/10"
            >
              Sign In
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 bg-background">
        <div className="container mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-12">
            How TutorTrack Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center p-6 rounded-lg bg-card shadow-sm border">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <BookOpen className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Find Tutors</h3>
              <p className="text-muted-foreground">
                Browse through our community of experienced peer tutors and find the perfect match for your subject
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-card shadow-sm border">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Schedule Sessions</h3>
              <p className="text-muted-foreground">
                Request sessions with tutors, manage your schedule, and track your learning progress
              </p>
            </div>
            <div className="text-center p-6 rounded-lg bg-card shadow-sm border">
              <div className="flex justify-center mb-4">
                <div className="p-3 rounded-full bg-primary/10">
                  <Star className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-3">Rate & Review</h3>
              <p className="text-muted-foreground">
                Share feedback after each session to help others find the best tutors
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4" style={{ background: "var(--gradient-hero)" }}>
        <div className="container mx-auto text-center text-white">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            Ready to Excel in Your Studies?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join TutorTrack today and connect with peer tutors who can help you succeed
          </p>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-white text-primary hover:bg-white/90 shadow-lg"
          >
            Join Now
          </Button>
        </div>
      </section>
    </div>
  );
};

export default Index;
