import type { Metadata } from "next"

import { EditorDePlantillas } from "@/components/panel/editor-de-plantillas"
import { EncabezadoDeClientes } from "@/components/panel/pestanas-clientes"
import { exigirPanel } from "@/lib/panel/sesion"
import { plantillasWhatsapp } from "@/lib/panel/whatsapp"

export const metadata: Metadata = { title: "Mensajes guardados" }

export default async function MensajesGuardados() {
  await exigirPanel("clientes")
  const plantillas = await plantillasWhatsapp()
  return (
    <main className="px-4 py-6 md:px-8 md:py-8">
      <EncabezadoDeClientes activa="mensajes" titulo="Mensajes guardados" bajada="Los textos que se proponen al mandar un WhatsApp. Al enviar se elige uno y se puede retocar para ese cliente." />
      <div className="mt-6">
        <EditorDePlantillas plantillas={plantillas} />
      </div>
    </main>
  )
}
