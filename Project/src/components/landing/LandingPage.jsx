import { Link } from "react-router-dom";
import { ArrowRight, Shield, QrCode, MapPin, Truck, Eye } from "lucide-react";
import { Button } from "../common/Button";
import { GuacamoleIcon } from "../common/GuacamoleLogo";
import heroBg from "../../assets/hero.jpg";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <GuacamoleIcon size={32} />
            <span className="text-xl font-bold text-slate-900">Guacamole</span>
          </Link>
          <div className="flex items-center gap-3">
            <a
              href="https://stellar.org"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1 text-sm text-slate-500 hover:text-slate-700 transition"
            >
              Powered by Stellar
            </a>
            <Link to="/app">
              <Button size="sm">
                Probar Demo <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-[600px] flex items-center overflow-hidden">
        {/* Background image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/50 to-black/25" />

        {/* Content */}
        <div className="relative z-10 max-w-6xl mx-auto px-4 py-24 h-[calc(100vh-4rem)] w-screen">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm text-white text-sm font-semibold px-4 py-2 rounded-full mb-6 border border-white/20">
              <Shield className="w-4 h-4" />
              Verificado en Blockchain Stellar
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6 drop-shadow-lg">
              Trazabilidad agrícola
              <br />
              <span className="text-green-400">del campo a tu mesa</span>
            </h1>
            <p className="text-lg text-white/80 max-w-xl mb-10 leading-relaxed">
              Registra, verifica y comparte el origen de tus productos agrícolas
              con tecnología blockchain. Transparencia total para productores,
              intermediarios y consumidores.
            </p>
            <div className="flex flex-col sm:flex-row items-start gap-4">
              <Link to="/app">
                <Button size="lg">
                  Comenzar Demo <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Link to="/app/traceability/demo">
                <Button
                  variant="outline"
                  size="lg"
                  className="border-white/60 text-white hover:bg-white/10"
                >
                  <Eye className="w-5 h-5 mr-2" /> Ver Ejemplo de Trazabilidad
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <div className="text-center mb-14">
          <h2 className="text-3xl font-bold text-slate-900 my-3">
            ¿Cómo funciona?
          </h2>
          <p className="text-slate-500">
            Tres pasos simples para garantizar la trazabilidad
          </p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              icon: MapPin,
              color: "bg-green-100 text-primary",
              title: "Registro de Origen",
              desc: "El productor registra su huerta con ubicación GPS y foto, creando una identidad digital verificable en blockchain.",
            },
            {
              icon: QrCode,
              color: "bg-yellow-100 text-accent",
              title: "Trazabilidad por Lote",
              desc: "Cada cosecha se documenta con foto, GPS y peso. Se genera un NFT y código QR único para seguimiento.",
            },
            {
              icon: Truck,
              color: "bg-blue-100 text-blue-600",
              title: "Verificación en Destino",
              desc: "El intermediario escanea el QR, registra datos de calidad y confirma la recepción en la cadena de bloques.",
            },
          ].map((feature, i) => (
            <div
              key={i}
              className="bg-surface border border-slate-100 rounded-2xl p-7 hover:shadow-lg transition-shadow"
            >
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${feature.color}`}
              >
                <feature.icon className="w-7 h-7" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-slate-500 text-sm leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section className="bg-primary py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "100%", label: "Transparente" },
              { value: "GPS", label: "Geolocalizado" },
              { value: "NFT", label: "Por cada lote" },
              { value: "QR", label: "Escaneable" },
            ].map((stat, i) => (
              <div key={i}>
                <div className="text-3xl font-extrabold text-white mb-1">
                  {stat.value}
                </div>
                <div className="text-green-100 text-sm">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-6xl mx-auto px-4 py-24 text-center">
        <h2 className="text-3xl font-bold text-slate-900 mb-4">
          ¿Listo para transformar tu cadena de suministro?
        </h2>
        <p className="text-slate-500 mb-8 max-w-lg mx-auto">
          Prueba el demo completo y descubre cómo la blockchain puede garantizar
          la transparencia de tus productos.
        </p>
        <Link to="/app">
          <Button size="lg">
            Probar Demo Ahora <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-sm text-slate-400">
            <GuacamoleIcon size={16} />
            <span>Guacamole © 2026 — Mx Alebrijes</span>
          </div>
          <div className="flex items-center gap-4 text-sm text-slate-400">
            <span>Construido con Stellar & Soroban</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
