const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
const { Configuration, OpenAIApi } = require('openai');
const PDFDocument = require('pdfkit');
const fs = require('fs');

dotenv.config();

const app = express();
app.use(bodyParser.json());

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

const generarPDF = (data) => {
  const doc = new PDFDocument();
  doc.pipe(fs.createWriteStream('informe.pdf'));
  doc.fontSize(25).text('Informe del Partido', { align: 'center' });
  doc.fontSize(12).text(`Detalles: ${data.detalles}`);
  doc.end();
};

app.post('/generar-informe', async (req, res) => {
  const { prompt } = req.body;

  try {
    const response = await openai.createCompletion({
      model: "text-davinci-003",
      prompt: prompt,
      max_tokens: 500,
    });

    const resultado = response.data.choices[0].text.trim();
    generarPDF({ detalles: resultado });
    res.status(200).json({ mensaje: 'Informe generado correctamente', resultado });
  } catch (error) {
    res.status(500).json({ mensaje: 'Error al generar el informe' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

