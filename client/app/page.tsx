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

export default function Home() {
  return (
    <>
      {/* Enhanced Hero Section - Full width */}
      <div className="relative overflow-hidden bg-gradient-to-br from-blue-50 via-white to-green-50 w-screen left-1/2 -translate-x-1/2">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-bl from-blue-100/30 to-transparent rounded-full -translate-y-48 translate-x-48"></div>
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-gradient-to-tr from-green-100/30 to-transparent rounded-full translate-y-40 -translate-x-40"></div>

        <div className="relative mt-10 p-4 flex flex-col lg:flex-row lg:justify-between gap-8 min-h-[80vh] lg:items-center max-w-7xl mx-auto">
          <div className="w-full lg:max-w-1/2 flex flex-col justify-center z-10 text-center lg:text-left">
            <div className="inline-flex items-center bg-white/80 border border-gray-200 rounded-full px-4 py-2 mb-6 w-fit shadow-sm mx-auto lg:mx-0">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-gray-700">
                Psychologue Clinicienne Certifiée
              </span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-8xl font-bold mb-6 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-700 bg-clip-text text-transparent leading-tight">
              Dr.Lkhabir Malika
            </h1>

            <p className="text-lg sm:text-xl lg:text-2xl text-gray-600 mb-8 leading-relaxed max-w-2xl mx-auto lg:mx-0">
              Accompagnement psychologique personnalisé pour retrouver
              l&apos;équilibre et le bien-être.
              <span className="font-semibold text-gray-800">
                {" "}
                Expérience hospitalière et centaines de patients accompagnés
              </span>{" "}
              au service de votre santé mentale.
            </p>

            <div className="hidden md:flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 sm:gap-6 mb-8 text-sm text-gray-600">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                  <Shield className="w-4 h-4 text-blue-600" />
                </div>
                <span>Confidentialité garantie</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-2">
                  <Clock className="w-4 h-4 text-green-600" />
                </div>
                <span>Horaires flexibles</span>
              </div>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center mr-2">
                  <Star className="w-4 h-4 text-yellow-600" />
                </div>
                <span>Centaines de patients</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 items-center justify-center lg:justify-start">
              <Link href="/book">
                <Button className="w-full sm:w-auto cursor-pointer bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                  <Calendar className="w-5 h-5 mr-2" />
                  Prendre Rendez-vous
                </Button>
              </Link>
              <Link href="/about">
                <Button
                  variant="outline"
                  className="w-full cursor-pointer sm:w-auto border-2 border-gray-300 hover:border-gray-400 px-6 sm:px-8 py-3 sm:py-4 text-base sm:text-lg font-medium hover:bg-gray-50 transition-all duration-300"
                >
                  <Info className="w-5 h-5 mr-2" />
                  En savoir plus
                </Button>
              </Link>
            </div>
          </div>

          {/* image section */}
          <div className="relative mt-8 lg:mt-0 flex justify-center lg:block">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-200/30 to-green-200/30 rounded-2xl blur-xl"></div>

            <div className="relative rounded-2xl overflow-hidden shadow-2xl border-4 border-white/50 backdrop-blur-sm aspect-square w-[300px] sm:w-[400px] lg:w-[500px] group">
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <Image
                src="/hero_image.jpeg"
                alt="Dr. Malika Lkhabir - Psychologue Clinicienne"
                className="object-cover w-full h-full transform group-hover:scale-105 transition-transform duration-500"
                width={828}
                height={552}
              />

              {/* Floating credential badge */}
              <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm rounded-lg px-3 py-2 shadow-lg">
                <div className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-blue-600" />
                  <div>
                    <p className="text-xs font-semibold text-gray-800">
                      Psychologue Certifiée
                    </p>
                    <p className="text-xs text-gray-600">Maroc - Certifiée</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Quote Section - Full width */}
      <div className="relative py-20 bg-gradient-to-r from-gray-50 to-gray-100 w-screen left-1/2 -translate-x-1/2">
        <div className="max-w-4xl mx-auto text-center px-4">
          <Quote className="w-12 h-12 text-gray-400 mx-auto mb-6" />
          <blockquote className="text-2xl lg:text-3xl font-medium text-gray-800 leading-relaxed mb-6 italic">
            &quot;Jamais la psychologie ne pourra dire sur la folie la vérité,
            puisque c&apos;est la folie qui détient la vérité de la
            psychologie.&quot;
          </blockquote>
          <cite className="text-gray-600 font-medium">Michel Foucault</cite>
        </div>
      </div>

      {/* Trust & Credentials Section */}
      <section className="pt-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">
              Pourquoi me choisir
            </Badge>
            <h2 className="text-4xl font-bold mb-4">Une expertise reconnue</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Formation universitaire complète et expérience hospitalière avec
              des centaines de patients accompagnés
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">300+</CardTitle>
                <CardDescription>Patients accompagnés</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl">Certifiée</CardTitle>
                <CardDescription>Formation universitaire</CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Star className="w-8 h-8 text-yellow-600" />
                </div>
                <CardTitle className="text-2xl">4.9/5</CardTitle>
                <CardDescription>Note moyenne clients</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="secondary">
              Témoignages
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              Ce que disent mes patients
            </h2>
            <p className="text-xl text-gray-600">
              Des transformations réelles, des vies changées
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-300">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <Quote className="w-8 h-8 text-blue-400 mb-4" />
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  &quot;Dr. Lkhabir m&apos;a aidé à retrouver confiance en moi
                  après une période très difficile. Son approche bienveillante
                  et professionnelle a fait toute la différence.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                    S
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">Sarah M.</p>
                    <p className="text-sm text-gray-500">Patiente suivie</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-300">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <Quote className="w-8 h-8 text-blue-400 mb-4" />
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  &quot;Un accompagnement exceptionnel qui nous a permis de
                  sauver notre mariage. Nous recommandons vivement Dr. Lkhabir
                  pour les thérapies de couple.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-600 rounded-full flex items-center justify-center text-white font-semibold">
                    A
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">Ahmed & Fatima</p>
                    <p className="text-sm text-gray-500">Thérapie de couple</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center mb-4">
                  <div className="flex text-yellow-300">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-5 h-5 fill-current" />
                    ))}
                  </div>
                </div>
                <Quote className="w-8 h-8 text-blue-400 mb-4" />
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-4">
                  &quot;Professionnelle, empathique et efficace. Les séances
                  m&apos;ont aidé à surmonter mes phobies et à reprendre le
                  contrôle de ma vie.&quot;
                </p>
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-yellow-600 rounded-full flex items-center justify-center text-white font-semibold">
                    K
                  </div>
                  <div className="ml-3">
                    <p className="font-semibold">Karim L.</p>
                    <p className="text-sm text-gray-500">Suivi individuel</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <Badge className="mb-4" variant="outline">
              Mes services
            </Badge>
            <h2 className="text-4xl font-bold mb-4">
              Un accompagnement personnalisé
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Chaque parcours est unique. Je vous propose des solutions adaptées
              à vos besoins spécifiques.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Heart className="w-8 h-8 text-blue-600" />
                </div>
                <CardTitle>Thérapie individuelle</CardTitle>
                <CardDescription>
                  Accompagnement personnalisé pour surmonter les difficultés
                  personnelles et émotionnelles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CircleCheckIcon className="w-4 h-4 text-blue-600 mr-2" />
                    Anxiété et stress
                  </li>
                  <li className="flex items-center">
                    <CircleCheckIcon className="w-4 h-4 text-blue-600 mr-2" />
                    Dépression
                  </li>
                  <li className="flex items-center">
                    <CircleCheckIcon className="w-4 h-4 text-blue-600 mr-2" />
                    Confiance en soi
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle>Thérapie de couple</CardTitle>
                <CardDescription>
                  Renforcer votre relation et améliorer la communication dans
                  votre couple
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CircleCheckIcon className="w-4 h-4 text-green-600 mr-2" />
                    Communication
                  </li>
                  <li className="flex items-center">
                    <CircleCheckIcon className="w-4 h-4 text-green-600 mr-2" />
                    Conflits relationnels
                  </li>
                  <li className="flex items-center">
                    <CircleCheckIcon className="w-4 h-4 text-green-600 mr-2" />
                    Intimité
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
              <CardHeader>
                <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="w-8 h-8 text-yellow-600" />
                </div>
                <CardTitle>Suivi thérapeutique</CardTitle>
                <CardDescription>
                  Accompagnement continu et personnalisé pour un suivi
                  thérapeutique adapté à votre rythme
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center">
                    <CircleCheckIcon className="w-4 h-4 text-yellow-600 mr-2" />
                    Suivi personnalisé
                  </li>
                  <li className="flex items-center">
                    <CircleCheckIcon className="w-4 h-4 text-yellow-600 mr-2" />
                    Horaires flexibles
                  </li>
                  <li className="flex items-center">
                    <CircleCheckIcon className="w-4 h-4 text-yellow-600 mr-2" />
                    Accompagnement continu
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Strong CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-5xl font-bold mb-6">
            Prêt(e) à commencer votre transformation ?
          </h2>
          <p className="text-xl mb-8 max-w-3xl mx-auto opacity-90">
            Ne laissez pas les difficultés définir votre vie. Prenez rendez-vous
            dès aujourd&apos;hui et faites le premier pas vers un mieux-être
            durable.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <Link href="/book">
              <Button
                size="lg"
                className="text-lg cursor-pointer px-8 py-4 hover:scale-101 transition-all duration-200"
              >
                <Calendar className="w-5 h-5 mr-2" />
                Prendre Rendez-vous Maintenant
              </Button>
            </Link>
            <Link href="/about">
              <Button
                size="lg"
                variant="outline"
                className="text-lg cursor-pointer px-8 py-4 border-white text-neutral-900 hover:bg-white hover:scale-101 transition-all duration-200"
              >
                <Info className="w-5 h-5 mr-2" />
                En Savoir Plus
              </Button>
            </Link>
          </div>

          <div className="flex flex-col sm:flex-row gap-8 justify-center items-center text-sm opacity-80">
            <div className="flex items-center">
              <Clock className="w-4 h-4 mr-2" />
              Consultation rapide disponible
            </div>
            <div className="flex items-center">
              <Shield className="w-4 h-4 mr-2" />
              Confidentialité absolue garantie
            </div>
            <div className="flex items-center">
              <Heart className="w-4 h-4 mr-2" />
              Accompagnement bienveillant
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

