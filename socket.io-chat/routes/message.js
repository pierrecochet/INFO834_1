const express = require('express');
const router = express.Router();
const messageModel = require('../models/message');

router.get('/',async (req,res)=>{

    try{
        const messagesFound = await messageModel.find();
        res.json(messagesFound);
    }catch (e) {
        res.json({message : e });
    }
});

router.get('/example1',(req,res)=>{
    res.send('example1 from posts');
});

router.get('/:room', async (req,res)=>{
    try{
        const post = await messageModel.find({room : req.params.room});
        res.json(post);
    }catch (e) {
        res.json({message : e});
    }
});

router.post('/', async (req,res) => {
    const messages = new messageModel({
        text_message : req.body.text_message,
        sender_name : req.body.sender_name,
        room : req.body.room
    });
    try{
        const savedmessages = await messages.save();
        res.json(savedmessages);
    }catch (e) {
        res.json({message : e});
    }
});

router.get('/:messageId', async (req,res)=>{
    try{
        const post = await messageModel.findById(req.params.messageId);
        res.json(post);
    }catch (e) {
        res.json({message : e});
    }
});

router.delete('/:messageId', async (req,res) =>{
    //param "_id" généré automatiquement par mongo on l'utilise pour suppr l'objet

    try {
        const deletedPost = await messageModel.remove({ _id : req.params.messageId});
        res.json(deletedPost);
    }catch (e) {
        res.json({message : e});
    }
});

//update a post
router.patch('/:messageId', async (req, res)=>{
    try{
        const updatedAppareil = await messageModel.updateOne(
            { _id : req.params.messageId},
            {$set:{ name : req.body.name}}
        );
        res.json(updatedAppareil);
    } catch (e) {
        res.json({message : e});
    }
});


module.exports = router;
