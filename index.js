const express = require("express");
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");

dotenv.config();

const port = process.env.PORT || 5000;
app.use(express.json());
app.use(cors());
const clients = {};

app.post("/start-session", async (req, res) => {
  const { sessionId } = req.body;

  if (clients[sessionId]) {
    res.json({ qr: clients[sessionId].qrCode });
    return;
  }

  console.log(sessionId);
  if (clients[sessionId]) {
    return res.status(400).json({ error: "La sesión ya está iniciada." });
  }

  try {
    const client = new Client({
      authStrategy: new LocalAuth({ clientId: sessionId }),
      puppeteer: {
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      },
    });
    clients[sessionId] = { client, qrCode: null };

    client.on("qr", async (qr) => {
      clients[sessionId].qrCode = await qrcode.toDataURL(qr);
      console.log(`QR listo para ${sessionId}`);
    });

    client.on("ready", () => {
      console.log(`Cliente ${sessionId} está listo`);
    });

    client.on("authenticated", () => {
      console.log(`Cliente ${sessionId} autenticado`);
      clients[sessionId].qrCode = null;
    });

    client.on("disconnected", () => {
      console.log(`Cliente ${sessionId} desconectado`);
      delete clients[sessionId];
    });

    await client.initialize();
  } catch (error) {
    console.error("Error al iniciar la sesión:", error);
    return res.status(500).json({ error: "Error al iniciar la sesión." });
  }

  console.log("clients clients[sessionId]:", clients[sessionId].qrCode);

  res.json({ qr: clients[sessionId].qrCode });
});

app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
