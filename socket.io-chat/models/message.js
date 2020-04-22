const mongoose = require("mongoose");


const MessageSchema = mongoose.Schema({
    text_message : {
        type : String,
        required : false
    },
    sender_name : {
        type : String,
        required : false
    },
    room : {
        type : String,
        required : false
    }
});

module.exports = mongoose.model('Message', MessageSchema);
