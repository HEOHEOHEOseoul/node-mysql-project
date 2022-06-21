const Twitter = require('twitter');
const client = new Twitter({
    consumer_key: '99OXlAaK0hoJYp1bajOk19bKp',
    consumer_secret: 'Rx6xD05Ht1h8anu7QVuv6NYRAkRnArni119lkCyCzfhqLhGJXp',
    access_token_key: '1442186609781137415-2CtpVB3QtNKva27Ojf0lIYmiLwnriS',
    access_token_secret: 'obUK18puZL5jsgMX73mPd1gaTw8AB6cUVaZXGN010fuf0'
});


function tweetPost(content) {
    client.post('statuses/update', {status: content}, (err, twt, res)=> {
        if(!err) console.log("twt success: "+ content);
        else console.log(err); 
    });
}

