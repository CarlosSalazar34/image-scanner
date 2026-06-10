import { GoogleGenAI } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

export async function POST(req: NextRequest) {
  try {
    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Se requiere una imagen en base64." },
        { status: 400 }
      );
    }

    // Remove the data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                mimeType: "image/jpeg",
                data: base64Data,
              },
            },
            {
              text: `Eres un OCR avanzado. Transcribe TODO el texto visible en esta imagen con la mayor precisión posible.

Reglas:
- Mantén el formato original (párrafos, listas, tablas).
- Si hay una tabla, represéntala con formato de tabla.
- Si hay texto manuscrito, haz tu mejor esfuerzo por transcribirlo.
- Si NO hay texto visible, describe brevemente el contenido de la imagen.
- Responde solo con la transcripción, sin añadir comentarios ni explicaciones extras.`,
            },
          ],
        },
      ],
    });

    const text =
      response.candidates?.[0]?.content?.parts?.[0]?.text ??
      "No se pudo extraer texto de la imagen.";

    return NextResponse.json({ text });
  } catch (error: any) {
    console.error("Gemini API error:", error);

    if (error?.status === 429) {
      return NextResponse.json(
        { error: "Demasiadas solicitudes. Espera un momento e intenta de nuevo." },
        { status: 429 }
      );
    }

    return NextResponse.json(
      { error: "Error al procesar la imagen. Intenta de nuevo." },
      { status: 500 }
    );
  }
}
