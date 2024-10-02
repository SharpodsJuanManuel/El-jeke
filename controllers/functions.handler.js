const mongoose = require("mongoose");
const TelegramBot = require("node-telegram-bot-api");
const UsedEmail = require("../models/UsedEmail");
const correosUsados = require("../models/correosUsados");
const { searchContactByEmail } = require("./verifyTelegramId");
const { updateTelegramId } = require("./updateTelegramId");

const token = "7382801594:AAEIrd90KzG60aC4o8KMBtWH-OGz3y9bTxw";
const bot = new TelegramBot(token, { polling: true });

const channel = { id: "-1002162795717", name: "Club Enigmario" };

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const userStates = {};

// Manejador de `callback_query`, registrado solo una vez
bot.on("callback_query", async (callbackQuery) => {
    const message = callbackQuery.message;
    const chatId = message.chat.id;

    // Recupera el correo electrónico almacenado para este chat en minúsculas
    const email = userStates[chatId]?.email?.toLowerCase();

    try {
        if (callbackQuery.data === "revoke_access") {
            await bot.sendMessage(chatId, "¿Estás seguro de que deseas revocar el acceso?", {
                reply_markup: {
                    inline_keyboard: [
                        [{ text: "Sí, revocar", callback_data: "confirm_revoke" }],
                        [{ text: "No, cancelar", callback_data: "cancel_revoke" }]
                    ]
                }
            });
        } else if (callbackQuery.data === "confirm_revoke") {
            const user = await correosUsados.findOne({ email: email }); // Búsqueda en minúsculas
            if (user) {
                // Expulsar al usuario del canal
                await bot.banChatMember(channel.id, user.telegramId);
                console.log(`User banned from the channel ${channel.name}`);
                
                // Eliminar al usuario de la base de datos
                await correosUsados.deleteOne({ email: email }); // Búsqueda en minúsculas
                console.log(`Usuario con correo ${email} eliminado de la base de datos.`);
                
                await bot.sendMessage(chatId, "Acceso revocado exitosamente.");
                const hasTelegramId = await searchContactByEmail(email);
                if (hasTelegramId && hasTelegramId.contactId) {
                    await updateTelegramId(hasTelegramId.contactId, chatId.toString());
                    unbanChatMember(chatId);  // Usar el telegramId del usuario
                }
            } else {
                console.log("No se encontró un usuario con ese correo electrónico.");
                await bot.sendMessage(chatId, "No se encontró un usuario con ese correo electrónico.");
            }
            // Continuar la conversación
            await bot.sendMessage(chatId, "Si tienes otro correo electrónico, por favor envíalo.");
            userStates[chatId] = "waiting_for_email";
        } else if (callbackQuery.data === "cancel_revoke") {
            // Cancelar la revocación
            await bot.sendMessage(chatId, "Revocación cancelada. El acceso no ha sido revocado.");
            // Continuar la conversación
            await bot.sendMessage(chatId, "Si tienes otro correo electrónico, por favor envíalo.");
            userStates[chatId] = "waiting_for_email";
        }
    } catch (err) {
        console.log(`Error al procesar la revocación: ${err}`);
        await bot.sendMessage(chatId, "Error al procesar tu solicitud. Por favor intenta nuevamente.");
    }
});

