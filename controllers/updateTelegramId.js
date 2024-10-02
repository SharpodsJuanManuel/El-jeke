const axios = require("axios");
require("dotenv").config();

const apiKey = "4d817055568f55827965e74a42f3679c"; 
const baseUrl = `https://sharpods.com/wp-json/funnelkit-automations/contact/update`;

async function updateTelegramId(contactId, telegramId) {
    console.log("desde otro file el telegram id", telegramId)
    try {
        
        const url = `${baseUrl}/${contactId}?api_key=${apiKey}`; 
        console.log("URL construida:", url); 

        const body = {
            fields: {
                20: telegramId
            }
        };
        
        const response = await axios.post(url, body, {
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
        });
        
        console.log("Respuesta de la API:", response.data);
    } catch (error) {
        console.error("Error al actualizar el ID de Telegram:", error.message);
        console.error("Detalles del error:", error.response ? error.response.data : "No hay respuesta de la API");
    }
}

module.exports = {
    updateTelegramId
}
