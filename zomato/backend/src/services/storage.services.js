const ImageKit = require('imagekit');

let imagekit;
function getClient() {
    // created lazily so the server can boot even before ImageKit keys are set
    if (!imagekit) {
        imagekit = new ImageKit({
            publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
            privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
            urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
        });
    }
    return imagekit;
}

async function uploadFile(file, fileName) {
    const result = await getClient().upload({
        file: file,
        fileName: fileName,
        folder: '/food-reels',
    });
    return result;
}

async function deleteFile(fileId) {
    if (!fileId) return;
    await getClient().deleteFile(fileId);
}

module.exports = { uploadFile, deleteFile };
