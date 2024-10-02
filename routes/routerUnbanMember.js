const express = require('express');
const { unbanChatMember } = require('../controllers/functions.handler');
const router = express.Router();
const usedEmail = require('../models/UsedEmail')

router.post("/", async (req, res) => {
    const { telegram_id, email } = req.body;
    const emailminus = email.toLowerCase();
    console.log(telegram_id, email)
    try{
        const propertyChange = await usedEmail.findOneAndUpdate({ email: emailminus }, { isActive: true });
        console.log('desde unbanChatMember.js');
        if (propertyChange) {
            console.log("Se ha actualizado la propiedad isActive");
            // Llamar a la función para expulsar al usuario después de actualizar
            await unbanChatMember(telegram_id);
            res.status(200).send("Se ha actualizado la propiedad isActive y el usuario ha sido desbaneado exitosamente.");
        } else {
            console.log("No se ha actualizado la propiedad isActive");
            res.status(400).send("No se ha actualizado la propiedad isActive");
        }
    } catch (error) {
        console.log(error);
        res.status(400).send("Error al actualizar la propiedad isActive");
    }
});


module.exports = router
