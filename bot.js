require('dotenv').config();
const express = require('express');
const bodyParser = require('body-parser');
const OpenAI = require('openai');  
const PDFDocument = require('pdfkit');  
const fs = require('fs');
const nodemailer = require('nodemailer'); 

const app = express();
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,  
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD
  }
});

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

function enviarEmail(destinatario, nombreArchivo, res) {
  const mailOptions = {
    from: process.env.EMAIL,
    to: destinatario,
    subject: 'Informe del Partido de Fútbol',
    text: 'Adjunto encontrarás el informe oficial del partido.',
    attachments: [
      {
        filename: nombreArchivo,
        path: `./${nombreArchivo}`
      }
    ]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
      res.status(500).send('Error enviando el email.');
    } else {
      console.log('Email enviado: ' + info.response);
      res.status(200).send('Informe enviado por email correctamente.');
      fs.unlinkSync(nombreArchivo);  // Eliminar el archivo después de enviarlo
    }
  });
}

app.get('/', (req, res) => {
  res.send('Servidor funcionando correctamente.');
});

app.post('/generar-informe', async (req, res) => {
  try {
    const { respuestas, email } = req.body;

    let prompt = "Crea un informe oficial de un partido de fútbol bajo las normas españolas:\n";
    preguntas.forEach((pregunta, i) => {
      prompt += `${pregunta}: ${respuestas[i]}\n`;
    });

    const completion = await openai.chat.completions.create({
      model: 'gpt-4',
      messages: [{ role: 'system', content: prompt }],
      max_tokens: 500,
    });

    const informe = completion.choices[0].message.content.trim();
    
    const nombreArchivo = `informe_${Date.now()}.pdf`;
    generarPDF(informe, nombreArchivo);

    enviarEmail(email, nombreArchivo, res);

  } catch (error) {
    console.error(error);
    res.status(500).send("Error generando el informe.");
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en el puerto ${PORT}`);
});

