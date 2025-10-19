"use client";

import { Button } from "@/app/components/ui/button";
import Image from "next/image";
import {
  CircleCheckIcon,
  Star,
  Users,
  Award,
  Heart,
  Clock,
  Shield,
  Quote,
  Calendar,
  Info,
  ArrowRight,
  CheckCircle,
  Sparkles,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./components/ui/card";
import { Badge } from "./components/ui/badge";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import {
  HeartIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
  StarIcon,
  AcademicCapIcon,
  ChatBubbleLeftRightIcon,
  LightBulbIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// Animation variants - simplified for TypeScript compatibility
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
      delayChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
  },
};

const floatingAnimation = {
  y: [-10, 10, -10],
  transition: {
    duration: 6,
    repeat: Infinity,
    ease: "easeInOut" as const,
  },
};

// Animated Stats Component
const AnimatedStats = ({
  value,
  label,
  icon,
}: {
  value: string;
  label: string;
  icon: React.ReactNode;
}) => {
  const [count, setCount] = useState(0);
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });

  useEffect(() => {
    if (isInView && value.includes("+")) {
      const target = parseInt(value.replace("+", ""));
      const timer = setInterval(() => {
        setCount((prev) => {
          if (prev < target) {
            return Math.min(prev + Math.ceil(target / 50), target);
          }
          clearInterval(timer);
          return target;
        });
      }, 30);
      return () => clearInterval(timer);
    }
  }, [isInView, value]);

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={isInView ? { opacity: 1, scale: 1 } : {}}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="text-center"
    >
      <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-800 mb-2">
        {value.includes("+") ? `${count}+` : value}
      </div>
      <div className="text-gray-600">{label}</div>
    </motion.div>
  );
};

// Floating Elements Component
const FloatingElements = () => (
  <>
    <motion.div
      animate={floatingAnimation}
      className="absolute top-20 right-10 w-20 h-20 bg-gradient-to-br from-blue-400/20 to-blue-600/20 rounded-full blur-xl"
      style={{ animationDelay: "0s" }}
    />
    <motion.div
      animate={floatingAnimation}
      className="absolute top-40 left-10 w-16 h-16 bg-gradient-to-br from-green-400/20 to-green-600/20 rounded-full blur-xl"
      style={{ animationDelay: "2s" }}
    />
    <motion.div
      animate={floatingAnimation}
      className="absolute bottom-32 right-20 w-12 h-12 bg-gradient-to-br from-purple-400/20 to-purple-600/20 rounded-full blur-xl"
      style={{ animationDelay: "4s" }}
    />
  </>
);

