const { validationResult } = require('express-validator/check');
const fs = require('fs');
const path = require('path');

const isAuthenticated = require('../middleware/is_auth');
const Post = require('../models/post');
const User = require('../models/user');

exports.getPosts = async (req, res, next) => {

    const currentPage= req.query.page || 1;
    const perPage = 2;

    try {

        const count = await Post.find().countDocuments();
        
        if(!count) {
            const error = new Error('Unable to get count.');
            error.statusCode = 422;
            throw error;
        }

        const posts = await Post.find().populate('creator').skip((currentPage - 1) * perPage).limit(perPage);
        console.log('posts', posts)

        if(!posts) {
            const error = new Error('Unable to find the post list.');
            error.statusCode = 422;
            throw error;
        }
        res.status(200).json({
            message: 'successfully fetched the post list.',
            posts,
            totalItems: count
        });

    } catch(e) {
        if(!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }

};

exports.createPost = async (req, res, next) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
        console.log('errors from validation: ', errors);
        const error = new Error('Validation Failed. Entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }

    if(!req.file) {
        const error = new Error('Unable to get image file.');
        error.statusCode = 422;
        throw error;
    }

    const userId = req.userId;
    const title = req.body.title;
    const content = req.body.content;
    const imageUrl = req.file.path.replace("\\" ,"/");    

    if(!userId) {
        const error = new Error('Unable to get userId to create post.');
        error.statusCode = 422;
        throw error;
    }

    const post = new Post({
        title,
        imageUrl,
        content,
        creator: userId
    });

    try {

        await post.save();

        const user = await User.findById(userId);

        if(!user) {
            const error = new Error('Unable to find the user who posted');
            error.statusCode = 422;
            throw error;
        }

        // creatorProfile = user;
        user.posts = [ ...user.posts, post ];
        
        await user.save();

        res.status(201).json({
            message: 'Post created successfully',
            post,
            creator: { _id: user._id, name: user.name }
        });

    } catch(e) {
        
        if(!e.statusCode) {
            // server side error
            e.statusCode = 500;
        }
        next(e);
    }
}

exports.getPost = async (req, res, next) => {

    const postId = req.params.postId;

    try {

        const post = await Post.findById(postId);

        if(!post) {
            const error = new Error('Unable to find post.');
            error.statusCode = 404;
            throw error;
        }

        res.status(200).json({ 
            message: 'The post successfully fetched.',
            post 
        });


    } catch(e) {

        if(!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }

};

exports.updatePost = async (req, res, next) => {

    const postId = req.params.postId;
    const userId = req.userId;
    const errors = validationResult(req);

    if(!errors.isEmpty()) {
        const error = new Error('Validation Failed. Entered data is incorrect.');
        error.statusCode = 422;
        throw error;
    }

    const { title, content } = req.body;
    let imageUrl = req.body.image;

    console.log('imageUrl: ', imageUrl);

    if(req.file) {
        imageUrl = req.file.path.replace("\\" ,"/");
    }

    if(!imageUrl) {
        const error = new Error('Unable to find image Error');
        error.statusCode = 422;
        throw error;
    }

    try {
        const post = await Post.findById(postId);
        
        if(!post) {
            const error = new Error('Unable to find the post to be updated.');
            error.statusCode = 422;
            throw error;
        }

        if(post.creator.toString() !== userId) {
            const error = new Error('The post is not for the current logged-in user');
            error.statusCode = 403;
            throw error;
        }

        if(imageUrl !== post.imageUrl) {
            clearImage(post.imageUrl);
        }

        post.title = title;
        post.imageUrl = imageUrl;
        post.content = content;

        const updatedPost = await post.save();
    
        res.status(200).json({
            message: 'successfully updated',
            post: updatedPost
        });

    } catch(e) {

        if(!e.statusCode) {
            e.statusCode = 500;
        }
        next(e);
    }
};

exports.deletePost= async (req, res, next) => {
    const postId = req.params.postId;
    const userId = req.userId;

    try {
        const post = await Post.findById(postId);

        if(!post) {
            const error = new Error('Unable to find the post to delete');
            error.statusCode = 422;
            throw error;
        }
        // console.log('post in delete ====================================> : ', post)
        if(post.creator.toString() !== userId) {
            const error = new Error('The post is not for the current logged-in user');
            error.statusCode = 403;
            throw error;
        }

        clearImage(post.imageUrl);

        await Post.findOneAndDelete({_id: postId});

        const user = await User.findById(userId);
        user.posts.pull(postId); // ****** when delete ref: Schema.Types.ObjectId !!!

        await user.save();

        res.status(200).json({
            message: 'successfully deleted',
        });

    } catch(e) {
        if(!e.statusCode){
            e.statusCode = 500;
        }
        next(e);
    }

};

const clearImage = filePath => {
    console.log('filePath argument in clearImage function', filePath)
    filePath = path.join(__dirname, '..', filePath);
    fs.unlink(filePath, err => {
        console.log(err);
    });
};