const handleEmailValidation = async (chatId, text) => {
    const email = text.toLowerCase(); // Asegurarse de que el correo esté en minúsculas
    if (emailRegex.test(email)) {
        // Almacena el correo electrónico en minúsculas en el estado del usuario
        userStates[chatId] = { email: email };

        try {
            const usedEmail = await correosUsados.findOne({ email: email }); // Búsqueda en minúsculas
            if (usedEmail) {
                await bot.sendMessage(
                    chatId,
                    "Este correo ya ha sido usado. Por favor, usa otro correo electrónico.",
                    {
                        reply_markup: {
                            inline_keyboard: [
                                [
                                    {
                                        text: "¿Quieres revocar el acceso?",
                                        callback_data: "revoke_access"
                                    }
                                ]
                            ]
                        }
                    }
                );
                return;
            }

            const userEmail = await UsedEmail.findOne({ email: email }); // Búsqueda en minúsculas
            if (userEmail && userEmail.isActive) {
                const hasTelegramId = await searchContactByEmail(email); // Asegurarse de buscar en minúsculas
                if (hasTelegramId && hasTelegramId.hasTelegramId) {
                    const inviteLink = await bot.createChatInviteLink(channel.id, {
                        member_limit: 1
                    });
                    await bot.sendMessage(
                        chatId,
                        "Gracias por enviar tu correo. Aquí está tu invitación:",
                        {
                            reply_markup: {
                                inline_keyboard: [
                                    [
                                        {
                                            text: "Únete al canal premium de Enigmario Picks💎",
                                            url: inviteLink.invite_link
                                        }
                                    ]
                                ]
                            }
                        }
                    );
                    await bot.sendMessage(chatId, "Gracias por tu compra.");
                    await bot.sendMessage(
                        chatId,
                        "Espero que tengas buena suerte en tus inversiones deportivas."
                    );
                    // Guardar el correo en la base de datos
                    const newUsedEmail = new correosUsados({
                        email: email,
                        telegramId: chatId
                    });
                    await newUsedEmail.save();
                } else {
                    // Informar al usuario que el bot está actualizando el Telegram ID
                    await bot.sendMessage(
                        chatId,
                        "Estamos actualizando tu ID de Telegram en nuestros registros..."
                    );

                    if (hasTelegramId && hasTelegramId.contactId) {
                        try {
                            await updateTelegramId(hasTelegramId.contactId, chatId.toString());
                            // Informar al usuario que la actualización ha finalizado
                            await bot.sendMessage(
                                chatId,
                                "Tu ID de Telegram ha sido actualizado con éxito."
                            );

                            // Crear el enlace de invitación al canal premium
                            const inviteLink = await bot.createChatInviteLink(channel.id, {
                                expire_date: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
                                member_limit: 1
                            });

                            // Enviar el enlace de invitación al usuario
                            await bot.sendMessage(
                                chatId,
                                "Gracias por tu compra. Aquí está tu invitación:",
                                {
                                    reply_markup: {
                                        inline_keyboard: [
                                            [
                                                {
                                                    text: "Únete al canal premium de Enigmario Picks💎",
                                                    url: inviteLink.invite_link
                                                }
                                            ]
                                        ]
                                    }
                                }
                            );
                            await bot.sendMessage(
                                chatId,
                                "Espero que tengas buena suerte en tus inversiones deportivas."
                            );

                            // Guardar el correo en la base de datos
                            const newUsedEmail = new correosUsados({
                                email: email,
                                telegramId: chatId
                            });
                            await newUsedEmail.save();
                        } catch (error) {
                            console.error("Error al actualizar el ID de Telegram:", error);
                            await bot.sendMessage(
                                chatId,
                                "Ocurrió un error al actualizar tu ID de Telegram. Por favor, intenta nuevamente."
                            );
                        }
                    }
                }
            } else {
                await bot.sendMessage(chatId, "No tienes membresía actualmente.", {
                    reply_markup: {
                        inline_keyboard: [
                            [
                                {
                                    text: "Tienda sharpods 💎",
                                    url: "https://sharpods.com/club"
                                }
                            ]
                        ]
                    }
                });
            }
        } catch (err) {
            console.log(`Error al verificar el correo: ${err}`);
            await bot.sendMessage(
                chatId,
                "Ocurrió un error al verificar tu correo. Por favor intenta nuevamente más tarde."
            );
        }
        userStates[chatId] = "waiting_for_welcome";
    } else {
        // Manejar correo electrónico no válido
        await bot.sendMessage(
            chatId,
            "Solo puedo recibir correos electrónicos. Por favor, envía un correo electrónico válido."
        );
    }
};

const welcomeUser = () => {
    bot.on("message", async (msg) => {
        const chatId = msg.chat.id;
        const text = msg.text;

        // Verificar si el mensaje proviene de un usuario individual
        if (msg.chat.type === "private") {
            if (!userStates[chatId] || userStates[chatId] === "waiting_for_welcome") {
                // Enviar mensaje de bienvenida si este es el primer mensaje o después de la validación del correo
                await bot.sendMessage(
                    chatId,
                    `Bienvenido al ${channel.name}, prepárate para obtener los mejores pronósticos y maximizar tus ganancias.`
                );
                await bot.sendMessage(
                    chatId,
                    `Por favor, envía tu email de usuario de Sharpods para continuar.`
                );
                userStates[chatId] = "waiting_for_email";
            } else if (userStates[chatId] === "waiting_for_email") {
                // Validar el correo electrónico
                await handleEmailValidation(chatId, text);
            }
        } else {
            console.log(
                `Mensaje recibido de un chat de tipo: ${msg.chat.type}. Ignorando...`
            );
        }
    });
};

const unbanChatMember = (telegramId) => {
  bot
    .unbanChatMember(channel.id, telegramId)
    .then(() => {
      console.log(`User unbanned from the channel ${channel.name}`);
    })
    .catch((err) => console.log(`Error al desbanear al usuario: ${err}`));
};

const kickChatMember = (telegramId) => {
  bot
    .banChatMember(channel.id, telegramId)
    .then(() => {
      console.log(`User kicked from the channel ${channel.name}`);
    })
    .catch((err) => console.log(`Error al expulsar al usuario: ${err}`));
};

module.exports = {
  welcomeUser,
  unbanChatMember,
  kickChatMember
};