<Card className="text-center hover:shadow-lg transition-shadow">
  <CardHeader>
    <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
      <Star className="w-8 h-8 text-yellow-600" />
    </div>
    <CardTitle className="text-2xl">4.9/5</CardTitle>
    <CardDescription>Note moyenne clients</CardDescription>
  </CardHeader>
</Card>;

{
  /* Services Section */
}
<section className="py-20">
  <div className="container mx-auto px-4">
    <div className="text-center mb-16">
      <Badge className="mb-4" variant="outline">
        Mes services
      </Badge>
      <h2 className="text-4xl font-bold mb-4">
        Un accompagnement personnalisé
      </h2>
      <p className="text-xl text-gray-600 max-w-3xl mx-auto">
        Chaque parcours est unique. Je vous propose des solutions adaptées à vos
        besoins spécifiques.
      </p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader>
          <Heart className="w-12 h-12 text-gray-600 mb-4" />
          <CardTitle>Thérapie individuelle</CardTitle>
          <CardDescription>
            Accompagnement personnalisé pour surmonter les difficultés
            personnelles et émotionnelles
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <CircleCheckIcon className="w-4 h-4 text-gray-500 mr-2" />
              Anxiété et stress
            </li>
            <li className="flex items-center">
              <CircleCheckIcon className="w-4 h-4 text-gray-500 mr-2" />
              Dépression
            </li>
            <li className="flex items-center">
              <CircleCheckIcon className="w-4 h-4 text-gray-500 mr-2" />
              Confiance en soi
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader>
          <Users className="w-12 h-12 text-gray-600 mb-4" />
          <CardTitle>Thérapie de couple</CardTitle>
          <CardDescription>
            Renforcer votre relation et améliorer la communication dans votre
            couple
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <CircleCheckIcon className="w-4 h-4 text-gray-500 mr-2" />
              Communication
            </li>
            <li className="flex items-center">
              <CircleCheckIcon className="w-4 h-4 text-gray-500 mr-2" />
              Conflits relationnels
            </li>
            <li className="flex items-center">
              <CircleCheckIcon className="w-4 h-4 text-gray-500 mr-2" />
              Intimité
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-all duration-300 hover:-translate-y-1">
        <CardHeader>
          <Shield className="w-12 h-12 text-gray-600 mb-4" />
          <CardTitle>Consultation d&apos;urgence</CardTitle>
          <CardDescription>
            Support immédiat pour les situations de crise émotionnelle ou
            psychologique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center">
              <CircleCheckIcon className="w-4 h-4 text-gray-500 mr-2" />
              Disponibilité 24/7
            </li>
            <li className="flex items-center">
              <CircleCheckIcon className="w-4 h-4 text-gray-500 mr-2" />
              Intervention rapide
            </li>
            <li className="flex items-center">
              <CircleCheckIcon className="w-4 h-4 text-gray-500 mr-2" />
              Support spécialisé
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  </div>
</section>;

