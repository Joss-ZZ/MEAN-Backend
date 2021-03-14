const { response } = require("express");
const Usuario = require("../models/Usuario");
const bcrypt = require('bcryptjs');

const fs = require('fs');
const path = require('path');

const cloudinary = require('cloudinary');
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_NAME,
    api_key: process.env.CLOUDINARY_KEY,
    api_secret: process.env.CLOUDINARY_SECRET
});


const listarUsuarios = async(req, res = response)=> {

    try{

        const usuariosDB = await Usuario.find();

        res.json({
            ok: true,
            usuariosDB
        })

    }catch(error){
        console.log(error);
        res.status(500).json({
            ok: false,
            msg: 'Póngase en contacto con el administrador'
        })
    }

}

const actualizarUsuario = async(req, res = response)=> {

    const id = req.params.id;
    const body = req.body;

    try {

        const userBD = await Usuario.findById(id);
        if(!userBD) {
            return res.status(400).json({
                ok: false,
                msg: 'El usuario no existe'
            })
        }

        if(body.email !== userBD.email){
            const emailExiste = await Usuario.findOne({email: body.email});
            if(emailExiste){
                return res.status(400).json({
                    ok: false,
                    msg: 'El email ya existe'
                })
            }
        }


        if(!req.files){
            userBD.nombre = body.nombre;
            userBD.email = body.email;

            userBD.save();

            return res.json({
                ok: true,
                uid: userBD.id,
                nombre: userBD.nombre,
                email: userBD.email,
                img_url: userBD.img_url,
                public_id: userBD.public_id
            });
        }

        // The name of the input field (i.e. "sampleFile") is used to retrieve the uploaded file
        let archivo = req.files.archivo;
            
        // Extensiones permitidas
        let extensionesValidas = ['png', 'jpg', 'gif', 'jpeg'];
            
        let nombreCortado = archivo.name.split('.');
        let extension = nombreCortado[nombreCortado.length-1]; 
            
        if(extensionesValidas.indexOf(extension)<0){
            return res.status(400).json({
                ok: false,
                msg: `Solo están pemitidas las siguientes extensiones: ${extensionesValidas.join(', ')}`,
                ext: extension
            });
        }

        let pathImagen = `${id}-${ new Date().getMilliseconds() }.${extension}`; 

            // Use the mv() method to place the file somewhere on your server
        archivo.mv(`public/imagenes/usuarios/${pathImagen}`, async(err) => {
            if (err)
              return res.status(500).json({
                  ok: false,
                  err
              });
          
            if(userBD.public_id){
                await cloudinary.v2.uploader.destroy(userBD.public_id);
                guardarImagen(userBD, pathImagen, body, res);
            }else{
                guardarImagen(userBD, pathImagen, body, res);
            }
        });
        
    } catch (error) {
        console.log(error);
        return res.status(500).json({
            ok: false,
            msg: 'Póngase en contacto con el administrador'
        });
    }
  
}

const guardarImagen = async(userBD, pathImagen, body, res)=> {

    const pathImagenDB = path.resolve(__dirname, `../../public/imagenes/usuarios/${pathImagen}`);
    const imageInfo = await cloudinary.v2.uploader.upload(pathImagenDB);
    eliminarImagen(pathImagen);
    userBD.nombre = body.nombre;
    userBD.email = body.email;
    userBD.img_url = imageInfo.url;
    userBD.public_id = imageInfo.public_id;
    userBD.save();

    return res.json({
        ok: true,
        uid: userBD.id,
        nombre: userBD.nombre,
        email: userBD.email,
        img_url: userBD.img_url,
        public_id: userBD.public_id
    })

}

function eliminarImagen(nombreImagen) {

    const pathImagenDB = path.resolve(__dirname, `../../public/imagenes/usuarios/${nombreImagen}`);

    if(fs.existsSync(pathImagenDB)){
        fs.unlinkSync(pathImagenDB);
    }

}


module.exports = {
    listarUsuarios,
    actualizarUsuario
}