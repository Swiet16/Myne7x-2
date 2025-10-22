import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Target, 
  Eye, 
  Heart, 
  Users, 
  Award, 
  Rocket,
  Shield,
  Star,
  TrendingUp,
  Youtube,
  Calendar,
  Lightbulb,
  Code,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect } from 'react';
import { MatrixBackground } from '@/components/MatrixBackground';

const About = () => {
  useEffect(() => {
    // SEO optimization
    document.title = "About Myne Winner & Team Myne7x | Our Journey from 2019 - MYNE7X Store";
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.setAttribute('content', 'Discover the inspiring journey of Myne Winner and Team Myne7x from 2019. Learn about our struggles, hard work, and success story in digital innovation. Visit Myne Winner YouTube channel.');
    }
    const metaKeywords = document.querySelector('meta[name="keywords"]');
    if (metaKeywords) {
      metaKeywords.setAttribute('content', 'myne7x, myne winner, team myne7x, myne winner youtube, myne7x store, digital products, myne7x logo, content creator, entrepreneur journey');
    }
  }, []);

  const timeline = [
    {
      year: "2019",
      title: "The Beginning",
      description: "Myne Winner started with just a laptop and a dream. Working from a small room, facing countless rejections and technical challenges, but never giving up."
    },
    {
      year: "2020",
      title: "First Breakthrough",
      description: "Launched YouTube channel documenting the journey. Despite slow growth and limited resources, the passion for creating quality content kept the fire burning."
    },
    {
      year: "2021",
      title: "Building Team Myne7x",
      description: "Assembled a dedicated team of like-minded individuals who believed in the vision. Many sleepless nights coding, creating, and learning together."
    },
    {
      year: "2022",
      title: "Rapid Growth",
      description: "Hard work started paying off. The community grew, and MYNE7X Store was born to serve thousands of customers with premium digital solutions."
    },
    {
      year: "2023-2024",
      title: "Scaling Success",
      description: "Expanded services, improved platform, and built a loyal customer base. Every challenge overcome made Team Myne7x stronger and more determined."
    },
    {
      year: "2025",
      title: "Vision for Future",
      description: "Continuing to innovate, inspire, and empower. The journey that started in 2019 is now a testament to perseverance, hard work, and unwavering belief."
    }
  ];

  const struggles = [
    {
      icon: Code,
      title: "Technical Challenges",
      description: "Started with limited coding knowledge. Spent countless hours learning, debugging, and building from scratch."
    },
    {
      icon: Users,
      title: "Building Community",
      description: "Growing from zero followers to thousands required consistency, authenticity, and relentless content creation."
    },
    {
      icon: Lightbulb,
      title: "Limited Resources",
      description: "Working with minimal budget and equipment. Every penny invested wisely, every resource maximized."
    },
    {
      icon: Zap,
      title: "Staying Motivated",
      description: "Facing criticism and self-doubt. But the vision of helping others kept the team pushing forward every single day."
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5 }
    }
  };

  return (
    <div className="min-h-screen py-12 sm:py-20 overflow-x-hidden relative">
      {/* Matrix Background */}
      <MatrixBackground />
      
      <div className="container mx-auto px-3 sm:px-4 max-w-7xl relative z-10">
        
        {/* Hero Section with Logo */}
        <motion.div 
          className="text-center mb-12 sm:mb-20"
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <motion.div
            className="mb-6 sm:mb-8 flex justify-center"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
          >
            <img 
              src="https://uqkirciomqdagbnrwcfq.supabase.co/storage/v1/object/public/images/myne7x_logo.png" 
              alt="Myne7x Logo" 
              className="h-16 sm:h-24 md:h-32 object-contain"
            />
          </motion.div>
          <Badge className="mb-4 sm:mb-6 bg-primary/20 text-primary border-primary/50 pulse-neon text-xs sm:text-sm">
            About Myne Winner & Team Myne7x
          </Badge>
          <h1 className="text-3xl sm:text-5xl md:text-7xl font-orbitron font-black mb-4 sm:mb-6 text-glow px-2">
            Our Journey from 2019
          </h1>
          <p className="text-sm sm:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed px-4">
            From humble beginnings to digital innovation. The story of perseverance, 
            hard work, and an unwavering vision to make a difference.
          </p>
        </motion.div>

        {/* Myne Winner CEO Section */}
        <motion.section 
          className="mb-12 sm:mb-20"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Card className="card-neon overflow-hidden max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
              <motion.div 
                className="relative overflow-hidden order-2 lg:order-1"
                whileHover={{ scale: 1.05 }}
                transition={{ duration: 0.3 }}
              >
                <img
                  src="https://uqkirciomqdagbnrwcfq.supabase.co/storage/v1/object/public/images/ceo-myne-winner.jpg"
                  alt="Myne Winner - Founder & CEO of Myne7x"
                  className="w-full h-full object-cover min-h-[300px] sm:min-h-[400px] lg:min-h-[600px]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 to-transparent"></div>
                <div className="absolute bottom-4 sm:bottom-8 left-4 sm:left-8">
                  <Badge className="bg-gradient-neon text-primary-foreground border-0 text-sm sm:text-lg px-3 py-1 sm:px-4 sm:py-2">
                    Founder & CEO
                  </Badge>
                </div>
              </motion.div>
              <div className="p-6 sm:p-8 lg:p-12 flex flex-col justify-center order-1 lg:order-2">
                <motion.div
                  initial={{ x: 50, opacity: 0 }}
                  whileInView={{ x: 0, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6 }}
                >
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-orbitron font-bold mb-3 sm:mb-4 text-glow">
                    Myne Winner
                  </h2>
                  <p className="text-lg sm:text-xl text-primary mb-4 sm:mb-6">Founder of Team Myne7x</p>
                  <blockquote className="text-sm sm:text-lg text-muted-foreground mb-4 sm:mb-6 leading-relaxed italic border-l-4 border-primary pl-3 sm:pl-4">
                    "Every expert was once a beginner. Every success story started with a struggle. 
                    In 2019, I had nothing but a vision and determination. Today, Team Myne7x 
                    serves thousands because we never stopped believing."
                  </blockquote>
                  <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-4 sm:mb-6">
                    Myne Winner is the visionary founder behind Team Myne7x and MYNE7X Store. 
                    Starting from scratch in 2019 with limited resources but unlimited ambition, 
                    Myne transformed challenges into opportunities. Through consistent content 
                    creation, tireless learning, and unwavering dedication, Myne built not just 
                    a business, but a community.
                  </p>
                  <div className="flex gap-3 sm:gap-4">
                    <Button 
                      className="bg-gradient-neon hover:shadow-neon-lg text-xs sm:text-base h-9 sm:h-11 px-3 sm:px-4"
                      onClick={() => window.open('https://www.youtube.com/@myne.winner', '_blank')}
                    >
                      <Youtube className="mr-1 sm:mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                      Visit YouTube Channel
                    </Button>
                  </div>
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.section>

        {/* Timeline Section */}
        <motion.section 
          className="mb-12 sm:mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="text-center mb-8 sm:mb-12">
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-3 sm:mb-4 text-glow px-2"
              variants={itemVariants}
            >
              The Journey: 2019 to Present
            </motion.h2>
            <motion.p 
              className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4"
              variants={itemVariants}
            >
              Every milestone achieved through blood, sweat, and tears
            </motion.p>
          </div>
          
          <div className="space-y-4 sm:space-y-6 max-w-4xl mx-auto">
            {timeline.map((item, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
              >
                <Card className="card-neon hover:shadow-neon-lg transition-all duration-300">
                  <CardContent className="p-4 sm:p-6">
                    <div className="flex flex-col sm:flex-row items-start gap-4 sm:gap-6">
                      <div className="flex-shrink-0 mx-auto sm:mx-0">
                        <div className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-gradient-neon flex items-center justify-center">
                          <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                        </div>
                      </div>
                      <div className="flex-1 text-center sm:text-left">
                        <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4 mb-2">
                          <Badge className="bg-primary/20 text-primary border-primary/50 text-base sm:text-lg px-3 py-1 sm:px-4 sm:py-1">
                            {item.year}
                          </Badge>
                          <h3 className="text-xl sm:text-2xl font-orbitron font-bold">{item.title}</h3>
                        </div>
                        <p className="text-sm sm:text-base text-muted-foreground leading-relaxed">{item.description}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Struggles & Overcoming Section */}
        <motion.section 
          className="mb-12 sm:mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="text-center mb-8 sm:mb-12">
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-3 sm:mb-4 text-glow px-2"
              variants={itemVariants}
            >
              Struggles We Overcame
            </motion.h2>
            <motion.p 
              className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4"
              variants={itemVariants}
            >
              Real challenges, real solutions, real growth
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 max-w-5xl mx-auto">
            {struggles.map((struggle, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
              >
                <Card className="card-neon h-full hover:shadow-neon-lg transition-all duration-300">
                  <CardHeader className="p-4 sm:p-6">
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mb-3 sm:mb-4 rounded-full bg-gradient-neon-accent flex items-center justify-center mx-auto sm:mx-0">
                      <struggle.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                    </div>
                    <CardTitle className="font-orbitron text-lg sm:text-xl text-center sm:text-left">{struggle.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <p className="text-sm sm:text-base text-muted-foreground leading-relaxed text-center sm:text-left">{struggle.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* YouTube Channel Section */}
        <motion.section 
          className="mb-12 sm:mb-20"
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Card className="card-neon bg-gradient-hero max-w-5xl mx-auto">
            <CardContent className="p-6 sm:p-12">
              <div className="text-center mb-6 sm:mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/20 backdrop-blur-sm mb-4 sm:mb-6">
                  <Youtube className="w-8 h-8 sm:w-10 sm:h-10 text-white" />
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-3 sm:mb-4 text-white px-2">
                  Our YouTube Channels
                </h2>
                <p className="text-base sm:text-xl text-white/80 max-w-3xl mx-auto mb-6 sm:mb-8 px-4">
                  Follow the journey, learn from experiences, and get inspired. 
                  Subscribe to see behind-the-scenes content, tutorials, and the real story of building Team Myne7x.
                </p>
                
                {/* Two Channel Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-6 sm:mb-8">
                  <Button 
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 text-sm sm:text-lg px-6 py-5 sm:px-8 sm:py-6 h-auto w-full sm:w-auto"
                    onClick={() => window.open('https://www.youtube.com/@myne.winner', '_blank')}
                  >
                    <Youtube className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                    Myne Winner (@myne.winner)
                  </Button>
                  <Button 
                    size="lg"
                    className="bg-white text-primary hover:bg-white/90 text-sm sm:text-lg px-6 py-5 sm:px-8 sm:py-6 h-auto w-full sm:w-auto"
                    onClick={() => window.open('https://www.youtube.com/@myne7x', '_blank')}
                  >
                    <Youtube className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
                    myne7x (@myne7x)
                  </Button>
                </div>
              </div>
              
              {/* YouTube Embed Placeholder */}
              <div className="aspect-video bg-black/30 rounded-lg backdrop-blur-sm flex items-center justify-center border-2 border-white/20">
                <div className="text-center px-4">
                  <Youtube className="w-12 h-12 sm:w-16 sm:h-16 text-white/60 mx-auto mb-3 sm:mb-4" />
                  <p className="text-white/60 text-sm sm:text-base">Watch our latest videos on YouTube</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Team Myne7x Values */}
        <motion.section 
          className="mb-12 sm:mb-20"
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
        >
          <div className="text-center mb-8 sm:mb-12">
            <motion.h2 
              className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-3 sm:mb-4 text-glow px-2"
              variants={itemVariants}
            >
              Team Myne7x Values
            </motion.h2>
            <motion.p 
              className="text-base sm:text-xl text-muted-foreground max-w-3xl mx-auto px-4"
              variants={itemVariants}
            >
              The principles that guide us every single day
            </motion.p>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
            {[
              { icon: Target, title: "Innovation", description: "Never stop learning, never stop creating" },
              { icon: Shield, title: "Quality", description: "Excellence in everything we deliver" },
              { icon: Heart, title: "Community First", description: "Our success is your success" },
              { icon: Star, title: "Perseverance", description: "Hard work beats talent when talent doesn't work hard" }
            ].map((value, index) => (
              <motion.div key={index} variants={itemVariants}>
                <Card className="card-neon text-center h-full hover:shadow-neon-lg transition-all duration-300">
                  <CardHeader className="p-4 sm:p-6">
                    <motion.div 
                      className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-gradient-neon-accent flex items-center justify-center"
                      whileHover={{ rotate: 360 }}
                      transition={{ duration: 0.6 }}
                    >
                      <value.icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary-foreground" />
                    </motion.div>
                    <CardTitle className="font-orbitron text-lg sm:text-xl">{value.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 pt-0">
                    <p className="text-sm sm:text-base text-muted-foreground">{value.description}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </motion.section>

        {/* Stats Section */}
        <motion.section 
          className="mb-12 sm:mb-20"
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <Card className="card-neon bg-gradient-hero">
            <CardContent className="p-6 sm:p-12">
              <div className="text-center mb-8 sm:mb-12">
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-orbitron font-bold mb-3 sm:mb-4 text-white px-2">
                  Our Impact Today
                </h2>
                <p className="text-base sm:text-xl text-white/80 max-w-3xl mx-auto px-4">
                  From zero to hero - numbers that prove hard work pays off
                </p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-8">
                {[
                  { icon: Users, number: "10,000+", label: "Happy Customers" },
                  { icon: Award, number: "500+", label: "Products Delivered" },
                  { icon: TrendingUp, number: "99.9%", label: "Customer Satisfaction" },
                  { icon: Rocket, number: "6+", label: "Years of Hard Work" }
                ].map((stat, index) => (
                  <motion.div 
                    key={index} 
                    className="text-center"
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1, type: "spring" }}
                  >
                    <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto mb-3 sm:mb-4 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                      <stat.icon className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
                    </div>
                    <h3 className="text-2xl sm:text-4xl font-orbitron font-bold text-white mb-1 sm:mb-2">{stat.number}</h3>
                    <p className="text-xs sm:text-base text-white/80">{stat.label}</p>
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.section>

        {/* Final Message */}
        <motion.section
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <div className="max-w-4xl mx-auto">
            <Card className="card-neon">
              <CardHeader className="text-center p-4 sm:p-6">
                <CardTitle className="text-3xl sm:text-4xl font-orbitron font-bold text-glow mb-3 sm:mb-4 px-2">
                  The Journey Continues
                </CardTitle>
                <CardDescription className="text-base sm:text-lg">
                  This is just the beginning
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4 sm:space-y-6 text-muted-foreground leading-relaxed text-center p-4 sm:p-6">
                <p className="text-sm sm:text-lg px-2">
                  From a small room in 2019 to serving thousands worldwide in 2025, 
                  Team Myne7x has proven that with dedication, persistence, and hard work, 
                  anything is possible.
                </p>
                <p className="text-sm sm:text-lg px-2">
                  Every product we create, every customer we serve, and every challenge 
                  we overcome is a testament to the belief that started it all: 
                  <strong className="text-foreground"> "Never give up on your dreams."</strong>
                </p>
                <p className="text-sm sm:text-lg px-2">
                  Thank you for being part of our journey. Together, we're building 
                  something extraordinary. This is <strong className="text-foreground">Myne Winner</strong>, 
                  this is <strong className="text-foreground">Team Myne7x</strong>, and this is just the beginning.
                </p>
                <div className="pt-4 sm:pt-6">
                  <img 
                    src="https://uqkirciomqdagbnrwcfq.supabase.co/storage/v1/object/public/images/myne7x_logo.png" 
                    alt="Myne7x Logo - Team Myne7x" 
                    className="h-12 sm:h-16 mx-auto object-contain opacity-70"
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.section>

      </div>
    </div>
  );
};

export default About;