const admin = require('firebase-admin');

var serviceAccount = require("./ecoso.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://ecoso-b0b58.firebaseio.com"
});

const functions = require('firebase-functions');
const firestore = admin.firestore();

// // Create and Deploy Your First Cloud Functions
// // https://firebase.google.com/docs/functions/write-firebase-functions
//
// exports.helloWorld = functions.https.onRequest((request, response) => {
//  response.send("Hello from Firebase!");
// });

exports.treeListener = functions.firestore
.document('users/{userID}/posts/{postID}')
.onUpdate((snapshot, context) => {
    const dataAfter = snapshot.after.data()
    const databefore = snapshot.before.data()
    if (dataAfter !== databefore) {
        firestore.collection('users').doc(context.params.userID).collection('posts').onSnapshot(snap => {
            let postCount = 0, tree = 0;
            snap.docChanges().forEach(doc => {
                if (doc.type === 'added' || doc.type === 'modified') {
                    const post = doc.doc.data();
                    tree += Math.round(post.likes.count / 500);
                    tree += Math.round(post.comments.count / 200);
                    if (post.likes.count > 500) {
                        postCount++;
                    }
                }
            });
            tree += Math.round(postCount / 200);
            console.log(tree)
            firestore.collection('users').doc(context.params.userID).update('tree', tree);
        })
    }
});

exports.countCreatePost = functions.firestore.document('users/{userID}/posts/{postID}')
.onCreate((snapshot, context) => {
    firestore.collection('users').doc(context.params.userID).collection('posts').onSnapshot(snap => {
        firestore.collection('users').doc(context.params.userID).update('postCount', snap.docs.length)
    })
})

exports.countDeletePost = functions.firestore.document('users/{userID}/posts/{postID}')
.onDelete((snapshot, context) => {
    firestore.collection('users').doc(context.params.userID).collection('posts').onSnapshot(snap => {
        firestore.collection('users').doc(context.params.userID).update('postCount', snap.docs.length)
    })
})