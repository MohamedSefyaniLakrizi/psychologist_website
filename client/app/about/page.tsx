"use client";

import { Button } from "@/app/components/ui/button";
import Image from "next/image";
import {
  Award,
  BookOpen,
  Users,
  Heart,
  Clock,
  Shield,
  Quote,
  GraduationCap,
  Briefcase,
  ArrowRight,
  CheckCircle,
  Sparkles,
  Calendar,
  Info,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  HeartIcon,
  UserGroupIcon,
  ShieldCheckIcon,
  ClockIcon,
  StarIcon,
  AcademicCapIcon,
  BriefcaseIcon,
  BookOpenIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

// Animation variants
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

export default function About() {
  return (
    <div className="overflow-hidden">
      {/* Unique About Hero Section */}
      <section className="relative py-20 bg-gradient-to-r from-indigo-50 via-white to-purple-50 overflow-hidden">
        {/* Animated Background Elements */}
        <motion.div
          animate={{
            x: [0, 100, 0],
            y: [0, -50, 0],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl"
        />
        <motion.div
          animate={{
            x: [0, -80, 0],
            y: [0, 60, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute bottom-10 right-10 w-40 h-40 bg-gradient-to-br from-indigo-200/30 to-pink-200/30 rounded-full blur-2xl"
        />

        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Personal Introduction */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              className="space-y-8"
            >
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <Badge className="mb-6 bg-gradient-to-r from-purple-100 to-blue-100 text-purple-700 border-purple-200 shadow-sm">
                  <HeartIcon className="w-4 h-4 mr-2" />
                  Qui suis-je ?
                </Badge>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="space-y-4"
              >
                <h1 className="text-4xl lg:text-5xl font-bold leading-tight">
                  <span className="text-gray-800">Bonjour, je suis</span>
                  <br />
                  <span className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Malika Lkhabir
                  </span>
                </h1>

                <motion.div
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                  className="h-1 w-24 bg-gradient-to-r from-purple-500 to-blue-500 origin-left"
                />
              </motion.div>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="text-lg text-gray-600 leading-relaxed"
              >
                Psychologue clinicienne passionnée par l'accompagnement humain,
                je mets mon expertise au service de votre bien-être
                psychologique. Mon approche se base sur l'écoute, la
                bienveillance et l'adaptation à vos besoins uniques.
              </motion.p>

              {/* Key Stats */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="grid grid-cols-3 gap-6 py-6"
              >
                {[
                  {
                    number: "300+",
                    label: "Patients accompagnés",
                    icon: <UserGroupIcon className="w-5 h-5" />,
                  },
                  {
                    number: "1+",
                    label: "Années d'expérience",
                    icon: <ClockIcon className="w-5 h-5" />,
                  },
                  {
                    number: "24/7",
                    label: "Écoute disponible",
                    icon: <HeartIcon className="w-5 h-5" />,
                  },
                ].map((stat, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 1 + index * 0.1 }}
                    whileHover={{ scale: 1.05 }}
                    className="text-center p-4 bg-white/60 backdrop-blur-sm rounded-xl shadow-sm hover:shadow-md transition-all duration-300"
                  >
                    <div className="flex justify-center mb-2 text-purple-600">
                      {stat.icon}
                    </div>
                    <div className="text-2xl font-bold text-gray-800">
                      {stat.number}
                    </div>
                    <div className="text-sm text-gray-600">{stat.label}</div>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            {/* Right: Professional Image with floating elements */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
              className="relative"
            >
              <div className="relative group">
                {/* Animated decorative elements */}
                <motion.div
                  animate={{
                    rotate: [0, 180, 360],
                    scale: [1, 1.1, 1],
                  }}
                  transition={{
                    duration: 12,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute -top-6 -right-6 w-24 h-24 border-2 border-purple-300/50 rounded-full"
                />
                <motion.div
                  animate={{
                    rotate: [360, 180, 0],
                    scale: [1, 0.9, 1],
                  }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                  className="absolute -bottom-6 -left-6 w-32 h-32 border-2 border-blue-300/50 rounded-full"
                />

                <div className="relative rounded-3xl overflow-hidden shadow-2xl border-4 border-white/80 backdrop-blur-sm">
                  <Image
                    src="/hero_image.jpeg"
                    alt="Malika Lkhabir - Psychologue Clinicienne"
                    className="object-cover w-full h-[500px] transform group-hover:scale-105 transition-transform duration-700"
                    width={500}
                    height={500}
                  />

                  {/* Floating credentials with animation */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1.2 }}
                    whileHover={{ y: -5 }}
                    className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-2xl px-4 py-3 shadow-xl"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full flex items-center justify-center">
                        <AcademicCapIcon className="w-6 h-6 text-white" />
                      </div>
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

      {/* Main Content Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            {/* Image Section */}
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
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
                    height={700}
                  />

                  {/* Floating credential badge */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 1 }}
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

            {/* Content Section */}
            <motion.div
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8 }}
              viewport={{ once: true }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-3xl lg:text-4xl font-bold bg-gradient-to-r from-gray-900 to-blue-800 bg-clip-text text-transparent mb-6">
                  Mon Approche Thérapeutique
                </h2>

                <div className="space-y-6">
                  <p className="text-lg text-gray-700 leading-relaxed">
                    Ma démarche s'ancre dans une approche{" "}
                    <span className="font-semibold text-blue-700">
                      humaniste et intégrative
                    </span>
                    , adaptée aux besoins uniques de chaque personne. Je crois
                    fermement que chacun possède en lui les ressources
                    nécessaires pour surmonter ses difficultés.
                  </p>

                  <p className="text-lg text-gray-700 leading-relaxed">
                    Fort de mon expérience hospitalière et de l'accompagnement
                    de centaines de patients, j'ai développé une expertise dans
                    le traitement de diverses problématiques psychologiques,
                    toujours dans le respect et la bienveillance.
                  </p>

                  <div className="grid grid-cols-2 gap-4 mt-8">
                    {[
                      {
                        icon: <HeartIcon className="w-6 h-6" />,
                        text: "Approche empathique",
                        color: "from-pink-500 to-rose-500",
                      },
                      {
                        icon: <ShieldCheckIcon className="w-6 h-6" />,
                        text: "Confidentialité totale",
                        color: "from-blue-500 to-cyan-500",
                      },
                      {
                        icon: <ClockIcon className="w-6 h-6" />,
                        text: "Suivi personnalisé",
                        color: "from-green-500 to-emerald-500",
                      },
                      {
                        icon: <StarIcon className="w-6 h-6" />,
                        text: "Expertise reconnue",
                        color: "from-yellow-500 to-orange-500",
                      },
                    ].map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 + index * 0.1 }}
                        viewport={{ once: true }}
                        className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div
                          className={`w-10 h-10 bg-gradient-to-br ${item.color} rounded-full flex items-center justify-center text-white shadow-lg`}
                        >
                          {item.icon}
                        </div>
                        <span className="text-gray-700 font-medium">
                          {item.text}
                        </span>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Journey Timeline Section */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-blue-50 relative overflow-hidden">
        {/* Animated background shapes */}
        <motion.div
          animate={{
            rotate: [0, 360],
            scale: [1, 1.2, 1],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "linear",
          }}
          className="absolute top-10 right-10 w-64 h-64 border border-purple-200/30 rounded-full"
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-white/80 text-purple-700 border-purple-200">
              <BookOpenIcon className="w-4 h-4 mr-2" />
              Mon Parcours
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-800 to-blue-800 bg-clip-text text-transparent">
              Une Formation Solide, Une Passion Sincère
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Découvrez le chemin qui m'a menée vers la psychologie clinique et
              l'expertise que j'ai développée au fil des années.
            </p>
          </motion.div>

          {/* Timeline */}
          <div className="max-w-4xl mx-auto">
            {[
              {
                year: "2020-2024",
                title: "Formation Universitaire",
                description:
                  "Master en Psychologie Clinique et Pathologique, spécialisation en thérapies cognitivo-comportementales. Formation approfondie en psychopathologie et techniques d'entretien clinique.",
                icon: <AcademicCapIcon className="w-8 h-8" />,
                color: "from-blue-500 to-cyan-500",
                side: "left",
              },
              {
                year: "2024-2025",
                title: "Expérience Hospitalière",
                description:
                  "Psychologue clinicienne en service de psychiatrie générale. Prise en charge de patients en situation de crise, collaboration avec équipes pluridisciplinaires, développement d'approches thérapeutiques adaptées.",
                icon: <BriefcaseIcon className="w-8 h-8" />,
                color: "from-green-500 to-emerald-500",
                side: "right",
              },
              {
                year: "2025-Aujourd'hui",
                title: "Consultation Privée",
                description:
                  "Installation en cabinet privé avec une approche humaniste intégrative. Accompagnement de plus de 300 patients, spécialisation en thérapie individuelle et de couple, formation continue en nouvelles approches thérapeutiques.",
                icon: <HeartIcon className="w-8 h-8" />,
                color: "from-purple-500 to-pink-500",
                side: "left",
              },
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  x: item.side === "left" ? -100 : 100,
                  y: 50,
                }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={`relative mb-12 ${item.side === "left" ? "lg:text-left" : "lg:text-right"}`}
              >
                {/* Timeline line */}
                {index < 2 && (
                  <motion.div
                    initial={{ scaleY: 0 }}
                    whileInView={{ scaleY: 1 }}
                    transition={{ duration: 0.8, delay: index * 0.2 + 0.5 }}
                    viewport={{ once: true }}
                    className="hidden lg:block absolute left-1/2 top-20 w-0.5 h-24 bg-gradient-to-b from-purple-300 to-blue-300 origin-top"
                  />
                )}

                {/* Content Card */}
                <div
                  className={`lg:w-1/2 ${item.side === "left" ? "lg:pr-8" : "lg:pl-8 lg:ml-auto"} relative`}
                >
                  <motion.div
                    whileHover={{
                      scale: 1.02,
                      boxShadow:
                        "0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)",
                    }}
                    className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg border border-white/50"
                  >
                    <div className="flex items-start space-x-4">
                      <div
                        className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center text-white shadow-lg flex-shrink-0`}
                      >
                        {item.icon}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm font-semibold text-purple-600 mb-2">
                          {item.year}
                        </div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">
                          {item.title}
                        </h3>
                        <p className="text-gray-700 leading-relaxed">
                          {item.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Timeline dot */}
                  <motion.div
                    initial={{ scale: 0 }}
                    whileInView={{ scale: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.3 }}
                    viewport={{ once: true }}
                    className={`hidden lg:block absolute top-8 w-4 h-4 bg-gradient-to-br ${item.color} rounded-full border-4 border-white shadow-lg ${item.side === "left" ? "-right-10" : "-left-10"}`}
                  />
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Philosophy & Values Section */}
      <section className="py-20 bg-white relative overflow-hidden">
        {/* Animated background elements */}
        <motion.div
          animate={{
            rotate: [0, 180, 360],
            x: [0, 50, 0],
            y: [0, -30, 0],
          }}
          transition={{
            duration: 20,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute top-20 right-20 w-40 h-40 bg-gradient-to-br from-purple-100/50 to-blue-100/50 rounded-full blur-xl"
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 border-purple-200">
              <HeartIcon className="w-4 h-4 mr-2" />
              Ma Philosophie
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-800 to-blue-800 bg-clip-text text-transparent">
              Une Approche Centrée sur l'Humain
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Ma démarche thérapeutique s'appuie sur des valeurs fortes et une
              vision bienveillante de l'accompagnement psychologique.
            </p>
          </motion.div>

          {/* Philosophy Cards */}
          <div className="max-w-6xl mx-auto grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              {
                icon: <HeartIcon className="w-8 h-8" />,
                title: "Bienveillance",
                description:
                  "Créer un espace sécurisé où chaque personne peut s'exprimer librement, sans jugement, dans le respect de son rythme et de ses difficultés.",
                color: "from-pink-500 to-red-500",
                hoverColor: "group-hover:from-pink-600 group-hover:to-red-600",
              },
              {
                icon: <UserGroupIcon className="w-8 h-8" />,
                title: "Personnalisation",
                description:
                  "Adapter mon approche à chaque individu, car chaque parcours est unique et mérite une attention particulière et des méthodes sur-mesure.",
                color: "from-blue-500 to-cyan-500",
                hoverColor: "group-hover:from-blue-600 group-hover:to-cyan-600",
              },
              {
                icon: <ShieldCheckIcon className="w-8 h-8" />,
                title: "Confidentialité",
                description:
                  "Garantir un cadre thérapeutique confidentiel et sécurisé, respectant scrupuleusement le secret professionnel et l'éthique.",
                color: "from-green-500 to-emerald-500",
                hoverColor:
                  "group-hover:from-green-600 group-hover:to-emerald-600",
              },
              {
                icon: <BookOpenIcon className="w-8 h-8" />,
                title: "Formation Continue",
                description:
                  "Maintenir une expertise à jour grâce à une formation permanente aux nouvelles approches thérapeutiques et aux évolutions de la profession.",
                color: "from-purple-500 to-indigo-500",
                hoverColor:
                  "group-hover:from-purple-600 group-hover:to-indigo-600",
              },
              {
                icon: <ClockIcon className="w-8 h-8" />,
                title: "Disponibilité",
                description:
                  "Offrir une écoute attentive et une disponibilité adaptée aux besoins de chacun, avec des horaires flexibles et un suivi régulier.",
                color: "from-amber-500 to-orange-500",
                hoverColor:
                  "group-hover:from-amber-600 group-hover:to-orange-600",
              },
              {
                icon: <StarIcon className="w-8 h-8" />,
                title: "Excellence",
                description:
                  "Viser l'excellence dans la pratique clinique tout en gardant l'humilité nécessaire pour accompagner chaque personne vers son mieux-être.",
                color: "from-violet-500 to-purple-500",
                hoverColor:
                  "group-hover:from-violet-600 group-hover:to-purple-600",
              },
            ].map((value, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                viewport={{ once: true }}
                whileHover={{ y: -10, scale: 1.02 }}
                className="group"
              >
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-500 border border-gray-100 h-full">
                  <div
                    className={`w-16 h-16 bg-gradient-to-br ${value.color} ${value.hoverColor} rounded-2xl flex items-center justify-center text-white mb-6 mx-auto shadow-lg group-hover:scale-110 transition-all duration-300`}
                  >
                    {value.icon}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-4 text-center group-hover:text-purple-700 transition-colors">
                    {value.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed text-center">
                    {value.description}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Inspirational Quote */}
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="mt-20"
          >
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-3xl p-8 md:p-12 text-center relative overflow-hidden">
              <motion.div
                animate={{
                  scale: [1, 1.1, 1],
                  opacity: [0.3, 0.6, 0.3],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut",
                }}
                className="absolute inset-0 bg-gradient-to-r from-purple-200/20 to-blue-200/20"
              />

              <motion.div
                whileHover={{ scale: 1.1, rotate: 5 }}
                className="relative z-10"
              >
                <Quote className="w-16 h-16 text-purple-400 mx-auto mb-8" />
              </motion.div>

              <blockquote className="text-2xl md:text-3xl font-medium text-gray-800 leading-relaxed mb-8 italic relative z-10">
                "Le courage n'est pas l'absence de peur, mais la capacité de la
                dépasser. Mon rôle est de vous accompagner dans cette démarche
                courageuse vers votre guérison."
              </blockquote>
              <cite className="text-purple-600 font-semibold text-lg relative z-10">
                Malika Lkhabir, Psychologue Clinicienne
              </cite>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Specializations Section */}
      <section className="py-20 bg-gradient-to-br from-indigo-50 to-purple-50 relative overflow-hidden">
        {/* Animated background elements */}
        <motion.div
          animate={{
            x: [-50, 50, -50],
            y: [0, -30, 0],
            rotate: [0, 180, 360],
          }}
          transition={{
            duration: 15,
            repeat: Infinity,
            ease: "easeInOut",
          }}
          className="absolute bottom-10 left-10 w-32 h-32 bg-gradient-to-br from-blue-200/30 to-purple-200/30 rounded-full blur-2xl"
        />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            viewport={{ once: true }}
            className="text-center mb-16"
          >
            <Badge className="mb-6 bg-white/80 text-indigo-700 border-indigo-200">
              <SparklesIcon className="w-4 h-4 mr-2" />
              Mes Spécialisations
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-indigo-800 to-purple-800 bg-clip-text text-transparent">
              Domaines d'Expertise & Accompagnement
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Découvrez les différents domaines dans lesquels je vous accompagne
              avec expertise et bienveillance pour votre épanouissement
              personnel.
            </p>
          </motion.div>

          <div className="max-w-6xl mx-auto space-y-16">
            {[
              {
                icon: <HeartIcon className="w-10 h-10" />,
                title: "Thérapie Individuelle",
                description:
                  "Accompagnement personnalisé pour les troubles anxieux, dépressifs, les phobies, les troubles du comportement alimentaire et les difficultés relationnelles. Approche adaptée à chaque profil psychologique.",
                techniques: [
                  "Thérapie Cognitivo-Comportementale",
                  "Approche Humaniste",
                  "Techniques de relaxation",
                  "Gestion des émotions",
                ],
                color: "from-pink-500 to-rose-500",
                bgColor: "from-pink-50 to-rose-50",
                side: "left",
              },
              {
                icon: <UserGroupIcon className="w-10 h-10" />,
                title: "Thérapie de Couple",
                description:
                  "Médiation et thérapie pour couples en difficulté, amélioration de la communication, résolution des conflits conjugaux et reconstruction du lien affectif. Accompagnement vers une relation épanouie.",
                techniques: [
                  "Communication Non-Violente",
                  "Thérapie Systémique",
                  "Médiation conjugale",
                  "Reconstruction du lien",
                ],
                color: "from-blue-500 to-cyan-500",
                bgColor: "from-blue-50 to-cyan-50",
                side: "right",
              },
              {
                icon: <ShieldCheckIcon className="w-10 h-10" />,
                title: "Gestion du Stress & Burnout",
                description:
                  "Prévention et traitement de l'épuisement professionnel, gestion du stress chronique, techniques de relaxation et reconstruction de l'équilibre vie professionnelle-personnelle.",
                techniques: [
                  "Techniques anti-stress",
                  "Prévention burnout",
                  "Équilibre vie-travail",
                  "Reconstruction personnelle",
                ],
                color: "from-green-500 to-emerald-500",
                bgColor: "from-green-50 to-emerald-50",
                side: "left",
              },
              {
                icon: <ClockIcon className="w-10 h-10" />,
                title: "Accompagnement des Transitions",
                description:
                  "Soutien psychologique lors des grandes étapes de la vie : deuil, séparation, changement professionnel, parentalité, retraite. Accompagnement vers l'acceptation et l'adaptation.",
                techniques: [
                  "Thérapie du deuil",
                  "Accompagnement au changement",
                  "Soutien parental",
                  "Adaptation aux transitions",
                ],
                color: "from-purple-500 to-indigo-500",
                bgColor: "from-purple-50 to-indigo-50",
                side: "right",
              },
            ].map((specialization, index) => (
              <motion.div
                key={index}
                initial={{
                  opacity: 0,
                  x: specialization.side === "left" ? -100 : 100,
                  y: 50,
                }}
                whileInView={{ opacity: 1, x: 0, y: 0 }}
                transition={{ duration: 0.8, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={`flex flex-col lg:flex-row items-center gap-12 ${specialization.side === "right" ? "lg:flex-row-reverse" : ""}`}
              >
                {/* Content */}
                <div className="lg:w-1/2 space-y-6">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className={`inline-flex items-center space-x-4 p-4 bg-gradient-to-r ${specialization.bgColor} rounded-2xl shadow-sm`}
                  >
                    <div
                      className={`w-16 h-16 bg-gradient-to-br ${specialization.color} rounded-2xl flex items-center justify-center text-white shadow-lg`}
                    >
                      {specialization.icon}
                    </div>
                    <h3 className="text-2xl lg:text-3xl font-bold text-gray-900">
                      {specialization.title}
                    </h3>
                  </motion.div>

                  <p className="text-lg text-gray-700 leading-relaxed">
                    {specialization.description}
                  </p>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-gray-800 flex items-center">
                      <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                      Techniques utilisées :
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      {specialization.techniques.map((technique, techIndex) => (
                        <motion.div
                          key={techIndex}
                          initial={{ opacity: 0, scale: 0.9 }}
                          whileInView={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.2 + techIndex * 0.1 }}
                          viewport={{ once: true }}
                          className="flex items-center text-sm text-gray-600 bg-white/60 rounded-lg px-3 py-2"
                        >
                          <div
                            className={`w-2 h-2 bg-gradient-to-r ${specialization.color} rounded-full mr-2`}
                          />
                          {technique}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Decorative Element */}
                <div className="lg:w-1/2 flex justify-center">
                  <motion.div
                    whileHover={{
                      rotate: 5,
                      scale: 1.05,
                    }}
                    className={`w-64 h-64 bg-gradient-to-br ${specialization.color} rounded-full opacity-20 flex items-center justify-center relative overflow-hidden`}
                  >
                    <motion.div
                      animate={{
                        rotate: [0, 360],
                        scale: [1, 1.2, 1],
                      }}
                      transition={{
                        duration: 8,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                      className={`w-32 h-32 bg-gradient-to-br ${specialization.color} rounded-full opacity-60`}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className={`w-20 h-20 bg-gradient-to-br ${specialization.color} rounded-2xl flex items-center justify-center text-white shadow-2xl`}
                      >
                        {specialization.icon}
                      </div>
                    </div>
                  </motion.div>
                </div>
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