{
  /* Testimonials Section */
}
<section className="py-20 bg-gray-50">
  <div className="container mx-auto px-4">
    <div className="text-center mb-16">
      <Badge className="mb-4" variant="secondary">
        Témoignages
      </Badge>
      <h2 className="text-4xl font-bold mb-4">Ce que disent mes patients</h2>
      <p className="text-xl text-gray-600">
        Des transformations réelles, des vies changées
      </p>
    </div>

    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center mb-4">
            <div className="flex text-gray-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
          </div>
          <Quote className="w-8 h-8 text-gray-400 mb-4" />
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            &quot;Dr. Lkhabir m&apos;a aidé à retrouver confiance en moi après
            une période très difficile. Son approche bienveillante et
            professionnelle a fait toute la différence.&quot;
          </p>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-500 rounded-full flex items-center justify-center text-white font-semibold">
              S
            </div>
            <div className="ml-3">
              <p className="font-semibold">Sarah M.</p>
              <p className="text-sm text-gray-500">Cliente depuis 2 ans</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center mb-4">
            <div className="flex text-gray-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
          </div>
          <Quote className="w-8 h-8 text-gray-400 mb-4" />
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            &quot;Un accompagnement exceptionnel qui nous a permis de sauver
            notre mariage. Nous recommandons vivement Dr. Lkhabir pour les
            thérapies de couple.&quot;
          </p>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-semibold">
              A
            </div>
            <div className="ml-3">
              <p className="font-semibold">Ahmed & Fatima</p>
              <p className="text-sm text-gray-500">Thérapie de couple</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader>
          <div className="flex items-center mb-4">
            <div className="flex text-gray-400">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 fill-current" />
              ))}
            </div>
          </div>
          <Quote className="w-8 h-8 text-gray-400 mb-4" />
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">
            &quot;Professionnelle, empathique et efficace. Les séances
            m&apos;ont aidé à surmonter mes phobies et à reprendre le contrôle
            de ma vie.&quot;
          </p>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center text-white font-semibold">
              K
            </div>
            <div className="ml-3">
              <p className="font-semibold">Karim L.</p>
              <p className="text-sm text-gray-500">Suivi individuel</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</section>;
