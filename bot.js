krequire('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const { Configuration, OpenAIApi } = require('openai');
const PDFDocument = require('pdfkit');
const fs = require('fs');

const app = express();
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const preguntas = [
  "¿Cuál es la categoría del partido?",
  "¿Qué equipos jugaron?",
  "¿Cuándo se celebró el partido?",
  "¿Hubo incidentes durante el partido?",
  "¿Hubo sanciones?",
  "Por favor, proporciona un resumen breve del partido."
];

function generarPDF(informe, nombreArchivo) {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream(nombreArchivo));

  doc.fontSize(25).text('Informe del Partido de Fútbol', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(informe);

  doc.end();
}

app.post('/generar-informe', async (req, res) => {
  try {
    const respuestas = req.body.respuestas; // Lista de respuestas del árbitro
    
    let prompt = "Crea un informe oficial de un partido de fútbol bajo las normas españolas:\n";
    preguntas.forEach((pregunta, i) => {
      prompt += `${pregunta}: ${respuestas[i]}\n`;
    });

    const completion = await openai.createCompletion({
      model: 'gpt-4',
      prompt: prompt,
      max_tokens: 500,
    });

    const informe = completion.data.choices[0].text.trim();
    
    const nombreArchivo = `informe_${Date.now()}.pdf`;
    generarPDF(informe, nombreArchivo);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${nombreArchivo}`);
    
    const fileStream = fs.createReadStream(nombreArchivo);
    fileStream.pipe(res);

    fileStream.on('end', () => {
      fs.unlinkSync(nombreArchivo);
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Error generando el informe.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

