const frisby = require('frisby');
const fs = require('fs');
const path = require('path');
const FormData = require('form-data');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

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
        // First, create a user
        let form = frisby.formData();

        form.append('email', 'uploader-test@nginxps.com');
        form.append('password', 'testing123');
        frisby
            .post('https://pages/login', {
                body: form,
                json: false
            })
            .then(function(json){
                console.log("Headers:", json);
            })
            .inspectHeaders() // prints the headers
            // .expect('header', 'auth-id') // verify that the auth-id header is in the response
            // .expect('status', 302) // login redirects to /account
            // .then(function(json) {

            //     // get the header from the response and set it to a variable
            //     console.log(this.current.response.headers['auth-id']);
            //     var authID = this.current.response.headers['auth-id'];

            //     // Use the user ID to create an album for the user
            //     frisby.create('Create an album for the user')
            //         .post('https://album-manager/albums', {'album[name]': 'testAlbum'}, {json:false})
            //         .addHeader('Auth-ID', authID)
            //         .expect('status', 201) // ensure that we have a response
            //         .expectJSONTypes({
            //             id:Number,
            //             name:String,
            //             description: null,
            //             created_at: String,
            //             updated_at: String,
            //             user_id: String,
            //             poster_image_id: null,
            //             state: String,
            //             images: Array
            //         }) // validate the data of the newly created album
            //         .afterJSON(function(json){

            //             console.log(json);

            //             // get the image and create a form to submit the image
            //             var imagePath = path.resolve(__dirname, 'nginx.jpg');
            //             var form = new FormData({});

            //             form.append('image', fs.createReadStream(imagePath), {
            //                 knownLength: fs.statSync(imagePath).size
            //             });
            //             form.append('album_id', json.id);


            //             // send a post request to create the image
            //             frisby.create('Post image')
            //                 .post('http://localhost:3000/image', form, {
            //                     json:false,
            //                     headers: {
            //                         'Auth-ID': authID,
            //                         'content-type': 'multipart/form-data; boundary=' + form.getBoundary(),
            //                         'content-length': form.getLengthSync()
            //                     }
            //                 })
            //                 .inspectJSON() // print the response
            //                 .expect('status', 200) // verify the status
            //                 .expectJSONTypes({
            //                     id: Number,
            //                     name: null,
            //                     description: null,
            //                     created_at: String,
            //                     updated_at: String,
            //                     album_id: Number,
            //                     url: null,
            //                     thumb_url: String,
            //                     thumb_height: Number,
            //                     thumb_width: Number,
            //                     medium_url: String,
            //                     medium_height: Number,
            //                     medium_width: Number,
            //                     large_url: String,
            //                     large_height: Number,
            //                     large_width: Number
            //                 }) // validate the JSON response and verify that all the images have been created
            //                 .afterJSON(function(json) {
            //                     frisby.create('Check thumb_url')
            //                         .get(json.thumb_url)
            //                         .expect('status', 200)
            //                         .done()
            //                 })
            //                 .afterJSON(function(json) {
            //                     frisby.create('Check medium_url')
            //                         .get(json.medium_url)
            //                         .expect('status', 200)
            //                         .done()
            //                 })
            //                 .afterJSON(function(json) {
            //                     frisby.create('Check large_url')
            //                         .get(json.large_url)
            //                         .expect('status', 200)
            //                         .done()
            //                 }).afterJSON(function(json){
            //                     frisby.create('Delete image')
            //                         .delete('http://localhost:3000/image/uploads/photos/' + json.id)
            //                         .expect('status', 200)
            //                         .expectBodyContains('Images deleted successfully')
            //                         .done();
            //                 })
            //                 .done();

            //         })
            //         .done();
            // })
            .done(done);
    });
})