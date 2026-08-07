/**
 * Página de Ayuda - Origen Marketplace
 * @module app/ayuda/page
 * @version 3.0.0 - Rediseño con Manual de Marca v3.0 "Bosque Profundo"
 * @description Centro de ayuda alineado con el resto de páginas públicas
 * (contacto, cómo funciona, casos de éxito): mismo header, hero y footer.
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@arcediano/ux-library';
import { AuthFooter } from '@arcediano/ux-library';
import {
  Store,
  ArrowRight,
  Sparkles,
  ChevronDown,
  Package,
  ShoppingCart,
  User,
  Bell,
  Mail,
  Phone,
  ChevronRight,
  LifeBuoy,
} from 'lucide-react';

const FAQ_ITEMS = [
  {
    question: '¿Cómo publico un producto nuevo?',
    answer: 'Ve a "Mi catálogo" en tu panel y pulsa "Nuevo producto". Completa fotos, descripción, precio y stock — nuestro asistente te guía paso a paso.',
    href: '/dashboard/products',
    linkLabel: 'Ir a mi catálogo',
  },
  {
    question: '¿Cómo gestiono un pedido recibido?',
    answer: 'En "Pedidos" verás cada pedido con su estado. Puedes marcarlo como preparado, añadir el número de envío y comunicarte con el comprador desde la misma ficha.',
    href: '/dashboard/orders',
    linkLabel: 'Ir a mis pedidos',
  },
  {
    question: '¿Cómo completo mi perfil comercial?',
    answer: 'En "Mi cuenta → Perfil comercial" puedes añadir tus datos personales, información de negocio y certificaciones. Un perfil completo mejora tu visibilidad en el marketplace.',
    href: '/dashboard/profile',
    linkLabel: 'Completar perfil',
  },
  {
    question: '¿Cómo gestiono mis notificaciones?',
    answer: 'En "Configuraciones" puedes elegir qué avisos recibes por email y cuáles por notificación push, y consultar el historial completo en cualquier momento.',
    href: '/dashboard/notifications',
    linkLabel: 'Ver notificaciones',
  },
] as const;

const QUICK_LINKS = [
  { icon: Package, title: 'Catálogo', description: 'Publica y gestiona tus productos', href: '/dashboard/products' },
  { icon: ShoppingCart, title: 'Pedidos', description: 'Consulta y procesa tus ventas', href: '/dashboard/orders' },
  { icon: User, title: 'Mi cuenta', description: 'Seguridad, cobros y perfil comercial', href: '/dashboard/account' },
  { icon: Bell, title: 'Notificaciones', description: 'Preferencias de avisos', href: '/dashboard/configuracion' },
] as const;

function FaqAccordionItem({ item }: { item: (typeof FAQ_ITEMS)[number] }) {
  const [open, setOpen] = useState(false);

  return (
    <Card variant="section" padding="md" className="overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-4 text-left"
      >
        <span className="text-sm font-semibold text-origen-bosque">{item.question}</span>
        <ChevronDown
          className={`w-4 h-4 text-text-subtle flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
        />
      </button>
      {open && (
        <div className="mt-3 pt-3 border-t border-border-subtle space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
          <Link
            href={item.href}
            className="inline-flex items-center gap-1 text-sm font-medium text-hoja-tinta hover:underline"
          >
            {item.linkLabel}
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </Card>
  );
}

export default function HelpCenterPage() {
  return (
    <div className="min-h-screen bg-origen-crema/30">

      {/* ================================================================
          HEADER — idéntico al de contacto/login
      ================================================================ */}
      <header className="sticky top-0 z-40 w-full bg-surface-alt/95 backdrop-blur-sm border-b border-border">
        <div className="container mx-auto px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/"
              className="flex items-center gap-2 md:gap-3 group focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2 rounded-lg p-1"
            >
              <img
                src="/origen-icon.svg"
                alt=""
                width={44}
                height={44}
                className="w-10 h-10 md:w-11 md:h-11 group-hover:scale-105 transition-transform"
              />
              <div className="flex flex-col">
                <span className="text-lg md:text-xl font-semibold text-origen-bosque leading-tight">Origen.</span>
                <span className="text-[10px] md:text-xs text-hoja-tinta -mt-1">Productores locales</span>
              </div>
            </Link>

            <Link
              href="/contacto"
              className="inline-flex items-center gap-1.5 md:gap-2 text-sm font-medium text-origen-bosque border-2 border-origen-pradera/30 hover:border-origen-pradera bg-surface-alt hover:bg-origen-crema px-4 py-2 rounded-full transition-all focus:outline-none focus:ring-2 focus:ring-origen-pradera focus:ring-offset-2"
            >
              <Store className="w-4 h-4 text-hoja-tinta" />
              <span className="hidden sm:inline">Contactar soporte</span>
              <span className="sm:hidden">Contacto</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* ================================================================
          MAIN
      ================================================================ */}
      <main className="container mx-auto px-4 md:px-6 py-6 md:py-12 lg:py-16">
        <div className="max-w-4xl mx-auto">

          {/* Hero */}
          <div className="text-center mb-10 md:mb-12 space-y-3">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-origen-pradera/10 to-origen-hoja/10 rounded-full px-4 py-2 border border-origen-pradera/30">
              <Sparkles className="w-4 h-4 text-hoja-tinta" />
              <span className="text-xs md:text-sm font-semibold text-origen-bosque">Centro de ayuda</span>
            </div>
            <h1 className="text-2xl md:text-4xl font-bold text-origen-bosque">
              ¿En qué podemos <span className="text-origen-hoja">ayudarte?</span>
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
              Resuelve tus dudas sobre catálogo, pedidos y tu cuenta, o contacta directamente
              con nuestro equipo de soporte.
            </p>
          </div>

          {/* Accesos rápidos */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-10 md:mb-12">
            {QUICK_LINKS.map((item) => {
              const Icon = item.icon;
              return (
                <Link key={item.title} href={item.href} className="group">
                  <Card variant="section" padding="md" className="h-full">
                    <div className="w-10 h-10 rounded-xl bg-origen-pradera/10 flex items-center justify-center mb-3 group-hover:bg-origen-pradera/15 transition-colors">
                      <Icon className="w-5 h-5 text-hoja-tinta" />
                    </div>
                    <p className="text-sm font-semibold text-origen-bosque">{item.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{item.description}</p>
                  </Card>
                </Link>
              );
            })}
          </div>

          {/* FAQ */}
          <div className="mb-10 md:mb-12">
            <h2 className="text-lg font-bold text-origen-bosque mb-4 flex items-center gap-2">
              <LifeBuoy className="w-5 h-5 text-hoja-tinta" />
              Preguntas frecuentes
            </h2>
            <div className="space-y-3">
              {FAQ_ITEMS.map((item) => (
                <FaqAccordionItem key={item.question} item={item} />
              ))}
            </div>
          </div>

          {/* Contacto directo */}
          <Card variant="section" padding="md">
            <CardContent className="p-0 sm:p-2">
              <h2 className="text-lg font-bold text-origen-bosque mb-1">¿No encuentras lo que buscas?</h2>
              <p className="text-sm text-muted-foreground mb-5">
                Escríbenos y te responderemos en menos de 24 horas.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <a
                  href="mailto:soporte@origen.com"
                  className="flex items-center gap-3 rounded-xl border border-border p-4 hover:border-origen-pradera hover:bg-origen-crema/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-origen-crema flex items-center justify-center flex-shrink-0">
                    <Mail className="h-5 w-5 text-hoja-tinta" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-origen-bosque">Email de soporte</p>
                    <p className="text-sm text-muted-foreground truncate">soporte@origen.com</p>
                  </div>
                </a>
                <a
                  href="tel:+34911234567"
                  className="flex items-center gap-3 rounded-xl border border-border p-4 hover:border-origen-pradera hover:bg-origen-crema/30 transition-colors"
                >
                  <div className="w-10 h-10 rounded-full bg-origen-crema flex items-center justify-center flex-shrink-0">
                    <Phone className="h-5 w-5 text-hoja-tinta" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-origen-bosque">Teléfono</p>
                    <p className="text-sm text-muted-foreground">+34 91 123 45 67</p>
                  </div>
                </a>
              </div>
            </CardContent>
          </Card>

        </div>
      </main>

      {/* ================================================================
          FOOTER
      ================================================================ */}
      <AuthFooter variant="info" linkComponent={Link} />
    </div>
  );
}
