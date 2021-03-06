const { Schema, model } = require('mongoose');

const UsuarioSchema = Schema({
    nombre: {
        type: String,
        required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    img_url: {
        type: String,
        required: false
    },
    public_id: {
        type: String,
        required: false
    }
});

module.exports = model('Usuario', UsuarioSchema);