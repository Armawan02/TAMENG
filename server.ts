import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const SYSTEM_INSTRUCTION = `PENTING: KAMU HARUS MENGEMBALIKAN OUTPUT DALAM FORMAT JSON VALID! TIDAK ADA FORMAT LAIN SELAIN JSON!

Peran & Persona: Kamu adalah "Tameng.", sistem AI intelijen anti-penipuan & manipulasi forensik. Kamu sekarang dilengkapi kemampuan visi untuk membaca Screenshot. 
Tugasmu membongkar taktik manipulasi (Eksploitasi Nalar Gawai) dari teks atau screenshot.
Bahasa: Menenangkan, profesional, menggunakan analogi sehari-hari agar awam/lansia paham.

Analisis Utama:
1. Urgensi Palsu (Mendesak bertindak cepat)
2. Manipulasi Emosi (Membuat takut/panik)
3. Ilusi Keuntungan (Tawaran hadiah fiktif)
4. Eksploitasi Nalar Gawai (Gaya bahasa berpura-pura jadi teman/keluarga/otoritas)
5. Ekstraksi Entitas: Cari nomor rekening atau nomor telepon yang dicurigai.

Format JSON Wajib:
{
  "risk_score": <angka 0-100>,
  "risk_level": "<BAHAYA | WASPADA | AMAN>",
  "assurance_message": "<Pesan menenangkan 1-2 kalimat (misal: 'Tarik napas, jangan panik...')>",
  "tactics": [
    {
      "quote": "<Kutipan mencurigakan dari teks/screenshot>",
      "name": "<Nama Taktik>",
      "explanation": "<Penjelasan taktik dengan analogi sehari-hari>"
    }
  ],
  "extracted_entities": [
    {
      "label": "<Nomor Telepon / Nomor Rekening>",
      "value": "<Angka yang diekstrak>",
      "advice": "<Saran: misal 'Cek di GetContact' atau 'CekRekening.id (Kominfo)'>"
    }
  ],
  "action_steps": [
    "<Langkah perlindungan 1>",
    "<Langkah perlindungan 2>",
    "<Langkah perlindungan 3>"
  ],
  "incident_report_template": "<Template laporan obyektif (tanpa menuduh) untuk memperingatkan keluarga/rekan kerja agar waspada, berikan instruksi verifikasi resmi>"
}`;

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "50mb" }));

  app.post("/api/analyze", async (req, res) => {
    try {
      const { message, imageBase64, analysisMode } = req.body;
      if (!message && !imageBase64) {
        return res.status(400).json({ error: "Message or image is required." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured." });
      }

      let modeContext = "";
      if (analysisMode === "apk") {
          modeContext = "\n\nFOKUS ANALISIS (MODE PAKAR): Ini adalah instruksi spesifik. Fokuskan analisis secara mendalam pada deteksi taktik 'Malware APK / Phishing Tautan' seperti modus kurir paket palsu, undangan pernikahan digital palsu, surat tilang palsu, file PDF palsu dll.";
      } else if (analysisMode === "job") {
          modeContext = "\n\nFOKUS ANALISIS (MODE PAKAR): Ini adalah instruksi spesifik. Fokuskan analisis secara mendalam pada deteksi taktik 'Penipuan Lowongan Kerja / Task Scam' seperti tawaran kerja paruh waktu/freelance yang terlalu mudah (contoh: sekadar like/subscribe Youtube, ulas produk) yang biasanya berujung pada keharusan korban melakukan deposit kripto/uang.";
      } else if (analysisMode === "romance") {
          modeContext = "\n\nFOKUS ANALISIS (MODE PAKAR): Ini adalah instruksi spesifik. Fokuskan analisis secara mendalam pada deteksi taktik 'Romance Scam / Pig Butchering' seperti pendekatan emosional jangka panjang, membangun kepercayaan melalui aplikasi kencan, merayu, lalu perlahan mengarahkan korban untuk berinvestasi bodong (kripto/trading).";
      } else if (analysisMode === "emergency") {
          modeContext = "\n\nFOKUS ANALISIS (MODE PAKAR): Ini adalah instruksi spesifik. Fokuskan analisis secara mendalam pada deteksi taktik 'Darurat Palsu' seperti pelaku mengaku sebagai anggota keluarga, teman, atau bos yang tiba-tiba membutuhkan dana cepat talangan, kecelakaan, ditangkap polisi, minta pulsa, dsb.";
      }

      const generatedInstruction = SYSTEM_INSTRUCTION + modeContext;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      
      const contents = [];
      if (message) contents.push(message);
      if (imageBase64) {
         const base64Data = imageBase64.split(',')[1];
         const mimeType = imageBase64.split(';')[0].split(':')[1];
         contents.push({
           inlineData: { data: base64Data, mimeType }
         });
      }

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents,
        config: {
          systemInstruction: generatedInstruction,
          responseMimeType: "application/json"
        }
      });

      // PENTING: Bersihkan output dari block markdown (regex perlindungan)
      let responseText = response.text || "";
      responseText = responseText.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();

      const parsedResult = JSON.parse(responseText);
      res.json({ result: parsedResult });
    } catch (error) {
      console.error("Analysis error:", error);
      res.status(500).json({ error: "Telah terjadi kesalahan saat menganalisis. Pastikan input valid atau coba lagi." });
    }
  });

  app.post("/api/generate_report", async (req, res) => {
    try {
      const { category, chronology } = req.body;
      if (!chronology) {
        return res.status(400).json({ error: "Chronology is required." });
      }

      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({ error: "Gemini API key is not configured." });
      }
      
      const prompt = `Buat DRAFT LAPORAN KEPOLISIAN (Surat Tanda Terima Laporan Polisi - STTLP) yang formal, terstruktur, obyektif, dan sesuai dengan standar tata bahasa Kepolisian Negara Republik Indonesia (Polri) mengenai tindak pidana siber.
      
Kategori Tindak Pidana: ${category}
Kronologi dari Pelapor: 
"${chronology}"

Instruksi Output:
Gunakan gaya bahasa hukum kepolisian ("Pada hari ini... telah datang ke SPKT...", "Bahwa pelapor...", "Pasal yang disangkakan..."). Buat selengkap mungkin dengan placeholder [Diisi...] pada bagian identitas.
Kembalikan format JSON HANYA berikut:
{
  "report_text": "<Teks draft laporan kepolisian yang lengkap dan rapi>",
  "advice": "<Saran tindakan fisik yang harus dilakukan pelapor, misal: print mutasi rekening>"
}`;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [prompt],
        config: {
          responseMimeType: "application/json"
        }
      });

      let responseText = response.text || "";
      responseText = responseText.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
      const parsedResult = JSON.parse(responseText);
      res.json(parsedResult);
    } catch (error) {
      console.error("Generate report error:", error);
      res.status(500).json({ error: "Gagal membuat draf laporan." });
    }
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
