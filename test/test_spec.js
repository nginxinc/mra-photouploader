const frisby = require('frisby');
const fs = require('fs');
const path = require('path');
const Joi = frisby.Joi; // Frisby exposes Joi for convenience
const https = require('https');

const agent = new https.Agent({
    rejectUnauthorized: false
});

/**
 * Every function in the uploader app.js file results in one or more calls to other services
 * so, this test has some initialization work to do before actually calling any of the
 * uploader functions. Specifically, an image is always associated with an album
 * and an album is always associated with a user, so we must first create the user
 * and an album
 *
 * First, a request is sent to the login service of pages to create a new user for testing
 *
 * Once we have a user ID, the Auth-ID header is set and a request is made to the album-manager
 * to create a test album. This follows the logical flow of ingenious.js in the pages
 * services
 *
 * The response to create the album includes an ID for the album, which is used
 * to create the image.
 *
 * The tests against the uploader service are nested with the afterJSON() function call
 * to the response from the album-manager post method
 */
describe('Create User Test Functions', function(){

    it('Create Test User', function(done){

        // First create a user
        frisby
            .setup({
                request: {
                    agent: agent
                }
            })
            .post('https://user-manager/v1/users', {
                email: 'uploader-test@nginxps.com',
                password: 'testing123'

            })
            .then(function(resp){
                console.log("Response:", resp);
            })
            .inspectRequestHeaders() // prints the headers
            .inspectHeaders()
            .expect('json', 'email', 'uploader-test@nginxps.com') // verify that the auth-id header is in the response
            .expect('status', 200) // login redirects to /account
            .then(function(resp) {

                // get the header from the response and set it to a variable
                console.log(resp.body.id);
                var authID = resp.body.id;

                // Use the user ID to create an album for the user
                return frisby
                    .setup({
                        request: {
                            headers: {
                                'Auth-ID': authID
                            },
                            agent: agent
                        }
                    })
                    .timeout(20000)
                    .post('https://album-manager/albums', {
                        'album[name]': 'testAlbum'
                    })
                    .then(function(resp){
                        console.log("Response:", resp.body)
                    })
                    .expect('status', 201) // ensure that we have a response
                    .inspectRequestHeaders()
                    .expect('jsonTypes', {
                        id: Joi.number().required(),
                        name: Joi.string().allow(null).required(),
                        description: Joi.string().allow(null).required(),
                        created_at: Joi.string().required(),
                        updated_at: Joi.string().required(),
                        user_id: Joi.string().required(),
                        poster_image_id: Joi.string().allow(null).required(),
                        state: Joi.string().required(),
                        images: Joi.array().required()
                    }) // validate the data of the newly created album
                    .then(function(resp){

                        console.log(resp);

                        // get the image and create a form to submit the image
                        var imagePath = path.resolve(__dirname, 'nginx.jpg');
                        var form = frisby.formData();

                        form.append('image', fs.createReadStream(imagePath), {
                            knownLength: fs.statSync(imagePath).size
                        });
                        form.append('album_id', resp.body.id);

                        // send a post request to create the image
                        return frisby // Post image
                            .setup({
                                request: {
                                    headers: {
                                        'Auth-ID': authID,
                                        'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
                                        'content-length': form.getLengthSync()
                                    }
                                }
                            })
                            .post('http://localhost:3000/image', {
                                body: form
                            })
                            // .inspectJSON() // print the response
                            .expect('status', 200) // verify the status
                            .expect('jsonTypes', {
                                id: Joi.number().required(),
                                name: Joi.string().allow(null).required(),
                                description: Joi.string().allow(null).required(),
                                created_at: Joi.string().required(),
                                updated_at: Joi.string().required(),
                                album_id: Joi.number().required(),
                                url: Joi.string().allow(null).required(),
                                thumb_url: Joi.string().required(),
                                thumb_height: Joi.number().required(),
                                thumb_width: Joi.number().required(),
                                medium_url: Joi.string().required(),
                                medium_height: Joi.number().required(),
                                medium_width: Joi.number().required(),
                                large_url: Joi.string().required(),
                                large_height: Joi.number().required(),
                                large_width: Joi.number().required()
                            }) // validate the JSON response and verify that all the images have been created
                            .then(function(resp) {
                                console.log("Response:", resp.body);

                                // Check resp urls
                                return Promise.all([
                                    frisby                         // Check thumb_url
                                        .get(resp.body.thumb_url)
                                        .expect('status', 200)
                                        .promise(),
                                    frisby                         // Check medium_url
                                        .get(resp.body.medium_url)
                                        .expect('status', 200),
                                    frisby                         // Check large_url
                                        .get(resp.body.large_url)
                                        .expect('status', 200),
                                    frisby                         // Delete Image
                                        .del('http://localhost:3000/image/uploads/photos/' + resp.body.id)
                                        .expect('status', 200)
                                        .expect('json', 'Images deleted successfully')
                                ])
                            })
                    })
            })
        .done(done);
    });
});