export default function Home() {
  return (
    <div className="overflow-hidden">
      {/* Modern Hero Section */}
      <section className="relative min-h-[calc(100vh-132px)] bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 flex items-center">
        <FloatingElements />

        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: `radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
                            radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.3) 0%, transparent 50%)`,
            }}
          />
        </div>

        <div className="container mx-auto px-4 py-20 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="space-y-8"
            >
              <motion.div variants={itemVariants}>
                <Badge className="mb-6 bg-white/80 text-blue-700 border-blue-200 shadow-sm hover:bg-white">
                  <SparklesIcon className="w-4 h-4 mr-2" />
                  Psychologue Clinicienne Certifiée
                </Badge>
              </motion.div>

              <motion.h1
                variants={itemVariants}
                className="text-5xl lg:text-7xl font-bold leading-tight"
              >
                <span className="bg-gradient-to-r from-gray-900 via-blue-800 to-gray-900 bg-clip-text text-transparent">
                  Malika Lkhabir
                </span>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 1, duration: 1 }}
                  className="h-1 bg-gradient-to-r from-blue-500 to-purple-500 mt-4"
                />
              </motion.h1>

              <motion.p
                variants={itemVariants}
                className="text-xl lg:text-2xl text-gray-700 leading-relaxed"
              >
                Accompagnement psychologique personnalisé pour retrouver
                <span className="font-semibold text-blue-700">
                  {" "}
                  l'équilibre et le bien-être
                </span>
                . Expérience hospitalière et centaines de patients accompagnés.
              </motion.p>

              <motion.div
                variants={itemVariants}
                className="flex flex-wrap gap-6 text-sm text-gray-600"
              >
                {[
                  {
                    icon: <ShieldCheckIcon className="w-5 h-5" />,
                    text: "Confidentialité garantie",
                  },
                  {
                    icon: <ClockIcon className="w-5 h-5" />,
                    text: "Horaires flexibles",
                  },
                  {
                    icon: <StarIcon className="w-5 h-5" />,
                    text: "Expertise reconnue",
                  },
                ].map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 1.5 + index * 0.2 }}
                    className="flex items-center bg-white/60 rounded-full px-4 py-2 shadow-sm"
                  >
                    <div className="text-blue-600 mr-3">{item.icon}</div>
                    {item.text}
                  </motion.div>
                ))}
              </motion.div>

              <motion.div
                variants={itemVariants}
                className="flex flex-col sm:flex-row gap-4"
              >
                <Link href="/book">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button className="group bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-8 py-4 text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300">
                      <Calendar className="w-5 h-5 mr-2" />
                      Prendre Rendez-vous
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </motion.div>
                </Link>

                <Link href="/about">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button
                      variant="outline"
                      className="border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50 px-8 py-4 text-lg font-medium transition-all duration-300"
                    >
                      <Info className="w-5 h-5 mr-2" />
                      En savoir plus
                    </Button>
                  </motion.div>
                </Link>
              </motion.div>
            </motion.div>

            {/* Right Content - Image */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8, rotateY: 20 }}
              animate={{ opacity: 1, scale: 1, rotateY: 0 }}
              transition={{ duration: 1, delay: 0.5 }}
              className="relative"
            >
              <div className="relative group">
                {/* Animated background */}
                <motion.div
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{
                    duration: 20,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute -inset-8 bg-gradient-to-r from-blue-400/20 via-purple-400/20 to-blue-400/20 rounded-full blur-2xl"
                />

                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-8 border-white/50 backdrop-blur-sm group-hover:shadow-3xl transition-all duration-500">
                  <Image
                    src="/hero_image.jpeg"
                    alt="Malika Lkhabir - Psychologue Clinicienne"
                    className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-700"
                    width={600}
                    height={600}
                  />

                  {/* Floating credential badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.5 }}
                    className="absolute bottom-6 left-6 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl"
                  >
                    <div className="flex items-center gap-3">
                      <AcademicCapIcon className="w-6 h-6 text-blue-600" />
                      <div>
                        <p className="text-sm font-semibold text-gray-800">
                          Psychologue Clinicienne
                        </p>
                        <p className="text-xs text-gray-600">
                          Certifiée • Maroc
                        </p>
                      </div>
                    </div>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Animated Quote Section */}
      <section className="py-20 bg-gradient-to-r from-gray-50 to-blue-50 relative overflow-hidden">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-purple-500/5"
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto text-center"
          >
            <Quote className="w-16 h-16 text-blue-400 mx-auto mb-8" />
            <blockquote className="text-2xl lg:text-4xl font-medium text-gray-800 leading-relaxed mb-8 italic">
              "Jamais la psychologie ne pourra dire sur la folie la vérité,
              puisque c'est la folie qui détient la vérité de la psychologie."
            </blockquote>
            <cite className="text-gray-600 font-medium text-lg">
              Michel Foucault
            </cite>
          </motion.div>
        </div>
      </section>

      {/* Animated Stats Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200">
              <Sparkles className="w-4 h-4 mr-2" />
              Pourquoi me choisir
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
              Une expertise reconnue
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Formation universitaire complète et expérience hospitalière avec
              des centaines de patients accompagnés
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-12">
            <AnimatedStats
              value="300+"
              label="Patients accompagnés"
              icon={<UserGroupIcon className="w-8 h-8 text-white" />}
            />
            <AnimatedStats
              value="Certifiée"
              label="Formation universitaire"
              icon={<AcademicCapIcon className="w-8 h-8 text-white" />}
            />
            <AnimatedStats
              value="4.9/5"
              label="Note moyenne clients"
              icon={<StarIcon className="w-8 h-8 text-white" />}
            />
          </div>
        </div>
      </section>

      {/* Modern Services Section */}
      <section className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-white/80 text-blue-700 border-blue-200">
              <LightBulbIcon className="w-4 h-4 mr-2" />
              Mes services
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
              Un accompagnement personnalisé
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chaque parcours est unique. Je vous propose des solutions adaptées
              à vos besoins spécifiques.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <HeartIcon className="w-8 h-8" />,
                title: "Thérapie individuelle",
                description:
                  "Accompagnement personnalisé pour surmonter les difficultés personnelles et émotionnelles",
                features: [
                  "Anxiété et stress",
                  "Dépression",
                  "Confiance en soi",
                ],
                gradient: "from-pink-500 to-rose-500",
              },
              {
                icon: <UserGroupIcon className="w-8 h-8" />,
                title: "Thérapie de couple",
                description:
                  "Renforcer votre relation et améliorer la communication dans votre couple",
                features: [
                  "Communication",
                  "Conflits relationnels",
                  "Intimité",
                ],
                gradient: "from-blue-500 to-cyan-500",
              },
              {
                icon: <ShieldCheckIcon className="w-8 h-8" />,
                title: "Suivi thérapeutique",
                description:
                  "Accompagnement continu et personnalisé pour un suivi thérapeutique adapté à votre rythme",
                features: [
                  "Suivi personnalisé",
                  "Horaires flexibles",
                  "Accompagnement continu",
                ],
                gradient: "from-green-500 to-emerald-500",
              },
            ].map((service, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -10 }}
                className="group"
              >
                <Card className="h-full bg-white/70 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500 overflow-hidden">
                  <CardHeader className="relative">
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${service.gradient} rounded-2xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg group-hover:scale-110 transition-transform duration-300`}
                    >
                      {service.icon}
                    </div>
                    <CardTitle className="text-xl font-bold text-center mb-3">
                      {service.title}
                    </CardTitle>
                    <CardDescription className="text-center text-gray-600 leading-relaxed">
                      {service.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      {service.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center">
                          <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
                          <span className="text-gray-700">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern Testimonials Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 to-purple-50/50" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200">
              <ChatBubbleLeftRightIcon className="w-4 h-4 mr-2" />
              Témoignages
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent">
              Ce que disent mes patients
            </h2>
            <p className="text-xl text-gray-600">
              Des transformations réelles, des vies changées
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                text: "Malika Lkhabir m'a aidée à retrouver confiance en moi après une période très difficile. Son approche bienveillante et professionnelle a fait toute la différence.",
                author: "Sarah M.",
                role: "Patiente suivie",
                initial: "S",
                color: "from-pink-500 to-rose-500",
              },
              {
                text: "Un accompagnement exceptionnel qui nous a permis de sauver notre mariage. Nous recommandons vivement Malika Lkhabir pour les thérapies de couple.",
                author: "Ahmed & Fatima",
                role: "Thérapie de couple",
                initial: "A",
                color: "from-blue-500 to-cyan-500",
              },
              {
                text: "Professionnelle, empathique et efficace. Les séances m'ont aidé à surmonter mes phobies et à reprendre le contrôle de ma vie.",
                author: "Karim L.",
                role: "Suivi individuel",
                initial: "K",
                color: "from-green-500 to-emerald-500",
              },
            ].map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: index * 0.2 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="group"
              >
                <Card className="h-full bg-white/80 backdrop-blur-sm border-0 shadow-lg hover:shadow-2xl transition-all duration-500">
                  <CardHeader>
                    <div className="flex items-center mb-4">
                      <div className="flex text-yellow-400">
                        {[...Array(5)].map((_, i) => (
                          <StarIcon key={i} className="w-5 h-5 fill-current" />
                        ))}
                      </div>
                    </div>
                    <Quote className="w-10 h-10 text-blue-400 mb-4 group-hover:scale-110 transition-transform duration-300" />
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-700 mb-6 leading-relaxed italic">
                      "{testimonial.text}"
                    </p>
                    <div className="flex items-center">
                      <div
                        className={`w-12 h-12 bg-gradient-to-br ${testimonial.color} rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg`}
                      >
                        {testimonial.initial}
                      </div>
                      <div className="ml-4">
                        <p className="font-semibold text-gray-800">
                          {testimonial.author}
                        </p>
                        <p className="text-sm text-gray-500">
                          {testimonial.role}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Modern CTA Section */}
      <section className="py-20 bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
        <FloatingElements />

        <div className="container mx-auto px-4 text-center relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="max-w-4xl mx-auto"
          >
            <h2 className="text-4xl lg:text-6xl font-bold mb-8 leading-tight">
              Prête à commencer votre{" "}
              <span className="bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                transformation
              </span>{" "}
              ?
            </h2>
            <p className="text-xl lg:text-2xl mb-12 opacity-90 leading-relaxed">
              Ne laissez pas les difficultés définir votre vie. Prenez
              rendez-vous dès aujourd'hui et faites le premier pas vers un
              mieux-être durable.
            </p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12"
            >
              <Link href="/book">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    className="group bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-8 py-4 text-lg font-bold shadow-2xl hover:shadow-3xl transition-all duration-300"
                  >
                    <Calendar className="w-6 h-6 mr-3" />
                    Prendre Rendez-vous Maintenant
                    <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </motion.div>
              </Link>

              <Link href="/about">
                <motion.div
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-2 border-white/30 hover:bg-white/10 text-gray-800 hover:border-white/50 px-8 py-4 text-lg font-medium backdrop-blur-sm transition-all duration-300"
                  >
                    <Info className="w-6 h-6 mr-3" />
                    En Savoir Plus
                  </Button>
                </motion.div>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.6 }}
              viewport={{ once: true }}
              className="flex flex-col sm:flex-row gap-8 justify-center items-center text-sm opacity-80"
            >
              {[
                {
                  icon: <ClockIcon className="w-5 h-5" />,
                  text: "Consultation rapide disponible",
                },
                {
                  icon: <ShieldCheckIcon className="w-5 h-5" />,
                  text: "Confidentialité absolue garantie",
                },
                {
                  icon: <HeartIcon className="w-5 h-5" />,
                  text: "Accompagnement bienveillant",
                },
              ].map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.8 + index * 0.1 }}
                  viewport={{ once: true }}
                  className="flex items-center bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm"
                >
                  <div className="text-blue-300 mr-3">{item.icon}</div>
                  {item.text}
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
