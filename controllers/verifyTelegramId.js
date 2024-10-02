const axios = require("axios");
const mongoose = require("mongoose");
const UsedEmailContactFunnelKit = require("../models/contactFunnelKit");
const connectDB = require("../db");
const UsedEmail = require("../models/UsedEmail");
require("dotenv").config();

const apiKey = '4d817055568f55827965e74a42f3679c';
const baseUrl = `http://sharpods.com/wp-json/funnelkit-automations/contact`;

async function searchContactByEmail(email) {

  try {
    const url = `${baseUrl}?api_key=${apiKey}&email=${email}`;
    const response = await axios.get(url, {
      headers: {
        "Content-Type": "application/json",
      },
    });

    const fields = response.data.data.contact.fields;
    console.log(fields, 23);
    if (fields["20"] === '' || fields["20"] === null) {
      return {
        hasTelegramId: false,
        contactId: response.data.data.contact.contact.id
      }
    } else if (fields.length < 2) {
      return {
        hasTelegramId: false,
        contactId: response.data.data.contact.contact.id
      }
    } else {
      return {
        hasTelegramId: true,
        contactId: response.data.data.contact.contact.id
      };
    }

  } catch (error) {
    console.error(
      "Error searching contact:",
      error.response ? error.response.data : error.message
    );
    return false;
  }
}



module.exports = {
  searchContactByEmail
};
